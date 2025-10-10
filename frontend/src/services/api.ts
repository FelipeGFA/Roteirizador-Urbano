
import axios from 'axios';
import type { OptimizationResult, OptimizedRouteData } from '../types';

interface OtimizarRotaParams {
  file: File;
  base: string;
  fiscal: string;
  recursos: string[];
  codes: string[];
}

const apiClient = axios.create({
  baseURL: '/backend',
});

export const getRota = async (rotaId: string): Promise<OptimizedRouteData> => {
  try {
    const { data } = await apiClient.get(`/rotas/${rotaId}`);
    return data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || "Erro desconhecido ao buscar a rota.";
    throw new Error(errorMessage);
  }
};

const pollJobStatus = async (jobId: string, onProgress: (message: string) => void): Promise<OptimizationResult> => {
  const maxRetries = 60;
  const interval = 2000;
  let retries = 0;

  onProgress("Otimizando a rota. Por favor, aguarde...");

  while (retries < maxRetries) {
    try {
      const { data: result } = await apiClient.get(`/status-rota/${jobId}`);
      
      if (result.status === 'COMPLETED') {
        if (result.rota_id && result.dados_otimizados) {
          return result;
        } else {
          throw new Error("Dados otimizados inválidos recebidos do servidor.");
        }
      } else if (result.status === 'FAILED') {
        throw new Error(result.error || "Falha na otimização da rota no servidor.");
      } else {
        retries++;
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    } catch (error) {
      throw new Error(`Erro ao verificar status: ${error}`);
    }
  }

  throw new Error("A otimização da rota demorou muito para responder. Tente novamente.");
};

export const otimizarRota = async (params: OtimizarRotaParams, onProgress: (message: string) => void): Promise<OptimizationResult> => {
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('base', params.base);
  
  params.recursos.forEach(recurso => {
    formData.append('equipe[]', recurso);
  });

  params.codes.forEach(code => formData.append('codes[]', code));

  try {
    const { data: result } = await apiClient.post('/otimizar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (result.job_id) {
      return await pollJobStatus(result.job_id, onProgress);
    } else {
      throw new Error(result.error || "Resposta inválida do servidor ao iniciar o job.");
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || "Erro desconhecido";
    throw new Error(errorMessage);
  }
};
