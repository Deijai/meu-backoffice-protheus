// src/store/approvalsStore.ts - VERSÃO CORRIGIDA
import { create } from 'zustand';
import { approvalsService } from '../services/api/approvalsService';
import type {
    Document,
    DocumentStatus,
    DocumentType,
    FilterState,
    SortOption
} from '../types/approvals';
import { getDocumentTypesForModule } from '../types/approvals';
import { useAuthStore } from './authStore';

// Definir SORT_OPTIONS aqui no store
const SORT_OPTIONS: SortOption[] = [
    {
        key: 'value_desc',
        label: 'Maior valor',
        field: 'documentTotal',
        direction: 'desc'
    },
    {
        key: 'value_asc',
        label: 'Menor valor',
        field: 'documentTotal',
        direction: 'asc'
    },
    {
        key: 'date_desc',
        label: 'Mais recente',
        field: 'documentCreated',
        direction: 'desc'
    },
    {
        key: 'date_asc',
        label: 'Mais antigo',
        field: 'documentCreated',
        direction: 'asc'
    },
    {
        key: 'type_asc',
        label: 'Tipo de documento ASC',
        field: 'documentType',
        direction: 'asc'
    },
    {
        key: 'type_desc',
        label: 'Tipo de documento DESC',
        field: 'documentType',
        direction: 'desc'
    }
];

interface ApprovalsState {
    // Estado dos documentos
    documents: Document[];
    selectedDocuments: number[];
    currentStatus: DocumentStatus;
    currentPage: number;
    hasNextPage: boolean;
    isLoading: boolean;
    isLoadingMore: boolean;
    isRefreshing: boolean;
    error: string | null;

    // Filtros e ordenação
    filters: FilterState;
    sortOption: SortOption;

    // Dashboard
    dashboardSummary: Record<DocumentType, {
        pending: number;
        approved: number;
        rejected: number;
    }>;
    isDashboardLoading: boolean;

    // Ações de carregamento
    loadDocuments: (status: DocumentStatus, reset?: boolean) => Promise<void>;
    loadMoreDocuments: () => Promise<void>;
    refreshDocuments: () => Promise<void>;
    loadDashboardSummary: (documentTypes: DocumentType[]) => Promise<void>;

    // Ações de seleção
    selectDocument: (scrId: number) => void;
    selectAllDocuments: () => void;
    clearSelection: () => void;
    isDocumentSelected: (scrId: number) => boolean;
    getSelectedDocuments: () => Document[];

    // Ações de aprovação
    approveSelected: () => Promise<void>;
    rejectSelected: (reason?: string) => Promise<void>;

    // Filtros e ordenação
    setFilters: (filters: Partial<FilterState>) => void;
    clearFilters: () => void;
    setSortOption: (option: SortOption) => void;
    sortDocuments: (documents: Document[]) => Document[];

    // Utilitários
    setCurrentStatus: (status: DocumentStatus) => void;
    clearError: () => void;
    getSortOptions: () => SortOption[];
    getCurrentModuleCode: () => string | null;
    getValidDocumentTypesForCurrentModule: () => DocumentType[];
}

export const useApprovalsStore = create<ApprovalsState>((set, get) => ({
    // Estado inicial
    documents: [],
    selectedDocuments: [],
    currentStatus: '02',
    currentPage: 1,
    hasNextPage: false,
    isLoading: false,
    isLoadingMore: false,
    isRefreshing: false,
    error: null,

    filters: {},
    sortOption: SORT_OPTIONS[2], // Mais recente por padrão

    dashboardSummary: {
        PC: { pending: 0, approved: 0, rejected: 0 },
        IP: { pending: 0, approved: 0, rejected: 0 },
        AE: { pending: 0, approved: 0, rejected: 0 },
        SC: { pending: 0, approved: 0, rejected: 0 },
        MD: { pending: 0, approved: 0, rejected: 0 },
        IM: { pending: 0, approved: 0, rejected: 0 },
        CT: { pending: 0, approved: 0, rejected: 0 },
        SA: { pending: 0, approved: 0, rejected: 0 }
    },
    isDashboardLoading: false,

    // Utilitários para módulo
    getCurrentModuleCode: () => {
        const authStore = useAuthStore.getState();
        return authStore.selectedModule?.code || null;
    },

    getValidDocumentTypesForCurrentModule: () => {
        const moduleCode = get().getCurrentModuleCode();
        return moduleCode ? getDocumentTypesForModule(moduleCode) : [];
    },

    // Carregamento de documentos
    loadDocuments: async (status: DocumentStatus, reset = true) => {
        const state = get();

        if (reset) {
            set({
                isLoading: true,
                documents: [],
                currentPage: 1,
                selectedDocuments: [],
                error: null
            });
        }

        try {
            // Obter tipos de documentos válidos para o módulo atual
            const validDocumentTypes = state.getValidDocumentTypesForCurrentModule();

            // Se não há módulo selecionado ou módulo não tem documentos de aprovação
            if (validDocumentTypes.length === 0) {
                set({
                    documents: [],
                    hasNextPage: false,
                    isLoading: false,
                    isLoadingMore: false,
                    error: 'Selecione um módulo que tenha documentos de aprovação'
                });
                return;
            }

            // Fazer requisições para cada tipo de documento do módulo
            // Isso é necessário porque a API atual aceita apenas um documenttype por vez
            const allDocuments: Document[] = [];
            let hasAnyNext = false;

            for (const documentType of validDocumentTypes) {
                try {
                    const params = {
                        page: reset ? 1 : state.currentPage,
                        documentStatus: status,
                        documenttype: documentType,
                        // Aplicar outros filtros (exceto documentTypes que já está sendo tratado)
                        ...(state.filters.searchkey && { searchkey: state.filters.searchkey }),
                        ...(state.filters.initDate && { initDate: state.filters.initDate }),
                        ...(state.filters.endDate && { endDate: state.filters.endDate }),
                        ...(state.filters.documentBranch && state.filters.documentBranch.length > 0 && {
                            documentBranch: state.filters.documentBranch.join(',')
                        })
                    };

                    const response = await approvalsService.getDocuments(params);

                    // Aplicar filtro adicional por tipos de documentos se especificado nos filtros
                    let filteredDocuments = response.documents;
                    if (state.filters.documentTypes && state.filters.documentTypes.length > 0) {
                        filteredDocuments = response.documents.filter(doc =>
                            state.filters.documentTypes!.includes(doc.documentType)
                        );
                    }

                    allDocuments.push(...filteredDocuments);

                    if (response.hasNext) {
                        hasAnyNext = true;
                    }
                } catch (error) {
                    console.warn(`Erro ao carregar documentos do tipo ${documentType}:`, error);
                    // Continua carregando outros tipos mesmo se um falhar
                }
            }

            // Ordenar documentos combinados
            const sortedDocuments = state.sortDocuments(allDocuments);

            set({
                documents: reset ? sortedDocuments : [...state.documents, ...sortedDocuments],
                hasNextPage: hasAnyNext,
                currentStatus: status,
                isLoading: false,
                isLoadingMore: false,
                error: null
            });
        } catch (error) {
            set({
                isLoading: false,
                isLoadingMore: false,
                error: error instanceof Error ? error.message : 'Erro ao carregar documentos'
            });
        }
    },

    loadMoreDocuments: async () => {
        const state = get();

        if (state.isLoadingMore || !state.hasNextPage) return;

        set({ isLoadingMore: true, currentPage: state.currentPage + 1 });
        await state.loadDocuments(state.currentStatus, false);
    },

    refreshDocuments: async () => {
        const state = get();
        set({ isRefreshing: true });
        await state.loadDocuments(state.currentStatus, true);
        set({ isRefreshing: false });
    },

    loadDashboardSummary: async (documentTypes: DocumentType[]) => {
        set({ isDashboardLoading: true });

        try {
            const summary = await approvalsService.getDashboardSummary(documentTypes);
            set({
                dashboardSummary: summary,
                isDashboardLoading: false
            });
        } catch (error) {
            console.error('Erro ao carregar resumo do dashboard:', error);
            set({ isDashboardLoading: false });
        }
    },

    // Seleção de documentos
    selectDocument: (scrId: number) => {
        const state = get();
        const document = state.documents.find(d => d.scrId === scrId);

        if (!document) return;

        // Verifica se pode selecionar (apenas do mesmo tipo)
        const selectedDocs = state.getSelectedDocuments();
        if (selectedDocs.length > 0 && selectedDocs[0].documentType !== document.documentType) {
            return; // Não permite selecionar tipos diferentes
        }

        const isSelected = state.selectedDocuments.includes(scrId);

        set({
            selectedDocuments: isSelected
                ? state.selectedDocuments.filter(id => id !== scrId)
                : [...state.selectedDocuments, scrId]
        });
    },

    selectAllDocuments: () => {
        const state = get();
        const selectableDocuments = state.documents
            .filter(doc => doc.documentStatus === '02') // Apenas pendentes
            .map(doc => doc.scrId);

        set({ selectedDocuments: selectableDocuments });
    },

    clearSelection: () => {
        set({ selectedDocuments: [] });
    },

    isDocumentSelected: (scrId: number) => {
        return get().selectedDocuments.includes(scrId);
    },

    getSelectedDocuments: () => {
        const state = get();
        return state.documents.filter(doc =>
            state.selectedDocuments.includes(doc.scrId)
        );
    },

    // Aprovação/Reprovação
    approveSelected: async () => {
        const state = get();
        const selectedIds = state.selectedDocuments;

        if (selectedIds.length === 0) return;

        try {
            set({ isLoading: true });
            await approvalsService.approveDocuments(selectedIds);

            // Remove documentos aprovados da lista se estiver visualizando pendentes
            if (state.currentStatus === '02') {
                set({
                    documents: state.documents.filter(doc => !selectedIds.includes(doc.scrId)),
                    selectedDocuments: []
                });
            }

            set({ isLoading: false });
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Erro ao aprovar documentos'
            });
        }
    },

    rejectSelected: async (reason?: string) => {
        const state = get();
        const selectedIds = state.selectedDocuments;

        if (selectedIds.length === 0) return;

        try {
            set({ isLoading: true });
            await approvalsService.rejectDocuments(selectedIds, reason);

            // Remove documentos reprovados da lista se estiver visualizando pendentes
            if (state.currentStatus === '02') {
                set({
                    documents: state.documents.filter(doc => !selectedIds.includes(doc.scrId)),
                    selectedDocuments: []
                });
            }

            set({ isLoading: false });
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Erro ao reprovar documentos'
            });
        }
    },

    // Filtros e ordenação
    setFilters: (newFilters: Partial<FilterState>) => {
        const state = get();
        const validDocumentTypes = state.getValidDocumentTypesForCurrentModule();

        // Filtra tipos de documentos para manter apenas os válidos para o módulo atual
        let filteredDocumentTypes = newFilters.documentTypes;
        if (filteredDocumentTypes) {
            filteredDocumentTypes = filteredDocumentTypes.filter(type =>
                validDocumentTypes.includes(type)
            );
        }

        set({
            filters: {
                ...state.filters,
                ...newFilters,
                documentTypes: filteredDocumentTypes
            }
        });

        // Recarrega documentos com novos filtros
        state.loadDocuments(state.currentStatus, true);
    },

    clearFilters: () => {
        set({ filters: {} });
        get().loadDocuments(get().currentStatus, true);
    },

    setSortOption: (option: SortOption) => {
        const state = get();
        set({ sortOption: option });

        // Reordena documentos atuais
        const sortedDocuments = state.sortDocuments(state.documents);
        set({ documents: sortedDocuments });
    },

    sortDocuments: (documents: Document[]) => {
        const { sortOption } = get();

        return [...documents].sort((a, b) => {
            const aValue = a[sortOption.field];
            const bValue = b[sortOption.field];

            let comparison = 0;

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                comparison = aValue.localeCompare(bValue);
            } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                comparison = aValue - bValue;
            }

            return sortOption.direction === 'desc' ? -comparison : comparison;
        });
    },

    // Utilitários
    setCurrentStatus: (status: DocumentStatus) => {
        set({ currentStatus: status, selectedDocuments: [] });
    },

    clearError: () => {
        set({ error: null });
    },

    getSortOptions: () => {
        return SORT_OPTIONS;
    }
}));