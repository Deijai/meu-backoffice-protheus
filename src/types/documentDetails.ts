// src/types/documentDetails.ts
export interface DocumentDetails {
    scrId: number;
    documentNumber: string;
    documentType: DocumentType;
    documentStatus: string;
    documentCreated: string;
    documentTotal: number;
    documentBranch: string;
    supplierName?: string;
    supplierCode?: string;
    observations?: string;
    deliveryDate?: string;
    requestedBy?: string;
    costCenter?: string;
}

export interface PurchaseOrderItem {
    purchaseOrderNumber: string;
    purchaseOrderItem: string;
    costCenter: string;
    quantity: number;
    itemTotal: number;
    unitValue: number;
    itemSku: string;
    unitMeasurement: string;
    itemSkuDescription: string;
    currency: string;
    groupAprov: string;
    itemGroup: string;
}

export interface PurchaseRequestItem {
    requestNumber: string;
    requestItem: string;
    itemProduct: string;
    unitMeasurement: string;
    quantity: number;
    costCenter: string;
    itemTotal: number;
    unitValue: number;
    currency: string;
    sc1Id: number;
    groupAprov: string;
    itemGroup: string;
    itemSkuDescription: string;
}

export interface PurchaseOrderItemsResponse {
    hasNext: boolean;
    purchaseOrderItems: PurchaseOrderItem[];
}

export interface PurchaseRequestItemsResponse {
    hasNext: boolean;
    records: PurchaseRequestItem[];
}

export interface DocumentApprovalResponse {
    success: boolean;
    message: string;
}

export type DocumentType = 'PC' | 'SC' | 'IP' | 'AE' | 'CT' | 'MD' | 'IM' | 'SA';

export interface DocumentHistory {
    id: number;
    action: string;
    date: string;
    user: string;
    comments?: string;
}

export interface DocumentAttachment {
    id: number;
    fileName: string;
    fileSize: number;
    uploadDate: string;
    downloadUrl: string;
}