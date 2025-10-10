from flask import Flask
import logging
import os
import redis
import locale
from dotenv import load_dotenv
from pathlib import Path

# Carrega variáveis de ambiente de um arquivo .env durante o desenvolvimento local
env_file = Path(__file__).parent / 'variaveis.env'
if env_file.exists():
    load_dotenv(dotenv_path=str(env_file))

# Configuração do locale
try:
    locale.setlocale(locale.LC_ALL, 'pt_BR.UTF-8')
except locale.Error:
    logging.warning("Locale 'pt_BR.UTF-8' not found. Using default locale.")
    pass

# Configuração do logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)

# Conexão com Redis
REDIS_URL = os.getenv("REDIS_URL")
kv = None
if REDIS_URL:
    try:
        kv = redis.from_url(REDIS_URL)
        kv.ping()
        logging.info("Conexão com Redis estabelecida com sucesso.")
    except redis.exceptions.ConnectionError as e:
        logging.error(f"Não foi possível conectar ao Redis: {e}")
        kv = None
else:
    logging.warning("Variável de ambiente REDIS_URL não definida. A persistência de rotas está desativada.")

# Configuração da aplicação Flask
app = Flask(__name__)
