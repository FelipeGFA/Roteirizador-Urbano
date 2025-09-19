# Documentação do Backend

Este diretório contém toda a lógica do lado do servidor para a aplicação Otimizador de Rotas, construída com o microframework Flask.

## Estrutura de Arquivos

```
backend/
│
├── main.py             
├── routes.py           
└── utils/             
```

---

### `main.py`

Este arquivo é o coração da aplicação Flask. Suas principais responsabilidades são:

-   **Inicialização do Flask:** Cria e configura a instância principal da aplicação.
-   **Carregamento de Variáveis de Ambiente:** Utiliza `python-dotenv` para carregar configurações sensíveis (como a chave da API e a URL do Redis) de um arquivo `.env`.
-   **Configuração de Logging e Locale:** Define o formato de logs e a localização para `pt_BR`.
-   **Conexão com o Redis:** Estabelece a conexão com o servidor Redis, que é usado para gerenciar a fila de jobs de otimização e para persistir os resultados das rotas.
-   **Registro de Rotas:** Importa o módulo `routes.py` para que os endpoints definidos nele sejam registrados na aplicação.

---

### `routes.py`

Este arquivo define todas as rotas da API e as funções que lidam com as requisições HTTP. Ele atua como o controlador principal, orquestrando o fluxo de dados entre o cliente (frontend) e os serviços do backend.

#### Endpoints Principais:

-   **`GET /`**
    -   **Função:** `index()`
    -   **Descrição:** Renderiza a página principal da aplicação (`index.html`).

-   **`GET /rotas/<rota_id>`**
    -   **Função:** `ver_rota(rota_id)`
    -   **Descrição:** Busca no Redis uma rota previamente salva usando o `rota_id` e a exibe na página principal.

-   **`POST /backend/otimizar`**
    -   **Função:** `iniciar_otimizacao()`
    -   **Descrição:** Ponto de entrada para o processo de otimização. Recebe a planilha (`.xlsx`, `.xls`), a lista de equipes e os filtros de serviço. Ele valida os dados, cria um job assíncrono com um `job_id` e o armazena no Redis com o status "PENDING".

-   **`GET /backend/status-rota/<job_id>`**
    -   **Função:** `verificar_status_rota(job_id)`
    -   **Descrição:** Permite que o frontend consulte o status de um job de otimização. Se o job ainda estiver pendente, ele inicia o processamento (chama os módulos de otimização em `utils`), atualiza o status para "PROCESSING" e, ao final, para "COMPLETED" ou "FAILED". Retorna os dados da rota otimizada quando o processo é concluído.

-   **`POST /exportar_pdf`**
    -   **Função:** `exportar_pdf()`
    -   **Descrição:** Recebe os dados de uma rota em formato JSON e utiliza o módulo `utils/gerar_pdf.py` para criar um relatório em PDF, que é retornado como um arquivo para download.

-   **`POST /exportar_planilha`**
    -   **Função:** `exportar_planilha()`
    -   **Descrição:** Similar à exportação de PDF, mas gera um arquivo Excel (`.xlsx`) a partir dos dados da rota usando `utils/gerar_excel.py`.

---

### `utils/`

Este diretório contém módulos com lógica de negócio específica, mantendo o arquivo `routes.py` mais limpo e focado no controle das requisições.

-   **`planilha_processing.py`:** Responsável por ler o arquivo Excel enviado pelo usuário, extrair os dados relevantes e estruturá-los em um formato que a aplicação possa utilizar.
-   **`roterizacao.py`:** Contém a lógica central de otimização. Ele se comunica com a API do OpenRouteService para obter a sequência de pontos otimizada e calcular as distâncias.
-   **`gerar_pdf.py`:** Gera um relatório PDF detalhado de uma rota, incluindo a ordem dos pontos, distâncias e outras informações.
-   **`gerar_excel.py`:** Gera uma nova planilha Excel com os dados da rota otimizada.
-   **`formatar_endereco.py`:** Funções auxiliares para manipulação e formatação de endereços e coordenadas.
