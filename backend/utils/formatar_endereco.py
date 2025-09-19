import logging
import requests
from functools import lru_cache

PONTOS_INICIAIS = [
    {
        "prefixo": "AL-MTC-C",
        "range": [1, 5],
        "coords": {"Latitude": -9.155697, "Longitude": -35.523353}
    },
    {
        "prefixo": "AL-PCV-C",
        "range": [1, 1],
        "coords": {"Latitude": -9.155697, "Longitude": -35.523353}
    },
    {
        "prefixo": "AL-MCZ-C",
        "range": [18, 35],
        "coords": {"Latitude": -9.659398, "Longitude": -35.740825}
    },
    {
        "prefixo": "AL-RLU-C",
        "range": [1, 6],
        "coords": {"Latitude": -9.501750, "Longitude": -35.838500}
    },
    {
        "prefixo": "AL-SMC-C",
        "range": [1, 3],
        "coords": {"Latitude": -9.773510, "Longitude": -36.089400}
    },
    {
        "prefixo": "AL-MCZ-C",
        "range": [1, 17],
        "coords": {"Latitude": -9.566120, "Longitude": -35.765700}
    },
    {
        "prefixo": "AL-MCZ-C",
        "range": [41, 41],
        "coords": {"Latitude": -9.462588, "Longitude": -35.549205}
    },
    {
        "prefixo": "AL-UPM-C",
        "range": [1, 3],
        "coords": {"Latitude": -9.146661, "Longitude": -36.038027}
    },
    {
        "prefixo": "AL-MCI-C",
        "range": [1, 1],
        "coords": {"Latitude": -9.319531, "Longitude": -35.936093}
    },
    {
        "prefixo": "AL-MCZ-D",
        "range": [1, 7],
        "coords": {"Latitude": -9.566061, "Longitude": -35.765674}
    },
    {
        "prefixo": "AL-MCZ-D",
        "range": [8, 12],
        "coords": {"Latitude": -9.658853, "Longitude": -35.740326}
    }
]

DEFAULT_PONTO_INICIAL = {"Latitude": -9.619990, "Longitude": -35.739346}

def get_ponto_inicial_backend(recurso):
    try:
        # Extrai o número da equipe do nome do recurso (ex: 'AL-MCZ-C001M' -> 1)
        numero_equipe_str = ''.join(filter(str.isdigit, recurso))
        numero_equipe = int(numero_equipe_str) if numero_equipe_str else None
    except (ValueError, TypeError):
        numero_equipe = None
        logging.warning(f"Não foi possível extrair número do recurso: {recurso}")

    for regra in PONTOS_INICIAIS:
        # Verifica se o prefixo do recurso corresponde à regra
        if recurso.startswith(regra["prefixo"]):
            if "range" not in regra:
                return regra["coords"]
            
            if numero_equipe is not None:
                min_val, max_val = regra["range"]
                if min_val <= numero_equipe <= max_val:
                    return regra["coords"]

    logging.warning(f"Nenhuma regra encontrada para '{recurso}'. Usando ponto de partida padrão.")
    return DEFAULT_PONTO_INICIAL


def encurtar_endereco(endereco_completo):
    if not isinstance(endereco_completo, str):
        return "Endereço inválido"

    partes = [p.strip() for p in endereco_completo.split(',')]
    if len(partes) < 5:
        return endereco_completo

    resultado_transformado = []
    maceio_adicionado = False
    for p in partes:
        p_lower = p.lower()
        if "região nordeste" in p_lower or "brasil" in p_lower:
            continue
        if "região geográfica" in p_lower:
            if not maceio_adicionado:
                resultado_transformado.append("Maceió")
                maceio_adicionado = True
        else:
            resultado_transformado.append(p)
    
    return ', '.join(list(dict.fromkeys(resultado_transformado)))

@lru_cache(maxsize=128)
def obter_endereco(lat, lon):
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
        headers = {'User-Agent': 'RotasApp/1.0'}
        response = requests.get(url, headers=headers, timeout=5)
        response.raise_for_status()
        data = response.json()
        endereco_completo = data.get('display_name', 'Endereço não encontrado')
        return encurtar_endereco(endereco_completo)
    except requests.RequestException as e:
        logging.error(f"Erro ao buscar endereço para {lat},{lon}: {e}")
        return "Erro ao buscar endereço"
    except Exception as e:
        logging.error(f"Erro inesperado em obter_endereco: {e}")
        return "Erro inesperado"
