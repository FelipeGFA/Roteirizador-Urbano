# Otimizador de Rotas

## Descrição

O Otimizador de Rotas é uma aplicação web desenvolvida em Flask que otimiza rotas de serviço a partir de uma planilha de pontos. A ferramenta permite que os usuários façam o upload de um arquivo Excel (`.xlsx`, `.xls`), selecionem equipes e tipos de serviço, e recebam uma rota otimizada para cada equipe, minimizando a distância total percorrida.

A aplicação foi projetada para ser assíncrona, processando as otimizações em segundo plano e permitindo que o usuário acompanhe o status do processo. As rotas geradas podem ser visualizadas em um mapa interativo e exportadas para os formatos PDF e Excel.

## Funcionalidades Principais

-   **Upload de Planilhas:** Importação de pontos de serviço a partir de arquivos Excel.
-   **Filtros Personalizados:** Seleção de equipes e tipos de serviço para otimização.
-   **Otimização de Rotas:** Utiliza a API do OpenRouteService para calcular a rota mais eficiente.
-   **Processamento Assíncrono:** Os cálculos são executados em segundo plano, permitindo que a interface do usuário permaneça responsiva.
-   **Visualização em Mapa:** Exibição das rotas otimizadas em um mapa interativo (Leaflet.js).
-   **Persistência de Dados:** As rotas geradas são salvas no Redis, permitindo o compartilhamento e a visualização posterior através de um link único.
-   **Exportação de Dados:** Geração de relatórios das rotas nos formatos PDF e Excel.
-   **Interface Amigável:** Design limpo e intuitivo, com suporte a modo claro e escuro.

## Tecnologias Utilizadas

### Backend
-   **Flask:** Microframework web para Python.
-   **Pandas:** Para processamento e manipulação dos dados da planilha.
-   **Openpyxl:** Leitura de arquivos `.xlsx`.
-   **OpenRouteService:** API para otimização de rotas e cálculo de matriz de distâncias.
-   **Redis:** Banco de dados em memória para gerenciamento de jobs e persistência de rotas.
-   **fpdf2:** Para a geração de relatórios em PDF.
-   **python-dotenv:** Gerenciamento de variáveis de ambiente.

### Frontend
-   **HTML5 / CSS3:** Estruturação e estilização da página.
-   **JavaScript (ES6 Modules):** Lógica da interface do usuário e comunicação com o backend.
-   **Leaflet.js:** Biblioteca para criação de mapas interativos.
-   **Font Awesome:** Ícones.

## Como Funciona

1.  **Upload:** O usuário seleciona os filtros desejados (base, equipe, tipo de serviço) e faz o upload de uma planilha com os endereços ou coordenadas dos pontos de serviço.
2.  **Início da Otimização:** O backend recebe o arquivo, valida os dados e cria um "job" de otimização assíncrono, retornando um `job_id` para o frontend.
3.  **Acompanhamento de Status:** O frontend utiliza o `job_id` para consultar periodicamente o status do processamento.
4.  **Cálculo da Rota:** O backend, em segundo plano, envia os pontos para a API do OpenRouteService, que retorna a ordem otimizada.
5.  **Armazenamento:** Após a conclusão, os resultados são salvos no Redis com um ID de rota único.
6.  **Exibição dos Resultados:** O frontend recebe os dados da rota otimizada e os exibe em um mapa e em tabelas de resumo.
7.  **Exportação:** O usuário pode exportar os detalhes da rota de cada equipe para um arquivo PDF ou para uma nova planilha Excel.

## Instalação e Execução Local

Para executar o projeto em seu ambiente local, siga os passos abaixo:

**Pré-requisitos:**
-   Python 3.8+
-   Redis Server
-   Uma chave de API do [OpenRouteService](https://openrouteservice.org/)

**1. Clone o repositório:**
```bash
git clone https://github.com/FelipeGFA/rotas.git
cd rotas
```

**2. Crie e ative um ambiente virtual:**
```bash
python -m venv venv
venv\Scripts\activate
```

**3. Instale as dependências:**
```bash
pip install -r requirements.txt
```

**4. Configure as variáveis de ambiente:**
Crie um arquivo chamado `.env` na raiz do projeto e adicione as seguintes variáveis:

```env
# URL de conexão com o seu servidor Redis
REDIS_URL=redis://localhost:6379/0

# Sua chave de API do OpenRouteService
ORS_API_KEY=sua_chave_de_api_aqui
```

**5. Execute a aplicação Flask:**
```bash
flask run
```

A aplicação estará disponível em `http://127.0.0.1:5000`.

## Estrutura do Projeto

```
/
├── .gitignore
├── README.md
├── requirements.txt
├── vercel.json
├── backend/
│   ├── main.py             
│   ├── routes.py           
│   └── utils/
│       ├── formatar_endereco.py
│       ├── gerar_excel.py
│       ├── gerar_pdf.py
│       ├── planilha_processing.py 
│       └── roterizacao.py      
├── static/
│   ├── css/
│   │   └── estilos.css
│   ├── icons/
│   └── js/
│       ├── darkmode.js
│       ├── export.js
│       ├── main.js             
│       └── mapa-ui.js
└── templates/
    └── index.html          
