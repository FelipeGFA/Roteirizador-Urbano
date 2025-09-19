import pandas as pd
import logging

COLUNA_RECURSO = 'Recurso'
COLUNA_VALOR_CONTRATO = 'Valor Total Contrato'
COLUNA_LAT = 'Latitude'
COLUNA_LON = 'Longitude'
COLUNA_STATUS = 'Status da Atividade'
COLUNA_CODE = 'Code'
COLUNA_INSTALACAO = 'Instalação'
COLUNA_MEDIDOR = 'Medidor'
COLUNA_CONTACONTRATO = 'Conta Contrato'

def normalizar_coordenada(coord, max_val):
    try:
        coord_float = float(coord)
        if abs(coord_float) <= max_val:
            return round(coord_float, 6)
    except (ValueError, TypeError):
        pass

    try:
        coord_limpa = str(coord).replace('.', '').replace(',', '').strip()
        
        if not coord_limpa or coord_limpa == '-':
            # Retorna um valor padrão se a string for vazia ou inválida.
            return -35.0 if max_val == 180 else -9.0

        is_negativo = coord_limpa.startswith('-')
        num_abs_str = coord_limpa[1:] if is_negativo else coord_limpa

        if not num_abs_str.isdigit():
             # Se após a limpeza ainda não for um número, não podemos processar.
             raise ValueError(f"String não numérica após limpeza: {num_abs_str}")

        pos_ponto = 0
        if max_val == 90:  
            if num_abs_str.startswith(('0', '1', '2', '3')):
                pos_ponto = 2
            else:
                pos_ponto = 1
        else:  
            pos_ponto = 2

        if len(num_abs_str) <= pos_ponto:
            pos_ponto = 1

        coord_final_str = num_abs_str[:pos_ponto] + '.' + num_abs_str[pos_ponto:]
        if is_negativo:
            coord_final_str = '-' + coord_final_str
        
        normalized_coord = float(coord_final_str)
        logging.debug(f"Coordenada {coord} corrigida para {normalized_coord}")
        return round(normalized_coord, 6)

    except (ValueError, TypeError):
        logging.warning(f"Não foi possível normalizar a coordenada: {coord}. Usando valor padrão.")
        return -35.0 if max_val == 180 else -9.0

def processar_planilha(stream_arquivo, recursos, codes_selecionados=None):
    try:
        df = pd.read_excel(stream_arquivo, dtype={
            COLUNA_CONTACONTRATO: str,
            COLUNA_INSTALACAO: str,
            COLUNA_MEDIDOR: str
        })
        
        colunas_numericas = [COLUNA_VALOR_CONTRATO, COLUNA_LAT, COLUNA_LON]
        for col in colunas_numericas:
            df[col] = pd.to_numeric(df[col], errors='coerce')

        df.dropna(subset=colunas_numericas + [COLUNA_CODE], inplace=True)
        df = df[df[COLUNA_CODE].astype(str).str.strip() != '']

        # Log de coordenadas antes da normalização para debug
        logging.info(f"Coordenadas antes da normalização - LAT: {df[COLUNA_LAT].head().tolist()}, LON: {df[COLUNA_LON].head().tolist()}")

        df[COLUNA_LAT] = df[COLUNA_LAT].apply(lambda x: normalizar_coordenada(x, 90))
        df[COLUNA_LON] = df[COLUNA_LON].apply(lambda x: normalizar_coordenada(x, 180))

        # Log de coordenadas depois da normalização
        logging.info(f"Coordenadas depois da normalização - LAT: {df[COLUNA_LAT].head().tolist()}, LON: {df[COLUNA_LON].head().tolist()}")

        # Verificação adicional: forçar normalização em todas as coordenadas novamente
        logging.info("Aplicando segunda passagem de normalização...")
        df[COLUNA_LAT] = df[COLUNA_LAT].apply(lambda x: normalizar_coordenada(x, 90))
        df[COLUNA_LON] = df[COLUNA_LON].apply(lambda x: normalizar_coordenada(x, 180))

        # Validação final das coordenadas
        invalid_coords = df[(abs(df[COLUNA_LAT]) > 90) | (abs(df[COLUNA_LON]) > 180)]
        if not invalid_coords.empty:
            logging.warning(f"Encontradas {len(invalid_coords)} coordenadas inválidas após segunda normalização")
            logging.warning(f"Coordenadas inválidas: {invalid_coords[[COLUNA_LAT, COLUNA_LON]].head().to_dict('records')}")
            # Remove coordenadas inválidas
            df = df[(abs(df[COLUNA_LAT]) <= 90) & (abs(df[COLUNA_LON]) <= 180)]

        if COLUNA_STATUS in df.columns:
            df[COLUNA_STATUS] = df[COLUNA_STATUS].astype(str).fillna('N/A')
        else:
            df[COLUNA_STATUS] = 'N/A'

        status_validos = ['pendente', 'iniciado', 'concluído', 'não concluído']
        df = df[df[COLUNA_STATUS].str.lower().isin(status_validos)]
        
        # Modificado para filtrar com base em uma lista de recursos
        df_filtrado = df[df[COLUNA_RECURSO].astype(str).isin(recursos)].copy()

        if codes_selecionados and len(codes_selecionados) < 3:
            mask = pd.Series(False, index=df_filtrado.index)
            if 'Demais Serviços' in codes_selecionados:
                mask |= ~df_filtrado[COLUNA_CODE].isin(['SFRT', 'SFNR'])
            
            outros_codes = [c for c in codes_selecionados if c != 'Demais Serviços']
            if outros_codes:
                mask |= df_filtrado[COLUNA_CODE].isin(outros_codes)
            
            if mask.any():
                df_filtrado = df_filtrado[mask]
        
        colunas_output = [
            COLUNA_RECURSO, COLUNA_VALOR_CONTRATO, COLUNA_LAT, COLUNA_LON, 
            COLUNA_CODE, COLUNA_STATUS, COLUNA_CONTACONTRATO, COLUNA_MEDIDOR, 
            COLUNA_INSTALACAO
        ]
        df_output = df_filtrado[colunas_output].copy()
        df_output[COLUNA_CODE] = df_output[COLUNA_CODE].fillna('')

        # Substitui NaN por None para compatibilidade com JSON
        df_output = df_output.where(pd.notnull(df_output), None)

        return {
            recurso: group.to_dict('records')
            for recurso, group in df_output.groupby(COLUNA_RECURSO)
        }
    
    except Exception as e:
        logging.error(f"Erro fatal ao processar o arquivo: {e}", exc_info=True)
        return None
