// Endpoints da API do Protheus
export const API_ENDPOINTS = {
    // Autenticação
    AUTH: {
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout',
        REFRESH: '/api/auth/refresh',
        VERIFY: '/api/auth/verify',
    },

    // Sistema
    SYSTEM: {
        HEALTH: '/api/health',
        VERSION: '/api/version',
        CONFIG: '/api/config',
    },

    // Filiais
    BRANCHES: {
        LIST: '/api/branches',
        BY_ID: (id: string) => `/api/branches/${id}`,
        SEARCH: '/api/branches/search',
    },

    // Módulos
    MODULES: {
        LIST: '/api/modules',
        BY_ID: (id: string) => `/api/modules/${id}`,
        BY_CODE: (code: string) => `/api/modules/code/${code}`,
    },

    // Faturamento (SIGAFAT)
    FATURAMENTO: {
        PEDIDOS: '/api/modules/sigafat/pedidos',
        VENDAS: '/api/modules/sigafat/vendas',
        CLIENTES: '/api/modules/sigafat/clientes',
        PRODUTOS: '/api/modules/sigafat/produtos',
        NOTAS_FISCAIS: '/api/modules/sigafat/notas-fiscais',
    },

    // Estoque (SIGAEST)
    ESTOQUE: {
        PRODUTOS: '/api/modules/sigaest/produtos',
        MOVIMENTACOES: '/api/modules/sigaest/movimentacoes',
        INVENTARIO: '/api/modules/sigaest/inventario',
        LOCALIZACOES: '/api/modules/sigaest/localizacoes',
    },

    // Financeiro (SIGAFIN)
    FINANCEIRO: {
        CONTAS_RECEBER: '/api/modules/sigafin/contas-receber',
        CONTAS_PAGAR: '/api/modules/sigafin/contas-pagar',
        FLUXO_CAIXA: '/api/modules/sigafin/fluxo-caixa',
        CENTROS_CUSTO: '/api/modules/sigafin/centros-custo',
    },

    // Recursos Humanos (SIGARH)
    RH: {
        FUNCIONARIOS: '/api/modules/sigarh/funcionarios',
        FOLHA_PAGAMENTO: '/api/modules/sigarh/folha-pagamento',
        PONTO: '/api/modules/sigarh/ponto',
        FERIAS: '/api/modules/sigarh/ferias',
    },

    // Compras (SIGACOM)
    COMPRAS: {
        PEDIDOS: '/api/modules/sigacom/pedidos',
        FORNECEDORES: '/api/modules/sigacom/fornecedores',
        COTACOES: '/api/modules/sigacom/cotacoes',
        APROVACOES: '/api/modules/sigacom/aprovacoes',
    },

    // Relatórios
    REPORTS: {
        GENERATE: '/api/reports/generate',
        LIST: '/api/reports',
        DOWNLOAD: (id: string) => `/api/reports/${id}/download`,
        STATUS: (id: string) => `/api/reports/${id}/status`,
    },

    // Sincronização
    SYNC: {
        FULL: '/api/sync/full',
        INCREMENTAL: '/api/sync/incremental',
        STATUS: '/api/sync/status',
        CONFLICTS: '/api/sync/conflicts',
    },
} as const;