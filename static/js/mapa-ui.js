import { exportarRotaParaPDF, exportarRotaParaPlanilha } from './export.js';

const PONTOS_INICIAIS = [
    {
        prefixo: "AL-MTC-C",
        range: [1, 5],
        coords: { Latitude: -9.155697, Longitude: -35.523353 }
    },
    {
        prefixo: "AL-PCV-C",
        range: [1, 1],
        coords: { Latitude: -9.155697, Longitude: -35.523353 }
    },
    {
        prefixo: "AL-MCZ-C",
        range: [18, 35],
        coords: { Latitude: -9.659398, Longitude: -35.740825 }
    },
    {
        prefixo: "AL-RLU-C",
        range: [1, 6],
        coords: { Latitude: -9.501750, Longitude: -35.838500 }
    },
    {
        prefixo: "AL-SMC-C",
        range: [1, 3],
        coords: { Latitude: -9.773510, Longitude: -36.089400 }
    },
    {
        prefixo: "AL-MCZ-C",
        range: [1, 17],
        coords: { Latitude: -9.566120, Longitude: -35.765700 }
    },
    {
        prefixo: "AL-MCZ-C",
        range: [41, 41],
        coords: { Latitude: -9.462588, Longitude: -35.549205 }
    },
    {
        prefixo: "AL-UPM-C",
        range: [1, 3],
        coords: { Latitude: -9.146661, Longitude: -36.038027 }
    },
    {
        prefixo: "AL-MCI-C",
        range: [1, 1],
        coords: { Latitude: -9.319531, Longitude: -35.936093 }
    },
    {
        prefixo: "AL-MCZ-D",
        range: [1, 7],
        coords: { Latitude: -9.566061, Longitude: -35.765674 }
    },
    {
        prefixo: "AL-MCZ-D",
        range: [8, 12],
        coords: { Latitude: -9.658853, Longitude: -35.740326 }
    }
];

const DEFAULT_PONTO_INICIAL = { Latitude: -9.619990, Longitude: -35.739346 };

const CORES_STATUS = {
    'pendente': '#FFDE00',
    'iniciado': '#A984B8',
    'não concluído': '#60CECE',
    'concluído': '#1B38C5'
};

function getPontoInicial(recurso) {
    let numeroEquipe = null;
    try {
        const match = recurso.match(/\d+/);
        if (match) {
            numeroEquipe = parseInt(match[0], 10);
        }
    } catch (e) {
        console.warn(`Não foi possível extrair número do recurso: ${recurso}`);
    }

    for (const regra of PONTOS_INICIAIS) {
        if (recurso.startsWith(regra.prefixo)) {
            if (!regra.range) {
                return regra.coords;
            }
            if (numeroEquipe !== null) {
                const [min, max] = regra.range;
                if (numeroEquipe >= min && numeroEquipe <= max) {
                    return regra.coords;
                }
            }
        }
    }

    console.warn(`Nenhuma regra encontrada para '${recurso}'. Usando ponto de partida padrão.`);
    return DEFAULT_PONTO_INICIAL;
}

function formatDistance(meters) {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
}

function createRouteCard(recurso, dadosRota, index) {
    const card = document.createElement("div");
    card.className = "route-card fade-in";
    card.style.animationDelay = `${index * 0.1}s`;
    const idMapa = `map-${recurso}`;
    
    const rotaOrdenada = dadosRota.pontos || [];
    const paradas = rotaOrdenada.length > 1 ? rotaOrdenada.length - 1 : 0;

    const distanciaTotal = dadosRota.distancia_total || 0;
    const distanciaMedia = dadosRota.distancia_media || 0;

    card.innerHTML = `
        <div class="route-header">
            <h3 class="route-title">
                ${recurso}
            </h3>
            <div class="route-stats">
                <div class="route-stat">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${paradas} parada${paradas !== 1 ? 's' : ''}</span>
                </div>
                <div class="route-stat">
                    <i class="fas fa-road"></i>
                    <span>${formatDistance(distanciaTotal)}</span>
                </div>
                <div class="route-stat">
                    <i class="fas fa-ruler-horizontal"></i>
                    <span>${formatDistance(distanciaMedia)} / ponto</span>
                </div>
            </div>
        </div>
        <div class="route-map" id="${idMapa}" style="height: 60vh;"></div>
        <div class="route-actions">
            <button class="btn btn-primary btn-sm btn-export-pdf"><i class="fas fa-file-pdf"></i> Exportar PDF</button>
            <button class="btn btn-success btn-sm btn-export-excel"><i class="fas fa-file-excel"></i> Exportar Planilha</button>
        </div>
    `;

    card.querySelector('.btn-export-pdf').onclick = () => exportarRotaParaPDF(recurso, dadosRota, idMapa);
    card.querySelector('.btn-export-excel').onclick = () => exportarRotaParaPlanilha(recurso, dadosRota);

    return card;
}

function initializeMap(mapId, rotaOrdenada, recurso) {
    const mapContainer = document.getElementById(mapId);
    if (!mapContainer) return null;

    const mapa = L.map(mapId, { zoomControl: true, scrollWheelZoom: true, zoomSnap: 0.1 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
    }).addTo(mapa);

    const pontoInicial = getPontoInicial(recurso);
    const startIcon = L.divIcon({
        className: "custom-marker start-marker",
        html: '<i class="fas fa-home"></i>',
        iconSize: [35, 35],
        iconAnchor: [17, 17],
    });
    L.marker([pontoInicial.Latitude, pontoInicial.Longitude], { icon: startIcon })
        .addTo(mapa)
        .bindPopup("<strong>Ponto de Partida</strong>");

    rotaOrdenada.slice(1).forEach((ponto, index) => {
        const status = (ponto['Status da Atividade'] || '').toLowerCase().trim();
        const markerColor = CORES_STATUS[status] || '#CCCCCC';
        const textColor = '#000000';

        const deliveryIcon = L.divIcon({
            className: "custom-marker",
            html: `<div style="background-color:${markerColor}; color:${textColor}; border-radius:50%; width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-weight: bold;">${index + 1}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
        });
        const valorContrato = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
            .format(ponto['Valor Total Contrato'] || 0);

        const popupContent = `
            <strong>Parada ${index + 1}</strong><br>
            Status: ${ponto['Status da Atividade']}<br>
            Valor: ${valorContrato}<br>
            Lat: ${ponto.Latitude}<br>
            Lon: ${ponto.Longitude}
        `;

        L.marker([ponto.Latitude, ponto.Longitude], { icon: deliveryIcon })
            .addTo(mapa)
            .bindPopup(popupContent);
    });

    return mapa;
}

function renderizarRecurso(recurso, dadosRecurso, resultsGrid, index) {
    const card = createRouteCard(recurso, dadosRecurso, index);
    resultsGrid.appendChild(card);

    return new Promise(resolve => {
        requestAnimationFrame(() => {
            const rotaOrdenada = dadosRecurso.pontos || [];
            const mapa = initializeMap(`map-${recurso}`, rotaOrdenada, recurso);
            if (!mapa) {
                resolve(null);
                return;
            }
            
            const todasCoordenadas = rotaOrdenada.map(p => [p.Latitude, p.Longitude]);
            const bounds = todasCoordenadas.length > 0 ? L.latLngBounds(todasCoordenadas) : null;
            resolve({ mapa, bounds });
        });
    });
}

export async function renderizarTabelasEMapas(dados, resultsGrid) {
    resultsGrid.innerHTML = '';

    if (Object.keys(dados).length === 0) {
        resultsGrid.textContent = 'Nenhum dado encontrado para o prefixo especificado.';
        return [];
    }

    const promessasRenderizacao = Object.entries(dados)
        .filter(([, dadosRecurso]) => dadosRecurso.pontos && dadosRecurso.pontos.length > 1)
        .map(([recurso, dadosRecurso], index) => {
            return renderizarRecurso(recurso, dadosRecurso, resultsGrid, index);
        });
    
    const resultados = await Promise.all(promessasRenderizacao);
    return resultados.filter(r => r?.mapa && r.bounds);
}

export function renderizarTabelaResumo(dados) {
    const summaryTableContainer = document.getElementById('summaryTableContainer');
    const summaryTableBody = document.getElementById('summaryTableBody');
    
    if (!summaryTableContainer || !summaryTableBody) {
        console.error("Elementos da tabela de resumo não encontrados.");
        return;
    }

    summaryTableBody.innerHTML = ''; 

    if (Object.keys(dados).length === 0) {
        summaryTableContainer.style.display = 'none';
        return;
    }

    let totalDistanciaGeral = 0;
    let totalMediaGeral = 0;
    let countEquipesComDados = 0;

    for (const recurso in dados) {
        const dadosRecurso = dados[recurso];
        if (dadosRecurso.pontos && dadosRecurso.pontos.length > 1) {
            const distanciaTotal = dadosRecurso.distancia_total || 0;
            const distanciaMedia = dadosRecurso.distancia_media || 0;

            totalDistanciaGeral += distanciaTotal;
            totalMediaGeral += distanciaMedia;
            countEquipesComDados++;

            const row = summaryTableBody.insertRow();
            row.innerHTML = `
                <td>${recurso}</td>
                <td>${formatDistance(distanciaTotal)}</td>
                <td>${formatDistance(distanciaMedia)} / ponto</td>
            `;
        }
    }

    if (countEquipesComDados > 0) {
        summaryTableContainer.style.display = 'block';
    } else {
        summaryTableContainer.style.display = 'none';
    }
}
