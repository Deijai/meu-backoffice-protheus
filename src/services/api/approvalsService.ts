// src/services/api/approvalsService.ts
import type {
    Document,
    DocumentsResponse,
    DocumentStatus,
    DocumentType,
    GetDocumentsParams
} from '../../types/approvals';
import { httpService } from './httpService';

class ApprovalsService {
    private baseUrl = 'backofficeapprovals/api/com/approvals/v1';

    /**
     * Busca lista de documentos para aprovação
     */
    async getDocuments(params: GetDocumentsParams): Promise<DocumentsResponse> {
        try {
            const queryParams = new URLSearchParams();

            // Parâmetros obrigatórios
            queryParams.append('page', params.page.toString());
            queryParams.append('documentStatus', params.documentStatus);

            // Parâmetros opcionais
            if (params.documenttype) {
                queryParams.append('documenttype', params.documenttype);
            }

            if (params.documentBranch) {
                queryParams.append('documentBranch', params.documentBranch);
            }

            if (params.initDate) {
                queryParams.append('initDate', params.initDate);
            }

            if (params.endDate) {
                queryParams.append('endDate', params.endDate);
            }

            if (params.searchkey) {
                queryParams.append('searchkey', params.searchkey);
            }

            const response = await httpService.get(`${this.baseUrl}/approvalsList?${queryParams.toString()}`);

            if (!response.success) {
                throw new Error(response.error || 'Falha ao carregar documentos');
            }

            return response.data as DocumentsResponse;
        } catch (error) {
            console.error('Erro ao buscar documentos:', error);
            throw error instanceof Error ? error : new Error('Falha ao carregar documentos para aprovação');
        }
    }

    /**
     * Busca detalhes de um documento específico
     */
    async getDocumentDetails(scrId: number): Promise<Document> {
        try {
            const response = await httpService.get(`${this.baseUrl}/document/${scrId}`);

            if (!response.success) {
                throw new Error(response.error || 'Falha ao carregar detalhes do documento');
            }

            return response.data as Document;
        } catch (error) {
            console.error('Erro ao buscar detalhes do documento:', error);
            throw error instanceof Error ? error : new Error('Falha ao carregar detalhes do documento');
        }
    }

    /**
     * Aprova documentos selecionados
     */
    async approveDocuments(scrIds: number[]): Promise<void> {
        try {
            const response = await httpService.post(`${this.baseUrl}/approve`, {
                documentIds: scrIds
            });

            if (!response.success) {
                throw new Error(response.error || 'Falha ao aprovar documentos');
            }
        } catch (error) {
            console.error('Erro ao aprovar documentos:', error);
            throw error instanceof Error ? error : new Error('Falha ao aprovar documentos');
        }
    }

    /**
     * Reprova documentos selecionados
     */
    async rejectDocuments(scrIds: number[], reason?: string): Promise<void> {
        try {
            const response = await httpService.post(`${this.baseUrl}/reject`, {
                documentIds: scrIds,
                reason: reason || 'Reprovado pelo usuário'
            });

            if (!response.success) {
                throw new Error(response.error || 'Falha ao reprovar documentos');
            }
        } catch (error) {
            console.error('Erro ao reprovar documentos:', error);
            throw error instanceof Error ? error : new Error('Falha ao reprovar documentos');
        }
    }

    /**
     * Busca resumo de documentos para o dashboard
     */
    async getDashboardSummary(documentTypes: DocumentType[]): Promise<Record<DocumentType, {
        pending: number;
        approved: number;
        rejected: number;
    }>> {
        try {
            const summary: Record<string, any> = {};

            // Busca contadores para cada tipo de documento
            for (const type of documentTypes) {
                const [pending, approved, rejected] = await Promise.all([
                    this.getDocumentCount(type, '02'),
                    this.getDocumentCount(type, '03'),
                    this.getDocumentCount(type, '06')
                ]);

                summary[type] = {
                    pending,
                    approved,
                    rejected
                };
            }

            return summary;
        } catch (error) {
            console.error('Erro ao buscar resumo do dashboard:', error);
            throw error instanceof Error ? error : new Error('Falha ao carregar resumo do dashboard');
        }
    }

    /**
     * Busca quantidade de documentos por tipo e status
     */
    private async getDocumentCount(documentType: DocumentType, status: DocumentStatus): Promise<number> {
        try {
            const response = await this.getDocuments({
                page: 1,
                documentStatus: status,
                documenttype: documentType
            });

            // Se não retornou total, estima baseado no hasNext
            return response.documents.length;
        } catch (error) {
            console.error(`Erro ao buscar contador para ${documentType}:${status}`, error);
            return 0;
        }
    }

    /**
     * Busca filiais disponíveis para filtro
     */
    async getAvailableBranches(): Promise<string[]> {
        try {
            // Usar o branchesService existente
            const { BranchesService } = await import('./branchesService');
            const branchesService = BranchesService.getInstance();

            const result = await branchesService.getAllBranches();

            if (result.success && result.branches.length > 0) {
                // Retorna os códigos das filiais formatados
                return result.branches.map(branch => branch.code);
            }

            // Fallback para filiais padrão se não conseguir carregar
            console.warn('Usando filiais padrão como fallback');
            return [
                'D MG 01',
                'D MG 02',
                'D RJ 01',
                'D RJ 02',
                'M PR 01',
                'M PR 02',
                'M SP 01',
                'M SP 02'
            ];
        } catch (error) {
            console.error('Erro ao buscar filiais via branchesService:', error);
            // Retorna filiais padrão em caso de erro
            return [
                'D MG 01',
                'D MG 02',
                'D RJ 01',
                'D RJ 02',
                'M PR 01',
                'M PR 02',
                'M SP 01',
                'M SP 02'
            ];
        }
    }

    /**
     * Busca filiais com nomes para exibição melhorada no filtro
     */
    async getAvailableBranchesWithNames(): Promise<Array<{ code: string; name: string; }>> {
        try {
            // Usar o branchesService existente
            const { BranchesService } = await import('./branchesService');
            const branchesService = BranchesService.getInstance();

            const result = await branchesService.getAllBranches();

            if (result.success && result.branches.length > 0) {
                // Retorna código e nome das filiais
                return result.branches.map(branch => ({
                    code: branch.code,
                    name: branch.name
                }));
            }

            // Fallback para filiais padrão
            console.warn('Usando filiais padrão como fallback (com nomes)');
            return [
                { code: 'D MG 01', name: 'Filial Belo Horizonte' },
                { code: 'D MG 02', name: 'Filial Uberaba' },
                { code: 'D RJ 01', name: 'Filial Rio de Janeiro' },
                { code: 'D RJ 02', name: 'Filial Niterói' },
                { code: 'M PR 01', name: 'Filial Curitiba' },
                { code: 'M PR 02', name: 'Filial Cascavel' },
                { code: 'M SP 01', name: 'Filial São Paulo' },
                { code: 'M SP 02', name: 'Filial Campinas' }
            ];
        } catch (error) {
            console.error('Erro ao buscar filiais com nomes:', error);
            // Fallback
            return [
                { code: 'D MG 01', name: 'Filial Belo Horizonte' },
                { code: 'D MG 02', name: 'Filial Uberaba' },
                { code: 'D RJ 01', name: 'Filial Rio de Janeiro' },
                { code: 'D RJ 02', name: 'Filial Niterói' },
                { code: 'M PR 01', name: 'Filial Curitiba' },
                { code: 'M PR 02', name: 'Filial Cascavel' },
                { code: 'M SP 01', name: 'Filial São Paulo' },
                { code: 'M SP 02', name: 'Filial Campinas' }
            ];
        }
    }

    /**
     * Formata parâmetros de data para a API
     */
    formatDateForApi(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    /**
     * Valida se um documento pode ser aprovado/reprovado
     */
    canManageDocument(document: Document): boolean {
        return document.documentStatus === '02'; // Apenas pendentes podem ser gerenciados
    }

    /**
     * Agrupa documentos por tipo
     */
    groupDocumentsByType(documents: Document[]): Record<DocumentType, Document[]> {
        return documents.reduce((groups, doc) => {
            if (!groups[doc.documentType]) {
                groups[doc.documentType] = [];
            }
            groups[doc.documentType].push(doc);
            return groups;
        }, {} as Record<DocumentType, Document[]>);
    }
}

export const approvalsService = new ApprovalsService();