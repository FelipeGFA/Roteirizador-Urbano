import { gerarRecursos } from '../utils/resourceUtils';

export const DADOS_FILTROS: { [key: string]: { [key: string]: string[] } } = {
    'Maceió I': {
        'Luan Soares de Araujo': [...gerarRecursos('AL-MCZ-C', 1, 17, 'M'), 'AL-MCZ-C040M', 'AL-MCZ-C041M']
    },
    'Maceió II': {
        'Murilo Lima da Silva': gerarRecursos('AL-MCZ-C', 18, 35, 'M')
    },
    'SeedMoney': {
        'Engleus Santos': gerarRecursos('AL-MCZ-D', 1, 12, 'M')
    },
    'Rio Largo': {
        'Gevison Ferreira de Oliveira': gerarRecursos('AL-RLU-C', 1, 6, 'M')
    },
    'São Miguel dos Campos': {
        'Lourenço Gonçalves Dias Junior': gerarRecursos('AL-SMC-C', 1, 3, 'M')
    },
    'União dos Palmares': {
        'José Flávio Bernardino dos Santos': [...gerarRecursos('AL-UPM-C', 1, 3, 'M'), 'AL-MCI-C001M']
    },
    'Porto Calvo': {
        'Lucas Silva Barros dos Santos': [...gerarRecursos('AL-MTC-C', 1, 5, 'M'), 'AL-PCV-C001M']
    }
};
