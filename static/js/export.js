function showExportNotification(message, type = 'info', duration = 4000) {
    const containerId = 'notification-container';
    let container = document.getElementById(containerId);

    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 1000;
            display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;
        `;
        document.body.appendChild(container);
    }

    const notification = document.createElement("div");
    const iconClass = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-download';
    const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#1e3a8a';

    notification.innerHTML = `<div class="notification-content"><i class="fas ${iconClass}"></i><span>${message}</span></div>`;
    notification.style.cssText = `
        background: ${bgColor}; color: white; padding: 1rem 1.5rem;
        border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        animation: slideInRight 0.3s ease-out;
    `;
    
    container.appendChild(notification);

    const styleId = 'export-notification-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .notification-content { display: flex; align-items: center; gap: 0.5rem; }
        `;
        document.head.appendChild(style);
    }

    const dismiss = () => {
        notification.style.animation = 'fadeOutRight 0.3s ease-in forwards';
        notification.addEventListener('animationend', () => {
            notification.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        });
    };

    if (duration > 0) {
        setTimeout(dismiss, duration);
    }
    
    return { notification, dismiss };
}

function triggerDownload(blob, filename) {
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

async function fetchExport(endpoint, body) {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha na exportação');
    }
    return response.blob();
}

export async function exportarRotaParaPDF(recurso, dadosRota, idMapa) {
    showExportNotification(`Gerando imagem do mapa para ${recurso}...`);
    let exportNotification;
    try {
        const elementoMapa = document.getElementById(idMapa);
        const canvas = await html2canvas(elementoMapa, { useCORS: true, logging: false });
        const imagemMapa = canvas.toDataURL('image/png');

        exportNotification = showExportNotification(`Exportando ${recurso} para PDF...`, 'info', 0);
        const body = { ...dadosRota, recurso, imagem_mapa: imagemMapa };
        const blob = await fetchExport('/exportar_pdf', body);
        
        triggerDownload(blob, `rota_${recurso}.pdf`);
        showExportNotification(`Rota ${recurso}.pdf exportada com sucesso!`, 'success');
    } catch (error) {
        console.error('Erro na exportação para PDF:', error);
        showExportNotification(`Erro ao exportar PDF: ${error.message}`, 'error');
    } finally {
        if (exportNotification) {
            exportNotification.dismiss();
        }
    }
}

export async function exportarRotaParaPlanilha(recurso, dadosRota) {
    let exportNotification;
    try {
        exportNotification = showExportNotification(`Exportando ${recurso} para Planilha...`, 'info', 0);
        const body = { ...dadosRota, recurso };
        const blob = await fetchExport('/exportar_planilha', body);

        triggerDownload(blob, `rota_${recurso}.xlsx`);
        showExportNotification(`Rota ${recurso}.xlsx exportada com sucesso!`, 'success');
    } catch (error) {
        console.error('Erro na exportação para Planilha:', error);
        showExportNotification(`Erro ao exportar Planilha: ${error.message}`, 'error');
    } finally {
        if (exportNotification) {
            exportNotification.dismiss();
        }
    }
}
