import io
import pandas as pd
from .formatar_endereco import obter_endereco

COLUNA_LAT = 'Latitude'
COLUNA_LON = 'Longitude'
COLUNA_STATUS = 'Status da Atividade'
COLUNA_VALOR_CONTRATO = 'Valor Total Contrato'
COLUNA_INSTALACAO = 'Instalação'
COLUNA_MEDIDOR = 'Medidor'
COLUNA_CONTACONTRATO = 'Conta Contrato'
COLUNA_CODE = 'Code'

def gerar_planilha_rota(dados_rota):
    pontos = dados_rota.get('pontos', [])[1:]
    if not pontos:
        return None

    dados_para_planilha = []
    for i, ponto in enumerate(pontos):
        lat = ponto.get(COLUNA_LAT)
        lon = ponto.get(COLUNA_LON)
        
        dados_para_planilha.append({
            'Ponto': str(i + 1),
            'Valor Contrato': ponto.get(COLUNA_VALOR_CONTRATO, 0),
            'Status': ponto.get(COLUNA_STATUS, 'N/A'),
            'Instalação': ponto.get(COLUNA_INSTALACAO, 'N/A'),
            'Medidor': ponto.get(COLUNA_MEDIDOR, 'N/A'),
            'Conta Contrato': ponto.get(COLUNA_CONTACONTRATO, 'N/A'),
            'Code': ponto.get(COLUNA_CODE, 'N/A'),
            'Latitude': str(ponto.get(COLUNA_LAT, 'N/A')),
            'Longitude': str(ponto.get(COLUNA_LON, 'N/A')),
            'Endereço': obter_endereco(lat, lon) if lat and lon else "Coordenadas inválidas"
        })

    df = pd.DataFrame(dados_para_planilha)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Rota')
    
    output.seek(0)
    return output.getvalue()
