import { renderizarTabelasEMapas, renderizarTabelaResumo } from './mapa-ui.js';

class RouteOptimizerUI {
    constructor() {
        this.fileInput = document.getElementById("fileInput");
        this.selectFileBtn = document.getElementById("selectFileBtn");
        this.uploadArea = document.getElementById("uploadArea");
        this.uploadSection = document.getElementById("uploadSection");
        this.resultsSection = document.getElementById("resultsSection");
        this.resultsGrid = document.getElementById('resultsGrid');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingText = document.getElementById('loadingText');
        this.backButton = document.getElementById('backButton');
        this.baseSelect = document.getElementById('base-select');
        this.fiscalSelect = document.getElementById('fiscal-select');
        this.recursoSelect = document.getElementById('recurso-select');
        this.fiscalContainer = document.getElementById('fiscal-container');
        this.equipeContainer = document.getElementById('equipe-container');
        this.submitBtn = document.getElementById('submitBtn');
        this.uploadContentInitial = document.getElementById('uploadContentInitial');
        this.fileSelectedContent = document.getElementById('fileSelectedContent');
        this.selectedFileName = document.getElementById('selectedFileName');
        this.changeFileBtn = document.getElementById('changeFileBtn');

        this.selectedFile = null;

        this.dadosFiltros = {
            'Maceió I': {
                'Luan Soares de Araujo': [...this.gerarRecursos('AL-MCZ-C', 1, 17, 'M'), 'AL-MCZ-C040M', 'AL-MCZ-C041M']
            },
            'Maceió II': {
                'Murilo Lima da Silva': this.gerarRecursos('AL-MCZ-C', 18, 35, 'M')
            },
            'SeedMoney': {
                'Engleus Santos': this.gerarRecursos('AL-MCZ-D', 1, 12, 'M')
            },
            'Rio Largo': {
                'Gevison Ferreira de Oliveira': this.gerarRecursos('AL-RLU-C', 1, 6, 'M')
            },
            'São Miguel dos Campos': {
                'Lourenço Gonçalves Dias Junior': this.gerarRecursos('AL-SMC-C', 1, 3, 'M')
            },
            'União dos Palmares': {
                'José Flávio Bernardino dos Santos': [...this.gerarRecursos('AL-UPM-C', 1, 3, 'M'), 'AL-MCI-C001M']
            },
            'Porto Calvo': {
                'Lucas Silva Barros dos Santos': [...this.gerarRecursos('AL-MTC-C', 1, 5, 'M'), 'AL-PCV-C001M']
            }
        };
        
        this.init();
    }

    gerarRecursos(prefixo, inicio, fim, sufixo) {
        const recursos = [];
        for (let i = inicio; i <= fim; i++) {
            const numeroFormatado = i.toString().padStart(3, '0');
            recursos.push(`${prefixo}${numeroFormatado}${sufixo}`);
        }
        return recursos;
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();

        if (window.dadosRota) {
            this.showProcessingState("Carregando dados da rota...");
            this.processAndDisplayRoutes(window.dadosRota);
        }
    }

    setupEventListeners() {
        this.selectFileBtn.addEventListener("click", () => this.fileInput.click());
        this.uploadArea.addEventListener("click", (e) => {
            if (!e.target.closest('.filter-container') && e.target.id !== 'submitBtn') {
                this.fileInput.click();
            }
        });
        this.fileInput.addEventListener("change", (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });
        this.submitBtn.addEventListener('click', () => this.submitData());
        this.baseSelect.addEventListener('change', () => {
            this.atualizarFiscais();
            this.checkSubmitButtonState();
        });
        this.fiscalSelect.addEventListener('change', () => {
            this.atualizarRecursos();
            this.checkSubmitButtonState();
        });
        this.recursoSelect.addEventListener('change', () => this.checkSubmitButtonState());
        document.querySelectorAll('input[name="code"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.checkSubmitButtonState());
        });
        this.backButton.addEventListener('click', () => this.handleBackButton());
        this.changeFileBtn.addEventListener('click', () => this.fileInput.click());
    }

    resetToInitialView() {
        this.uploadSection.style.display = "block";
        this.resultsSection.style.display = "none";
        this.resultsGrid.innerHTML = ''; 
        document.getElementById('summaryTableBody').innerHTML = ''; 
        document.getElementById('summaryTableContainer').style.display = 'none';

        
        history.pushState(null, 'Otimizador de Rotas', '/');
        window.dadosRota = null; 
        this.fileInput.value = ''; 
        this.selectedFile = null;
        this.submitBtn.disabled = true;
        this.uploadContentInitial.style.display = 'flex'; 
        this.fileSelectedContent.style.display = 'none';
        this.selectedFileName.textContent = '';
        this.uploadArea.classList.remove('file-selected'); 
    }

    handleBackButton() {
        const confirmacao = confirm("Deseja retornar à tela principal?");
        if (confirmacao) {
            window.location.href = '/';
        }
        
    }

    handleFileSelect(file) {
        const fileExtension = "." + file.name.split(".").pop().toLowerCase();
        if (![".xlsx", ".xls"].includes(fileExtension)) {
            alert("Por favor, selecione um arquivo Excel (.xlsx ou .xls)");
            this.selectedFile = null;
            this.fileInput.value = '';
            this.checkSubmitButtonState();
            return;
        }
        this.selectedFile = file;
        this.selectedFileName.textContent = file.name;
        this.uploadContentInitial.style.display = 'none';
        this.fileSelectedContent.style.display = 'flex';
        this.uploadArea.classList.add('file-selected'); 
        this.checkSubmitButtonState();
    }

    checkSubmitButtonState() {
        const baseSelecionada = this.baseSelect.value;
        const fiscalSelecionado = this.fiscalSelect.value;
        const recursoSelecionado = this.recursoSelect.value;

        this.submitBtn.disabled = !(this.selectedFile && baseSelecionada && fiscalSelecionado && recursoSelecionado);
    }

    atualizarFiscais() {
        const baseSelecionada = this.baseSelect.value;
        const fiscais = baseSelecionada ? Object.keys(this.dadosFiltros[baseSelecionada] || {}) : [];

        this.fiscalSelect.innerHTML = '<option value="" disabled selected hidden>Selecione o fiscal</option>';
        this.recursoSelect.innerHTML = '<option value="" disabled selected hidden>Selecione a equipe</option>';
        this.equipeContainer.style.display = 'none'; 

        if (fiscais.length > 0) {
            this.fiscalContainer.style.display = 'block';
            fiscais.forEach(fiscal => {
                const option = document.createElement('option');
                option.value = fiscal;
                option.textContent = fiscal;
                this.fiscalSelect.appendChild(option);
            });
        } else {
            this.fiscalContainer.style.display = 'none';
        }
    }

    atualizarRecursos() {
        const baseSelecionada = this.baseSelect.value;
        const fiscalSelecionado = this.fiscalSelect.value;
        let recursos = [];

        if (baseSelecionada && fiscalSelecionado) {
            recursos = this.dadosFiltros[baseSelecionada]?.[fiscalSelecionado] || [];
        }

        this.recursoSelect.innerHTML = '<option value="" disabled selected hidden>Selecione a equipe</option>';

        if (recursos.length > 0) {
            this.equipeContainer.style.display = 'block';
            const todosOption = document.createElement('option');
            todosOption.value = 'todos';
            todosOption.textContent = 'Todos';
            this.recursoSelect.appendChild(todosOption);

            recursos.forEach(recurso => {
                const option = document.createElement('option');
                option.value = recurso;
                option.textContent = recurso;
                this.recursoSelect.appendChild(option);
            });
        } else {
            this.equipeContainer.style.display = 'none';
        }
    }

    setupDragAndDrop() {
        this.uploadArea.addEventListener("dragover", (e) => {
            e.preventDefault();
            this.uploadArea.classList.add("dragover");
        });

        this.uploadArea.addEventListener("dragleave", (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove("dragover");
        });

        this.uploadArea.addEventListener("drop", (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove("dragover");
            if (e.dataTransfer.files.length > 0) {
                this.handleFileSelect(e.dataTransfer.files[0]);
            }
        });
    }

    async processAndDisplayRoutes(data) {
        this.showProcessingState("Renderizando mapas e rotas...");
        try {
            const resultados = await renderizarTabelasEMapas(data, this.resultsGrid);
            renderizarTabelaResumo(data); 
            this.showResults(resultados);
        } catch (error) {
            this.showErrorState(`Erro ao renderizar rotas: ${error.message}`);
        }
    }

    async pollJobStatus(jobId) {
        const maxRetries = 60; 
        const interval = 2000; 
        let retries = 0;

        this.showProcessingState("Otimizando a rota. Por favor, aguarde...");

        const checkStatus = async () => {
            if (retries >= maxRetries) {
                this.showErrorState("A otimização da rota demorou muito para responder. Tente novamente.");
                return;
            }

            try {
                const response = await fetch(`/backend/status-rota/${jobId}`);
                if (!response.ok) {
                    throw new Error(`Erro ao verificar status: ${response.statusText}`);
                }
                const result = await response.json();

                if (result.status === 'COMPLETED') {
                    if (result.rota_id && result.dados_otimizados) {
                        history.pushState({ rota_id: result.rota_id }, `Rota ${result.rota_id}`, `/rotas/${result.rota_id}`);
                        await this.processAndDisplayRoutes(result.dados_otimizados);
                    } else {
                        throw new Error("Dados otimizados inválidos recebidos do servidor.");
                    }
                } else if (result.status === 'FAILED') {
                    throw new Error(result.error || "Falha na otimização da rota no servidor.");
                } else {
                    
                    retries++;
                    setTimeout(checkStatus, interval);
                }
            } catch (error) {
                this.showErrorState(error.message);
            }
        };

        setTimeout(checkStatus, interval);
    }

    async submitData() {
        if (!this.selectedFile) {
            this.showErrorState("Nenhum arquivo selecionado para processamento.");
            return;
        }

        this.showProcessingState("Enviando arquivo para processamento...");
        
        const formData = new FormData();
        formData.append('file', this.selectedFile);

        const baseSelecionada = this.baseSelect.value;
        const fiscalSelecionado = this.fiscalSelect.value;
        const recursoSelecionado = this.recursoSelect.value;

        if (!baseSelecionada || !fiscalSelecionado || !recursoSelecionado) {
            this.showErrorState("Por favor, selecione Base, Fiscal e Recurso.\nTodos são obrigatórios.");
            return;
        }
        formData.append('base', baseSelecionada);

        let recursosParaEnviar = [];
        if (recursoSelecionado === 'todos') {
            
            recursosParaEnviar = this.dadosFiltros[baseSelecionada]?.[fiscalSelecionado] || [];
        } else {
            recursosParaEnviar.push(recursoSelecionado);
        }

        if (recursosParaEnviar.length === 0) {
            this.showErrorState("Nenhum recurso para otimizar com base nos filtros selecionados.");
            return;
        }
        recursosParaEnviar.forEach(recurso => formData.append('equipe', recurso));

        const selectedCodes = Array.from(document.querySelectorAll('input[name="code"]:checked'))
                                   .map(cb => cb.value);
        selectedCodes.forEach(code => formData.append('codes[]', code));

        try {
            
            const response = await fetch('/backend/otimizar', { method: 'POST', body: formData });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro HTTP! Status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.job_id) {
                
                await this.pollJobStatus(result.job_id);
            } else {
                throw new Error(result.error || "Resposta inválida do servidor ao iniciar o job.");
            }

        } catch (error) {
            this.showErrorState(error.message);
        }
    }

    showProcessingState(message) {
        this.loadingText.textContent = message;
        this.loadingOverlay.style.display = 'flex';
        this.uploadSection.style.display = "block"; 
        this.resultsSection.style.display = "none";
    }
    
    hideProcessingState() {
        this.loadingOverlay.style.display = 'none';
    }

    showErrorState(message) {
        this.hideProcessingState();
        this.uploadSection.style.display = "block";
        this.resultsSection.style.display = "none";
        alert(`Erro: ${message}`);
    }

    showResults(resultados = []) {
        this.hideProcessingState();
        this.uploadSection.style.display = "none";
        this.resultsSection.style.display = "block";

        setTimeout(() => {
            resultados.forEach(item => {
                if (item?.mapa?.invalidateSize) {
                    item.mapa.invalidateSize();
                    item.mapa.fitBounds(item.bounds.pad(0.1));
                }
            });
        }, 200);
    }
}

new RouteOptimizerUI();
