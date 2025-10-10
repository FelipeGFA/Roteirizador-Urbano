import { useState, useCallback } from 'react';
import type { OptimizationResult } from '../types';
import { otimizarRota } from '../services/api';
import { DADOS_FILTROS } from '../constants/filters';

interface UploadSectionProps {
  onOptimized: (data: OptimizationResult) => void;
  onError: (message: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setLoadingMessage: (message: string) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onOptimized, onError, setIsLoading, setLoadingMessage }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [base, setBase] = useState('');
  const [fiscal, setFiscal] = useState('');
  const [recurso, setRecurso] = useState('');
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      if (![".xlsx", ".xls"].includes(fileExtension)) {
        alert("Por favor, selecione um arquivo Excel (.xlsx ou .xls)");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleServiceTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setServiceTypes(prev => 
      checked ? [...prev, value] : prev.filter(type => type !== value)
    );
  };

  const handleSubmit = async () => {
    if (!selectedFile || !base || !fiscal || !recurso) {
      onError("Todos os campos de filtro e o arquivo são obrigatórios.");
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Enviando arquivo para processamento...");

    try {
      let recursosParaEnviar: string[] = [];
      if (recurso === 'todos') {
        recursosParaEnviar = DADOS_FILTROS[base]?.[fiscal] || [];
      } else {
        recursosParaEnviar = [recurso];
      }

      const data = await otimizarRota({
        file: selectedFile,
        base,
        fiscal,
        recursos: recursosParaEnviar,
        codes: serviceTypes
      }, (message) => setLoadingMessage(message));
      onOptimized(data);
    } catch (error: any) {
      onError(error.message || "Ocorreu um erro desconhecido.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const fiscais = base ? Object.keys(DADOS_FILTROS[base] || {}) : [];
  const recursos = base && fiscal ? DADOS_FILTROS[base]?.[fiscal] || [] : [];

  const isSubmitDisabled = !selectedFile || !base || !fiscal || !recurso;

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
          handleFileChange(e.dataTransfer.files);
      }
  }, []);

  return (
    <section className="upload-section" id="uploadSection">
      <div className="filter-container">
        <div className="equipe-container">
            <h4 className="filter-title">Selecionar Base:</h4>
            <select value={base} onChange={e => { setBase(e.target.value); setFiscal(''); setRecurso(''); }} className="custom-select" required>
                <option value="" disabled>Selecione a base</option>
                {Object.keys(DADOS_FILTROS).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
        </div>
        <div className="equipe-container" style={{display: fiscais.length > 0 ? 'block' : 'none'}}>
            <h4 className="filter-title">Selecionar Fiscal:</h4>
            <select value={fiscal} onChange={e => { setFiscal(e.target.value); setRecurso(''); }} className="custom-select" required>
                <option value="" disabled>Selecione o fiscal</option>
                {fiscais.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
        </div>
        <div className="equipe-container" style={{display: recursos.length > 0 ? 'block' : 'none'}}>
            <h4 className="filter-title">Selecionar Equipe:</h4>
            <select value={recurso} onChange={e => setRecurso(e.target.value)} className="custom-select" required>
                <option value="" disabled>Selecione a equipe</option>
                <option value="todos">Todos</option>
                {recursos.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
        </div>
        <h4 className="filter-title">Filtrar por tipo de serviço:</h4>
        <div className="checkbox-group">
            {['SFRT', 'SFNR', 'Demais Serviços'].map(type => (
                <div className="checkbox-item" key={type}>
                    <span className="checkbox-text">{type}</span>
                    <div className="checkbox-wrapper-3">
                        <input type="checkbox" id={`cbx-${type}`} value={type} onChange={handleServiceTypeChange} />
                        <label htmlFor={`cbx-${type}`} className="toggle"><span></span></label>
                    </div>
                </div>
            ))}
        </div>
      </div>

      <div 
        className={`upload-area ${isDragOver ? 'dragover' : ''} ${selectedFile ? 'file-selected' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        {!selectedFile ? (
            <div className="upload-content">
                <div className="upload-icon"><i className="fas fa-cloud-upload-alt"></i></div>
                <h3 className="upload-text">Clique para selecionar o arquivo</h3>
                <p className="upload-description">ou arraste e solte a planilha aqui</p>
                <div className="upload-formats">
                    <span className="format-tag">.xlsx</span>
                    <span className="format-tag">.xls</span>
                </div>
                <input type="file" id="fileInput" accept=".xlsx,.xls" hidden onChange={e => handleFileChange(e.target.files)} />
                <button type="button" className="btn btn-primary" onClick={(e) => { e.stopPropagation(); document.getElementById('fileInput')?.click(); }}>
                    <i className="fas fa-folder-open"></i> Selecionar Arquivo
                </button>
            </div>
        ) : (
            <div className="file-selected-content">
                <div className="file-icon"><i className="fas fa-file-excel"></i></div>
                <h3 className="selected-file-name">{selectedFile.name}</h3>
                <p className="selected-file-description">Arquivo pronto para otimização</p>
                <button type="button" className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); document.getElementById('fileInput')?.click(); }}>
                    <i className="fas fa-exchange-alt"></i> Trocar Arquivo
                </button>
            </div>
        )}
      </div>
      <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitDisabled}>
          <i className="fas fa-paper-plane"></i> Enviar
      </button>
    </section>
  );
};

export default UploadSection;
