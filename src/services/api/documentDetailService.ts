// src/services/api/documentDetailService.ts
import type {
    DocumentApprovalResponse,
    DocumentAttachment,
    DocumentDetails,
    DocumentHistory,
    PurchaseOrderItem,
    PurchaseOrderItemsResponse,
    PurchaseRequestItem,
    PurchaseRequestItemsResponse
} from '../../types/documentDetails';
import { httpService } from './httpService';

class DocumentDetailService {
    private baseUrl = 'backofficeapprovals/api/com/approvals/v1';

    /**
     * Busca detalhes completos de um documento
     */
    async getDocumentDetails(scrId: number): Promise<DocumentDetails> {
        try {
            const response = await httpService.get(`${this.baseUrl}/document/${scrId}`);

            if (!response.success) {
                throw new Error(response.error || 'Falha ao carregar detalhes do documento');
            }

            return response.data as DocumentDetails;
        } catch (error) {
            console.error('Erro ao buscar detalhes do documento:', error);
            throw error instanceof Error ? error : new Error('Falha ao carregar detalhes do documento');
        }
    }

    /**
     * Busca itens de um pedido de compra (PC)
     */
    async getPurchaseOrderItems(
        purchaseOrderId: number,
        page = 1,
        pageSize = 10,
        itemGroup = '01'
    ): Promise<PurchaseOrderItem[]> {
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
                itemGroup: itemGroup
            });

            const response = await httpService.get(
                `${this.baseUrl}/purchaseorder/${purchaseOrderId}/items?${queryParams.toString()}`
            );

            if (!response.success) {
                throw new Error(response.error || 'Falha ao carregar itens do pedido de compra');
            }

            const data = response.data as PurchaseOrderItemsResponse;
            return data.purchaseOrderItems;
        } catch (error) {
            console.error('Erro ao buscar itens do pedido de compra:', error);
            throw error instanceof Error ? error : new Error('Falha ao carregar itens do pedido de compra');
        }
    }

    /**
     * Busca itens de uma solicitação de compra (SC, IP, AE)
     */
    async getPurchaseRequestItems(
        requestId: number,
        page = 1,
        pageSize = 10
    ): Promise<PurchaseRequestItem[]> {
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString()
            });

            const response = await httpService.get(
                `${this.baseUrl}/purchaserequest/${requestId}/items?${queryParams.toString()}`
            );

            if (!response.success) {
                throw new Error(response.error || 'Falha ao carregar itens da solicitação');
            }

            const data = response.data as PurchaseRequestItemsResponse;
            return data.records;
        } catch (error) {
            console.error('Erro ao buscar itens da solicitação:', error);
            throw error instanceof Error ? error : new Error('Falha ao carregar itens da solicitação');
        }
    }

    /**
     * Aprova um documento
     */
    async approveDocument(scrId: number): Promise<DocumentApprovalResponse> {
        try {
            const response = await httpService.post(`${this.baseUrl}/document/${scrId}/approve`, {
                approved: true,
                comments: 'Aprovado via aplicativo móvel'
            });

            if (!response.success) {
                throw new Error(response.error || 'Falha ao aprovar documento');
            }

            return {
                success: true,
                message: 'Documento aprovado com sucesso'
            };
        } catch (error) {
            console.error('Erro ao aprovar documento:', error);
            throw error instanceof Error ? error : new Error('Falha ao aprovar documento');
        }
    }

    /**
     * Reprova um documento
     */
    async rejectDocument(scrId: number, reason: string): Promise<DocumentApprovalResponse> {
        try {
            const response = await httpService.post(`${this.baseUrl}/document/${scrId}/reject`, {
                approved: false,
                comments: reason || 'Reprovado via aplicativo móvel'
            });

            if (!response.success) {
                throw new Error(response.error || 'Falha ao reprovar documento');
            }

            return {
                success: true,
                message: 'Documento reprovado com sucesso'
            };
        } catch (error) {
            console.error('Erro ao reprovar documento:', error);
            throw error instanceof Error ? error : new Error('Falha ao reprovar documento');
        }
    }

    /**
     * Busca histórico de aprovações de um documento
     */
    async getDocumentHistory(scrId: number): Promise<DocumentHistory[]> {
        try {
            const response = await httpService.get(`${this.baseUrl}/document/${scrId}/history`);

            if (!response.success) {
                throw new Error(response.error || 'Falha ao carregar histórico do documento');
            }

            return response.data as DocumentHistory[];
        } catch (error) {
            console.error('Erro ao buscar histórico do documento:', error);
            throw error instanceof Error ? error : new Error('Falha ao carregar histórico do documento');
        }
    }

    /**
     * Busca anexos de um documento
     */
    async getDocumentAttachments(scrId: number): Promise<DocumentAttachment[]> {
        try {
            const response = await httpService.get(`${this.baseUrl}/document/${scrId}/attachments`);

            if (!response.success) {
                throw new Error(response.error || 'Falha ao carregar anexos do documento');
            }

            return response.data as DocumentAttachment[];
        } catch (error) {
            console.error('Erro ao buscar anexos do documento:', error);
            throw error instanceof Error ? error : new Error('Falha ao carregar anexos do documento');
        }
    }

    /**
     * Faz download de um anexo
     */
    async downloadAttachment(attachmentId: number): Promise<Blob> {
        try {
            const response = await httpService.get(
                `${this.baseUrl}/attachment/${attachmentId}/download`,
                { responseType: 'blob' }
            );

            if (!response.success) {
                throw new Error(response.error || 'Falha ao fazer download do anexo');
            }

            return response.data as Blob;
        } catch (error) {
            console.error('Erro ao fazer download do anexo:', error);
            throw error instanceof Error ? error : new Error('Falha ao fazer download do anexo');
        }
    }

    /**
     * Busca aprovadores de um documento
     */
    async getDocumentApprovers(scrId: number): Promise<any[]> {
        try {
            const response = await httpService.get(`${this.baseUrl}/document/${scrId}/approvers`);

            if (!response.success) {
                throw new Error(response.error || 'Falha ao carregar aprovadores do documento');
            }

            return response.data as any[];
        } catch (error) {
            console.error('Erro ao buscar aprovadores do documento:', error);
            throw error instanceof Error ? error : new Error('Falha ao carregar aprovadores do documento');
        }
    }
}

export const documentDetailService = new DocumentDetailService();