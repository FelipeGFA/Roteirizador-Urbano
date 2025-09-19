from flask import Flask
import logging
import os
import redis
import locale
from dotenv import load_dotenv

# Carrega variáveis de ambiente de um arquivo .env durante o desenvolvimento local
if os.path.exists('.env') or os.path.exists('variaveis.env'):
    load_dotenv(dotenv_path='variaveis.env' if os.path.exists('variaveis.env') else '.env')

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
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
template_dir = os.path.join(os.path.dirname(BASE_DIR), 'templates')
static_dir = os.path.join(os.path.dirname(BASE_DIR), 'static')

app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)

# Importa as rotas para que sejam registradas na aplicação
from . import routes
