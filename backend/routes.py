from flask import request, jsonify, Response
from app import app, kv
from utils.planilha_processing import processar_planilha
from utils.roterizacao import otimizar_rota_ors, calcular_distancias_rota
from utils.gerar_pdf import gerar_pdf_rota
from utils.gerar_excel import gerar_planilha_rota
from utils.formatar_endereco import get_ponto_inicial_backend
import io
import json
from datetime import datetime
import logging

@app.route('/backend/otimizar', methods=['POST'])
def iniciar_otimizacao():
    if 'file' not in request.files or not request.files['file'].filename:
        return jsonify({"error": "Nenhum arquivo selecionado"}), 400
    
    arquivo = request.files['file']
    codes_selecionados = request.form.getlist('codes[]')
    recursos = request.form.getlist('equipe[]') 

    if not recursos:
        return jsonify({"error": "Nenhuma equipe selecionada"}), 400
    
    if not arquivo or not arquivo.filename.endswith(('.xlsx', '.xls')):
        return jsonify({"error": "Formato de arquivo inválido. Use .xlsx ou .xls"}), 400

    stream_arquivo = io.BytesIO(arquivo.read())
    dados_processados = processar_planilha(stream_arquivo, recursos, codes_selecionados)
    
    if not dados_processados:
        return jsonify({"error": "Nenhum dado encontrado para os recursos selecionados"}), 500

    if not kv:
        return jsonify({"error": "Serviço de persistência indisponível."}), 500

    try:
        timestamp_url = datetime.now().strftime('%d-%m-%Y-%H%M%S')
        timestamp_job = datetime.now().strftime('%d-%m-%Y-%H%M%S-%f')
        job_id = f"job-{timestamp_job}"
        
        job_data = {
            "url_timestamp": timestamp_url,
            "status": "PENDING",
            "dados_originais": dados_processados,
            "recursos": recursos 
        }
        kv.set(f"job:{job_id}", json.dumps(job_data), ex=86400)
        
        return jsonify({"job_id": job_id})
    except Exception as e:
        logging.error(f"Erro ao iniciar job de otimização: {e}")
        return jsonify({"error": "Falha ao iniciar a otimização."}), 500

@app.route('/backend/status-rota/<job_id>', methods=['GET'])
def verificar_status_rota(job_id):
    if not kv:
        return jsonify({"error": "Serviço de persistência indisponível."}), 500

    try:
        dados_job_json = kv.get(f"job:{job_id}")
        if not dados_job_json:
            return jsonify({"error": "Job não encontrado."}), 404

        dados_job = json.loads(dados_job_json)
        status = dados_job.get("status")

        if status == "COMPLETED" or status == "FAILED":
            return jsonify(dados_job)

        if status == "PENDING":
            dados_job["status"] = "PROCESSING"
            kv.set(f"job:{job_id}", json.dumps(dados_job), ex=86400)

            dados_originais = dados_job.get("dados_originais", {})
            recursos = dados_job.get("recursos") 
            dados_otimizados = {}
            
            for recurso, pontos in dados_originais.items():
                if not pontos: 
                    continue
                
                ponto_partida = get_ponto_inicial_backend(recurso)
                
                ponto_partida_dict = {
                    "Latitude": ponto_partida["Latitude"],
                    "Longitude": ponto_partida["Longitude"],
                    "Recurso": "Ponto de Partida",
                    "Status da Atividade": "partida" 
                }

                pontos_ordenados = otimizar_rota_ors(pontos, ponto_partida_dict)
                
                
                info_distancias = calcular_distancias_rota(pontos_ordenados)

                dados_recurso = {
                    "pontos": pontos_ordenados,
                    "distancia_total": info_distancias["distancia_total"],
                    "distancia_media": info_distancias["distancia_media"],
                    "distancias_trechos": info_distancias["distancias_trechos"]
                }
                dados_otimizados[recurso] = dados_recurso
                
            
            dados_job["status"] = "COMPLETED"
            dados_job["dados_otimizados"] = dados_otimizados
            if "dados_originais" in dados_job:
                del dados_job["dados_originais"]
            
            url_timestamp = dados_job.get("url_timestamp")
            rota_id = f"rota:{url_timestamp}"
            kv.set(rota_id, json.dumps(dados_otimizados), ex=86400)
            dados_job["rota_id"] = rota_id

            kv.set(f"job:{job_id}", json.dumps(dados_job), ex=86400)

            return jsonify(dados_job)

        return jsonify({"status": status})

    except Exception as e:
        logging.error(f"Erro ao verificar status do job {job_id}: {e}", exc_info=True)
        try:
            job_data = {"status": "FAILED", "error": str(e)}
            kv.set(f"job:{job_id}", json.dumps(job_data), ex=86400)
        except Exception as redis_e:
            logging.error(f"Não foi possível marcar o job {job_id} como FAILED: {redis_e}")
        
        return jsonify({"status": "FAILED", "error": "Ocorreu um erro durante o processamento."}), 500

@app.route('/backend/rotas/<path:rota_id>', methods=['GET'])
def get_rota(rota_id):
    if not kv:
        return jsonify({"error": "Serviço de persistência indisponível."}), 500
    
    try:
        dados_rota_json = kv.get(rota_id)
        if not dados_rota_json:
            return jsonify({"error": "Rota não encontrada."}), 404
        
        dados_rota = json.loads(dados_rota_json)
        return jsonify(dados_rota)
    except Exception as e:
        logging.error(f"Erro ao buscar rota {rota_id}: {e}")
        return jsonify({"error": "Falha ao buscar dados da rota."}), 500

@app.route('/backend/exportar_pdf', methods=['POST'])
def exportar_pdf():
    try:
        dados_rota = request.json
        if not dados_rota:
            return jsonify({"error": "Dados não fornecidos"}), 400
            
        pdf_bytes = gerar_pdf_rota(dados_rota)
        nome_arquivo = f"rota_{dados_rota.get('recurso', 'desconhecido')}.pdf"
        
        return Response(
            pdf_bytes,
            mimetype='application/pdf',
            headers={'Content-Disposition': f'attachment;filename={nome_arquivo}'}
        )
    except Exception as e:
        logging.error(f"Erro ao gerar PDF: {e}", exc_info=True)
        return jsonify({"error": "Falha ao gerar o PDF"}), 500

@app.route('/backend/exportar_planilha', methods=['POST'])
def exportar_planilha():
    try:
        dados_rota = request.json
        if not dados_rota:
            return jsonify({"error": "Dados não fornecidos"}), 400
            
        planilha_bytes = gerar_planilha_rota(dados_rota)
        if planilha_bytes is None:
            return jsonify({"error": "Não há dados para exportar"}), 400

        nome_arquivo = f"rota_{dados_rota.get('recurso', 'desconhecido')}.xlsx"
        
        return Response(
            planilha_bytes,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={'Content-Disposition': f'attachment;filename={nome_arquivo}'}
        )
    except Exception as e:
        logging.error(f"Erro ao gerar planilha: {e}", exc_info=True)
        return jsonify({"error": "Falha ao gerar a planilha"}), 500
