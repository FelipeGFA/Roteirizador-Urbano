const PONTOS_INICIAIS = [
    { prefixo: "AL-MTC-C", range: [1, 5], coords: { Latitude: -9.155697, Longitude: -35.523353 } },
    { prefixo: "AL-PCV-C", range: [1, 1], coords: { Latitude: -9.155697, Longitude: -35.523353 } },
    { prefixo: "AL-MCZ-C", range: [18, 35], coords: { Latitude: -9.659398, Longitude: -35.740825 } },
    { prefixo: "AL-RLU-C", range: [1, 6], coords: { Latitude: -9.501750, Longitude: -35.838500 } },
    { prefixo: "AL-SMC-C", range: [1, 3], coords: { Latitude: -9.773510, Longitude: -36.089400 } },
    { prefixo: "AL-MCZ-C", range: [1, 17], coords: { Latitude: -9.566120, Longitude: -35.765700 } },
    { prefixo: "AL-MCZ-C", range: [41, 41], coords: { Latitude: -9.462588, Longitude: -35.549205 } },
    { prefixo: "AL-UPM-C", range: [1, 3], coords: { Latitude: -9.146661, Longitude: -36.038027 } },
    { prefixo: "AL-MCI-C", range: [1, 1], coords: { Latitude: -9.319531, Longitude: -35.936093 } },
    { prefixo: "AL-MCZ-D", range: [1, 7], coords: { Latitude: -9.566061, Longitude: -35.765674 } },
    { prefixo: "AL-MCZ-D", range: [8, 12], coords: { Latitude: -9.658853, Longitude: -35.740326 } }
];
const DEFAULT_PONTO_INICIAL = { Latitude: -9.619990, Longitude: -35.739346 };
export const CORES_STATUS = {
    'pendente': '#FFDE00',
    'iniciado': '#A984B8',
    'não concluído': '#60CECE',
    'concluído': '#1B38C5'
};

export function getPontoInicial(recurso: string) {
    let numeroEquipe: number | null = null;
    try {
        const match = recurso.match(/\d+/);
        if (match) numeroEquipe = parseInt(match[0], 10);
    } catch (e) { console.warn(`Não foi possível extrair número do recurso: ${recurso}`); }

    for (const regra of PONTOS_INICIAIS) {
        if (recurso.startsWith(regra.prefixo)) {
            if (!regra.range) return regra.coords;
            if (numeroEquipe !== null) {
                const [min, max] = regra.range;
                if (numeroEquipe >= min && numeroEquipe <= max) return regra.coords;
            }
        }
    }
    return DEFAULT_PONTO_INICIAL;
}
