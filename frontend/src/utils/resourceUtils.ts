export function gerarRecursos(prefixo: string, inicio: number, fim: number, sufixo: string) {
    const recursos = [];
    for (let i = inicio; i <= fim; i++) {
        const numeroFormatado = i.toString().padStart(3, '0');
        recursos.push(`${prefixo}${numeroFormatado}${sufixo}`);
    }
    return recursos;
}
