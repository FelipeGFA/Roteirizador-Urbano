import html2canvas from 'html2canvas';
import axios from 'axios';
import { toast } from 'react-toastify';
import type { RouteData } from '../types';

function triggerDownload(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
}

async function fetchExport(endpoint: string, body: any) {
    const response = await axios.post(endpoint, body, {
        baseURL: '/backend',
        responseType: 'blob',
        headers: { 'Content-Type': 'application/json' },
    });

    if (response.status !== 200) {
        const errorText = await response.data.text();
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || 'Falha na exportação');
    }
    return response.data;
}

export async function exportarRotaParaPDF(recurso: string, dadosRota: RouteData, idMapa: string) {
    toast.info(`Gerando imagem do mapa para ${recurso}...`);
    try {
        const elementoMapa = document.getElementById(idMapa);
        if (!elementoMapa) throw new Error("Elemento do mapa não encontrado");

        const canvas = await html2canvas(elementoMapa, { useCORS: true, logging: false });
        const imagemMapa = canvas.toDataURL('image/png');

        const body = { ...dadosRota, recurso, imagem_mapa: imagemMapa };
        const exportPromise = fetchExport('/exportar_pdf', body).then(blob => {
            triggerDownload(blob, `rota_${recurso}.pdf`);
        });

        await toast.promise(exportPromise, {
            pending: `Exportando ${recurso} para PDF...`,
            success: `Rota ${recurso}.pdf exportada com sucesso!`,
            error: {
                render: ({ data }: any) => `Erro ao exportar PDF: ${data.message}`
            }
        });
    } catch (error: any) {
        console.error('Erro na exportação para PDF:', error);
        toast.error(`Erro ao exportar PDF: ${error.message}`);
    }
}

export async function exportarRotaParaPlanilha(recurso: string, dadosRota: RouteData) {
    try {
        const body = { ...dadosRota, recurso };
        const exportPromise = fetchExport('/exportar_planilha', body).then(blob => {
            triggerDownload(blob, `rota_${recurso}.xlsx`);
        });

        await toast.promise(exportPromise, {
            pending: `Exportando ${recurso} para Planilha...`,
            success: `Rota ${recurso}.xlsx exportada com sucesso!`,
            error: {
                render: ({ data }: any) => `Erro ao exportar Planilha: ${data.message}`
            }
        });
    } catch (error: any) {
        console.error('Erro na exportação para Planilha:', error);
        toast.error(`Erro ao exportar Planilha: ${error.message}`);
    }
}
