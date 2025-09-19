import base64
import locale
from io import BytesIO
from fpdf import FPDF
from .formatar_endereco import obter_endereco

COLUNA_LAT = 'Latitude'
COLUNA_LON = 'Longitude'
COLUNA_STATUS = 'Status da Atividade'
COLUNA_VALOR_CONTRATO = 'Valor Total Contrato'
COLUNA_INSTALACAO = 'Instalação'
COLUNA_MEDIDOR = 'Medidor'
COLUNA_CONTACONTRATO = 'Conta Contrato'
COLUNA_CODE = 'Code'

CORES_STATUS_PDF = {
    'pendente': (255, 222, 0),
    'iniciado': (169, 132, 184),
    'não concluído': (96, 206, 206),
    'concluído': (27, 56, 197),
}

class PDF(FPDF):
    def header(self):
        pass

    def footer(self):
        pass

def calcular_num_linhas(pdf, texto, largura_celula):
    palavras = str(texto).split(' ')
    linhas = 1
    linha_atual = ""
    for palavra in palavras:
        if pdf.get_string_width(linha_atual + palavra + ' ') < largura_celula:
            linha_atual += palavra + ' '
        else:
            linhas += 1
            linha_atual = palavra + ' '
    return linhas

def desenhar_legenda_pdf(pdf):
    original_x = pdf.get_x()
    original_y = pdf.get_y()
    
    legenda_itens = [
        ('Pendente', CORES_STATUS_PDF['pendente']),
        ('Iniciado', CORES_STATUS_PDF['iniciado']),
        ('Não concluído', CORES_STATUS_PDF['não concluído']),
        ('Concluído', CORES_STATUS_PDF['concluído'])
    ]
    
    start_x = 245
    y_pos = 20
    pdf.set_font('Arial', '', 9)
    circle_diameter = 3
    line_height = 5

    for texto, cor in legenda_itens:
        pdf.set_xy(start_x, y_pos)
        pdf.set_fill_color(cor[0], cor[1], cor[2])
        pdf.ellipse(start_x, y_pos + (line_height - circle_diameter) / 2, circle_diameter, circle_diameter, 'F')
        
        pdf.set_xy(start_x + circle_diameter + 2, y_pos)
        pdf.cell(0, line_height, texto, 0, 1, 'L')
        y_pos += line_height
        
    pdf.set_xy(original_x, original_y)

def gerar_urls_google_maps(pontos):
    if not pontos or len(pontos) < 2:
        return []

    urls = []
    max_pontos_por_url = 25

    pontos_restantes = pontos
    while len(pontos_restantes) > 1:
        chunk_pontos = pontos_restantes[:max_pontos_por_url]
        
        coordenadas = [f"{p.get(COLUNA_LAT)},{p.get(COLUNA_LON)}" for p in chunk_pontos]
        urls.append(f"https://www.google.com/maps/dir/{'/'.join(coordenadas)}")
        
        if len(pontos_restantes) <= max_pontos_por_url:
            break
        
        # O último ponto do trecho atual é o primeiro do próximo
        pontos_restantes = pontos_restantes[max_pontos_por_url - 1:]

    return urls

def gerar_pdf_rota(dados_rota):
    pdf = PDF('L', 'mm', 'A4')
    pdf.set_auto_page_break(auto=False, margin=15)

    if imagem_base64 := dados_rota.get('imagem_mapa'):
        pdf.add_page()
        dados_imagem = base64.b64decode(imagem_base64.split(',')[1])
        pdf.image(BytesIO(dados_imagem), x=10, y=20, w=277)
    
    pdf.add_page()
    
    desenhar_legenda_pdf(pdf)

    recurso = dados_rota.get('recurso', 'N/A')
    pdf.set_font('Arial', 'B', 16)
    pdf.cell(0, 10, f'{recurso}', 0, 1, 'L')
    
    urls_gmaps = gerar_urls_google_maps(dados_rota.get('pontos', []))
    if urls_gmaps:
        pdf.set_font('Arial', '', 20)
        pdf.set_text_color(4, 85, 192)
        for i, url in enumerate(urls_gmaps):
            link_text = 'Rota no Google Maps'
            if len(urls_gmaps) > 1:
                link_text += f' (Parte {i+1})'
            pdf.cell(0, 10, link_text, link=url, ln=1)
        pdf.set_text_color(0, 0, 0)
        pdf.ln(6)

    pdf.ln(5)

    colunas = {
        'Ponto': 10, 'Valor Contrato': 29, 'Status': 21, 'Instalação': 25, 
        'Medidor': 28, 'Conta Contrato': 26, 'Code': 18, 'Latitude': 20, 
        'Longitude': 25, 'Endereço': 83
    }

    def desenhar_cabecalho():
        pdf.set_font('Arial', 'B', 7)
        for nome, largura in colunas.items():
            pdf.cell(largura, 10, nome, 1, 0, 'C')
        pdf.ln()
        pdf.set_font('Arial', '', 10)

    desenhar_cabecalho()
    
    pontos = dados_rota.get('pontos', [])[1:]
    if not pontos:
        return bytes(pdf.output())

    for i, ponto in enumerate(pontos):
        lat = ponto.get(COLUNA_LAT)
        lon = ponto.get(COLUNA_LON)
        endereco = obter_endereco(lat, lon) if lat and lon else "Coordenadas inválidas"
        try:
            valor_contrato = locale.currency(ponto.get(COLUNA_VALOR_CONTRATO, 0), symbol=True, grouping=True)
        except (locale.Error, ValueError):
            valor_contrato = f"R$ {ponto.get(COLUNA_VALOR_CONTRATO, 0):.2f}"
        
        dados_linha = {
            'Ponto': str(i + 1),
            'Valor Contrato': valor_contrato,
            'Status': ponto.get(COLUNA_STATUS, 'N/A'),
            'Instalação': ponto.get(COLUNA_INSTALACAO, 'N/A'),
            'Medidor': ponto.get(COLUNA_MEDIDOR, 'N/A'),
            'Conta Contrato': ponto.get(COLUNA_CONTACONTRATO, 'N/A'),
            'Code': ponto.get(COLUNA_CODE, 'N/A'),
            'Latitude': str(ponto.get(COLUNA_LAT, 'N/A')),
            'Longitude': str(ponto.get(COLUNA_LON, 'N/A')),
            'Endereço': endereco
        }

        line_height = 5
        max_lines = 0
        for nome, valor in dados_linha.items():
            largura_celula = colunas.get(nome, 0) - 4
            if largura_celula > 0:
                num_linhas = calcular_num_linhas(pdf, valor, largura_celula)
                max_lines = max(max_lines, num_linhas)
        
        altura_linha = max(10, max_lines * line_height + 2)

        if pdf.get_y() + altura_linha > 195:
            pdf.add_page()
            desenhar_cabecalho()

        status_lower = ponto.get(COLUNA_STATUS, 'N/A').lower().strip()
        cor_fundo = CORES_STATUS_PDF.get(status_lower)

        y_inicial = pdf.get_y()
        x_atual = pdf.get_x()

        if cor_fundo:
            pdf.set_fill_color(cor_fundo[0], cor_fundo[1], cor_fundo[2])
            pdf.rect(x_atual, y_inicial, sum(colunas.values()), altura_linha, 'F')

        if status_lower in ['pendente', 'não concluído']:
            pdf.set_text_color(0, 0, 0)
        elif cor_fundo:
            pdf.set_text_color(255, 255, 255)

        for nome, valor in dados_linha.items():
            largura = colunas[nome]
            align = 'L' if nome == 'Endereço' else 'C'
            if nome == 'Valor Contrato':
                align = 'R'
            
            pdf.rect(x_atual, y_inicial, largura, altura_linha)
            pdf.set_xy(x_atual + 2, y_inicial + 1)
            pdf.multi_cell(largura - 4, line_height, str(valor), 0, align)
            x_atual += largura
        
        pdf.set_y(y_inicial + altura_linha)
        pdf.set_text_color(0, 0, 0)

    return bytes(pdf.output())
