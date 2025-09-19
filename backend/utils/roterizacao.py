import os
import logging
import openrouteservice
from openrouteservice.optimization import Vehicle, Job
import json

ORS_API_KEY = os.getenv("ORS_API_KEY")
COLUNA_CODE = 'Code'

def otimizar_rota_ors(pontos, ponto_partida):
    if not ORS_API_KEY:
        logging.error("Chave da API do OpenRouteService não configurada.")
        return [ponto_partida] + pontos

    if not pontos:
        return [ponto_partida]

    try:
        client = openrouteservice.Client(key=ORS_API_KEY)

        todas_coordenadas = [[ponto_partida['Longitude'], ponto_partida['Latitude']]] + \
                            [[p['Longitude'], p['Latitude']] for p in pontos]
        
        matrix_response = client.distance_matrix(
            locations=todas_coordenadas,
            sources=[0],  # Apenas do ponto de partida
            metrics=['distance'] # Usar distância
        )
        
        distances_from_start = matrix_response['distances'][0][1:] # Ignora a distância de 0 para 0
        
        if not distances_from_start:
             raise Exception("Matriz de distâncias não retornou distâncias.")

        # Encontra o índice do ponto mais próximo na lista `pontos` original
        indice_ponto_mais_proximo = min(range(len(distances_from_start)), key=distances_from_start.__getitem__)
        ponto_mais_proximo = pontos[indice_ponto_mais_proximo]

        pontos_restantes = [p for i, p in enumerate(pontos) if i != indice_ponto_mais_proximo]
        
        if not pontos_restantes:
            # Se só havia um ponto, a rota é simples
            return [ponto_partida, ponto_mais_proximo]

        jobs = [
            Job(id=i + 1, location=[p['Longitude'], p['Latitude']], service=300)
            for i, p in enumerate(pontos_restantes)
        ]

        # O veículo agora começa no "ponto mais próximo" e termina na parada final mais eficiente
        vehicle = Vehicle(
            id=0,
            profile='driving-car',
            start=[ponto_mais_proximo['Longitude'], ponto_mais_proximo['Latitude']]
        )

        result = client.optimization(jobs=jobs, vehicles=[vehicle])
        
        if not result.get('routes'):
             raise Exception("A API de otimização não retornou rotas para os pontos restantes.")

        ordered_job_ids = [step['id'] for step in result['routes'][0]['steps'] if step['type'] == 'job']
        
        pontos_restantes_map = {job.id: pontos_restantes[job.id - 1] for job in jobs}
        
        pontos_ordenados_restantes = [pontos_restantes_map[job_id] for job_id in ordered_job_ids]
        
        # 3. Montar a rota final
        rota_final = [ponto_partida, ponto_mais_proximo] + pontos_ordenados_restantes
        
        return rota_final

    except openrouteservice.exceptions.ApiError as e:
        logging.error(f"Erro na API do OpenRouteService: {e.args}")
        return [ponto_partida] + pontos
    except Exception as e:
        logging.error(f"Erro inesperado ao otimizar rota: {e}", exc_info=True)
        return [ponto_partida] + pontos

def calcular_distancias_rota(pontos_ordenados):
    logging.info(f"calcular_distancias_rota: Recebidos {len(pontos_ordenados)} pontos.")
    if not ORS_API_KEY:
        logging.error("calcular_distancias_rota: Chave da API do OpenRouteService não configurada.")
        return {"distancia_total": 0, "distancia_media": 0, "distancias_trechos": []}
    
    if len(pontos_ordenados) < 2:
        logging.warning(f"calcular_distancias_rota: Número insuficiente de pontos para calcular a rota ({len(pontos_ordenados)}).")
        return {"distancia_total": 0, "distancia_media": 0, "distancias_trechos": []}

    client = openrouteservice.Client(key=ORS_API_KEY)
    distancia_total = 0
    distancias_trechos = []

    # Para a distância total, consideramos todos os pontos, incluindo o de partida.
    coordenadas_para_total = [[p['Longitude'], p['Latitude']] for p in pontos_ordenados]
    logging.debug(f"calcular_distancias_rota: Coordenadas enviadas para ORS (para distância total): {coordenadas_para_total}")

    try:
        routes = client.directions(
            coordinates=coordenadas_para_total,
            profile='driving-car',
            format='json',
            radiuses=5000,
            instructions=True
        )
        logging.debug(f"calcular_distancias_rota: Resposta da API de Direções do ORS: {json.dumps(routes, indent=2)}")

        if not routes or 'routes' not in routes or not routes['routes']:
            logging.warning("calcular_distancias_rota: A API de Direções não retornou uma rota válida.")
            return {"distancia_total": 0, "distancia_media": 0, "distancias_trechos": []}

        distancia_total = routes['routes'][0]['summary'].get('distance', 0)
        logging.info(f"calcular_distancias_rota: Distância total da rota: {distancia_total} metros.")

        segments = routes['routes'][0].get('segments', [])
        for segment in segments:
            if segment.get('distance', 0) > 0:
                distancias_trechos.append(segment.get('distance', 0))


        num_trechos_para_media = len(pontos_ordenados) - 1
        
        if num_trechos_para_media > 0:

            distancia_total_para_media = sum(distancias_trechos[1:]) if len(distancias_trechos) > 1 else 0
            distancia_media = distancia_total_para_media / (num_trechos_para_media - 1) if (num_trechos_para_media - 1) > 0 else 0
        else:
            distancia_media = 0
        
        logging.info(f"calcular_distancias_rota: Número de trechos para média (excluindo partida): {num_trechos_para_media}, Distância média: {distancia_media} m/trecho.")

        return {
            "distancia_total": distancia_total,
            "distancia_media": distancia_media,
            "distancias_trechos": distancias_trechos
        }

    except openrouteservice.exceptions.ApiError as e:
        logging.error(f"calcular_distancias_rota: Erro na API de Direções do OpenRouteService: {e.args}")
        return {"distancia_total": 0, "distancia_media": 0, "distancias_trechos": []}
    except Exception as e:
        logging.error(f"calcular_distancias_rota: Erro inesperado ao calcular distâncias: {e}", exc_info=True)
        return {"distancia_total": 0, "distancia_media": 0, "distancias_trechos": []}
