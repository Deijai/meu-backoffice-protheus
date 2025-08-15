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

export type DocumentType = 'PC' | 'IP' | 'AE' | 'SC' | 'MD' | 'IM' | 'CT' | 'SA';
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

export const DOCUMENT_TYPES: Record<DocumentType, string> = {
    'PC': 'Pedido de Compra',
    'IP': 'Pedido de Compra por Item',
    'AE': 'Autorização de Entrega',
    'SC': 'Solicitação de Compra',
    'MD': 'Medição de Contrato',
    'IM': 'Medição de Contrato por Item',
    'CT': 'Contrato',
    'SA': 'Solicitação ao Armazém'
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
    '02': 'Pendente',
    '03': 'Aprovado',
    '06': 'Reprovado'
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
        case 'PC': return 'document-text';
        case 'IP': return 'list';
        case 'AE': return 'checkmark-circle';
        case 'SC': return 'add-circle';
        case 'MD': return 'calculator';
        case 'IM': return 'bar-chart';
        case 'CT': return 'contract';
        case 'SA': return 'cube';
        default: return 'document';
    }
};