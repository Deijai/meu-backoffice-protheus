// src/types/approvals.ts
export interface Document {
    documentBranch: string;
    documentNumber: string;
    documentTotal: number;
    documentExchangeValue: number;
    documentType: DocumentType;
    documentUserName: string;
    documentGroupAprov: string;
    documentItemGroup: string;
    documentStatus: DocumentStatus;
    documentCurrency: number;
    documentExchangeRate: number;
    documentSymbol: string;
    documentStrongSymbol: string;
    documentCreated: string;
    scrId: number;
    purchaseOrder?: PurchaseOrder[];
    purchaseRequest?: PurchaseRequest[];
}

export interface PurchaseOrder {
    supplyerName: string;
    paymentTermDescription: string;
    purchaserName: string;
    date: string;
    itemDescriptionCostCenter?: string;
}

export interface PurchaseRequest {
    requesterName: string;
    date: string;
    CostCenter: string;
}

// Tipos de documentos organizados por módulo do Protheus
export type DocumentType =
    // Módulo de Compras (SIGACOM)
    | 'PC'  // Pedido de Compra
    | 'IP'  // Pedido de Compra por Item
    | 'AE'  // Autorização de Entrega
    | 'SC'  // Solicitação de Compra
    // Módulo de Contratos (SIGAGCT - Gestão de Contratos)
    | 'CT'  // Contratos
    | 'MD'  // Medição de Contratos
    | 'IM'  // Medição de Contratos por Item
    // Módulo de Estoque (SIGAEST)
    | 'SA'; // Solicitação ao Armazém

export type DocumentStatus = '02' | '03' | '06'; // Pendente, Aprovado, Reprovado

export interface DocumentsResponse {
    documents: Document[];
    hasNext: boolean;
}

export interface FilterState {
    searchkey?: string;
    initDate?: string;
    endDate?: string;
    documentBranch?: string[];
    documentTypes?: DocumentType[];
}

export interface GetDocumentsParams {
    page: number;
    documentStatus: DocumentStatus;
    documenttype?: DocumentType;
    documentBranch?: string;
    initDate?: string;
    endDate?: string;
    searchkey?: string;
}

export interface SortOption {
    key: string;
    label: string;
    field: keyof Document;
    direction: 'asc' | 'desc';
}

// Mapeamento dos códigos dos módulos do Protheus para os tipos de documentos
export const MODULE_DOCUMENT_TYPES: Record<string, {
    name: string;
    documentTypes: DocumentType[];
    color: string;
    icon: string;
}> = {
    'SIGACOM': {
        name: 'Compras',
        documentTypes: ['PC', 'IP', 'AE', 'SC'],
        color: '#805ad5',
        icon: 'bag-outline'
    },
    'SIGAGCT': {
        name: 'Contratos',
        documentTypes: ['CT', 'MD', 'IM'],
        color: '#d69e2e',
        icon: 'document-text-outline'
    },
    'SIGAEST': {
        name: 'Estoque',
        documentTypes: ['SA'],
        color: '#38a169',
        icon: 'cube-outline'
    },
    // Módulos que não têm documentos de aprovação, mas podem ser selecionados
    'SIGAFAT': {
        name: 'Faturamento',
        documentTypes: [],
        color: '#0c9abe',
        icon: 'receipt-outline'
    },
    'SIGAFIN': {
        name: 'Financeiro',
        documentTypes: [],
        color: '#d69e2e',
        icon: 'card-outline'
    },
    'SIGARH': {
        name: 'Recursos Humanos',
        documentTypes: [],
        color: '#e53e3e',
        icon: 'people-outline'
    }
};

// Tipos de documentos com seus nomes
export const DOCUMENT_TYPES: Record<DocumentType, string> = {
    // Módulo de Compras
    'PC': 'Pedido de Compra',
    'IP': 'Pedido de Compra por Item',
    'AE': 'Autorização de Entrega',
    'SC': 'Solicitação de Compra',
    // Módulo de Contratos
    'CT': 'Contratos',
    'MD': 'Medição de Contratos',
    'IM': 'Medição de Contratos por Item',
    // Módulo de Estoque
    'SA': 'Solicitação ao Armazém'
};

// Mapeamento de documentos para módulos
export const DOCUMENT_TO_MODULE_MAP: Record<DocumentType, string> = {
    'PC': 'SIGACOM',
    'IP': 'SIGACOM',
    'AE': 'SIGACOM',
    'SC': 'SIGACOM',
    'CT': 'SIGAGCT',
    'MD': 'SIGAGCT',
    'IM': 'SIGAGCT',
    'SA': 'SIGAEST'
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
    '02': 'Pendente',
    '03': 'Aprovado',
    '06': 'Reprovado'
};

// Utilitários para módulos
export const getDocumentTypesForModule = (moduleCode: string): DocumentType[] => {
    return MODULE_DOCUMENT_TYPES[moduleCode]?.documentTypes || [];
};

export const getModuleInfo = (moduleCode: string) => {
    return MODULE_DOCUMENT_TYPES[moduleCode] || {
        name: 'Módulo Desconhecido',
        documentTypes: [],
        color: '#6c757d',
        icon: 'help-outline'
    };
};

export const hasDocumentsForApproval = (moduleCode: string): boolean => {
    const documentTypes = getDocumentTypesForModule(moduleCode);
    return documentTypes.length > 0;
};

export const getDocumentModule = (documentType: DocumentType): string => {
    return DOCUMENT_TO_MODULE_MAP[documentType];
};

export const getModuleColor = (moduleCode: string): string => {
    return getModuleInfo(moduleCode).color;
};

export const getModuleIcon = (moduleCode: string): string => {
    return getModuleInfo(moduleCode).icon;
};

// Utilitários para formatação
export const formatCurrency = (value: number, symbol: string): string => {
    return `${symbol} ${value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

export const formatDate = (dateString: string): string => {
    if (!dateString || dateString.length !== 8) return dateString;

    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);

    return `${day}/${month}/${year}`;
};

export const getStatusColor = (status: DocumentStatus): string => {
    switch (status) {
        case '02': return '#0c9abe'; // Azul para pendentes
        case '03': return '#28a745'; // Verde para aprovados
        case '06': return '#dc3545'; // Vermelho para reprovados
        default: return '#6c757d';
    }
};

export const getDocumentTypeIcon = (type: DocumentType): string => {
    switch (type) {
        // Módulo de Compras
        case 'PC': return 'document-text';
        case 'IP': return 'list';
        case 'AE': return 'checkmark-circle';
        case 'SC': return 'add-circle';
        // Módulo de Contratos
        case 'CT': return 'contract';
        case 'MD': return 'calculator';
        case 'IM': return 'bar-chart';
        // Módulo de Estoque
        case 'SA': return 'cube';
        default: return 'document';
    }
};