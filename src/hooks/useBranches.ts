// src/hooks/useBranches.ts - Hook para gerenciar filiais do Protheus
import { useCallback, useEffect, useState } from 'react';
import { branchesService } from '../services/api/branchesService';
import { useToastStore } from '../store/toastStore';
import type { AppBranch } from '../types/protheus';

interface UseBranchesOptions {
    autoLoad?: boolean;
    pageSize?: number;
    showToasts?: boolean;
}

interface UseBranchesReturn {
    // Estados
    branches: AppBranch[];
    filteredBranches: AppBranch[];
    selectedBranch: AppBranch | null;
    isLoading: boolean;
    isRefreshing: boolean;
    isLoadingMore: boolean;
    hasNextPage: boolean;
    error: string | null;
    searchQuery: string;

    // Estatísticas
    totalBranches: number;
    currentPage: number;

    // Ações
    loadBranches: (showLoading?: boolean) => Promise<void>;
    refreshBranches: () => Promise<void>;
    loadMoreBranches: () => Promise<void>;
    searchBranches: (query: string) => void;
    setSearchQuery: (query: string) => void;
    selectBranch: (branch: AppBranch | null) => void;
    clearError: () => void;
    clearCache: () => void;

    // Busca específica
    findBranchByCode: (code: string) => Promise<AppBranch | null>;
    getAllBranches: () => Promise<AppBranch[]>;
}

export const useBranches = (options: UseBranchesOptions = {}): UseBranchesReturn => {
    const {
        autoLoad = true,
        pageSize = 20,
        showToasts = true,
    } = options;

    const { showSuccess, showError, showInfo } = useToastStore();

    // Estados principais
    const [branches, setBranches] = useState<AppBranch[]>([]);
    const [filteredBranches, setFilteredBranches] = useState<AppBranch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<AppBranch | null>(null);
    const [searchQuery, setSearchQueryState] = useState('');

    // Estados de loading
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Estados de paginação
    const [hasNextPage, setHasNextPage] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Estado de erro
    const [error, setError] = useState<string | null>(null);

    // Timeout para debounce de busca
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

    // Auto load na montagem
    useEffect(() => {
        if (autoLoad && branches.length === 0) {
            loadBranches(true);
        }
    }, [autoLoad]);

    // Efeito de busca com debounce
    useEffect(() => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        if (searchQuery.trim()) {
            const timeout = setTimeout(() => {
                performLocalSearch(searchQuery);
            }, 300);
            setSearchTimeout(timeout as any);
        } else {
            setFilteredBranches(branches);
        }

        return () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    }, [searchQuery, branches]);

    /**
     * Busca local nas filiais já carregadas
     */
    const performLocalSearch = useCallback((query: string) => {
        console.log('🔍 Busca local de filiais:', query);

        if (!query.trim()) {
            setFilteredBranches(branches);
            return;
        }

        const searchTerm = query.toLowerCase();
        const filtered = branches.filter(branch =>
            branch.name.toLowerCase().includes(searchTerm) ||
            branch.code.toLowerCase().includes(searchTerm) ||
            branch.location.toLowerCase().includes(searchTerm) ||
            branch.description?.toLowerCase().includes(searchTerm)
        );

        console.log(`📊 Encontradas ${filtered.length} filiais localmente`);
        setFilteredBranches(filtered);

        if (showToasts && query.trim() && filtered.length === 0) {
            showInfo(`ℹ️ Nenhuma filial encontrada para "${query}"`);
        }
    }, [branches, showToasts, showInfo]);

    /**
     * Carrega filiais do servidor
     */
    const loadBranches = useCallback(async (showLoading = false, page = 1, append = false): Promise<void> => {
        console.log('🏢 Carregando filiais...', { showLoading, page, append });

        if (showLoading) {
            setIsLoading(true);
        } else if (page > 1) {
            setIsLoadingMore(true);
        }

        setError(null);

        try {
            const result = await branchesService.getBranches({
                pageSize,
                page,
            });

            console.log('📊 Resultado das filiais:', {
                success: result.success,
                branches: result.branches.length,
                hasNext: result.hasNext,
            });

            if (result.success) {
                let newBranches: AppBranch[];

                if (append && page > 1) {
                    // Adicionar à lista existente (paginação)
                    newBranches = [...branches, ...result.branches];
                } else {
                    // Substituir lista (primeiro carregamento ou refresh)
                    newBranches = result.branches;
                }

                setBranches(newBranches);
                setFilteredBranches(newBranches);
                setHasNextPage(result.hasNext);
                setCurrentPage(page);

                // Toasts de sucesso
                if (showToasts) {
                    if (result.branches.length === 0 && page === 1) {
                        showInfo('ℹ️ Nenhuma filial encontrada');
                    } else if (page === 1) {
                        showSuccess(`✅ ${result.branches.length} filiais carregadas`);
                    }
                }
            } else {
                const errorMsg = result.error || 'Erro ao carregar filiais';
                setError(errorMsg);

                if (showToasts) {
                    showError(`❌ ${errorMsg}`);
                }
            }
        } catch (error: any) {
            const errorMsg = error.message || 'Erro inesperado ao carregar filiais';
            console.error('❌ Erro ao carregar filiais:', error);
            setError(errorMsg);

            if (showToasts) {
                showError(`❌ ${errorMsg}`);
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
            setIsLoadingMore(false);
        }
    }, [pageSize, branches, showToasts, showSuccess, showError, showInfo]);

    /**
     * Refresh das filiais
     */
    const refreshBranches = useCallback(async (): Promise<void> => {
        console.log('🔄 Fazendo refresh das filiais');
        setIsRefreshing(true);
        setCurrentPage(1);
        branchesService.clearCache(); // Limpar cache para forçar busca nova
        await loadBranches(false, 1, false);
    }, [loadBranches]);

    /**
     * Carregar mais filiais (paginação)
     */
    const loadMoreBranches = useCallback(async (): Promise<void> => {
        if (!isLoadingMore && hasNextPage && !searchQuery.trim()) {
            console.log('📄 Carregando mais filiais:', currentPage + 1);
            await loadBranches(false, currentPage + 1, true);
        }
    }, [isLoadingMore, hasNextPage, currentPage, searchQuery, loadBranches]);

    /**
     * Busca filiais
     */
    const searchBranches = useCallback((query: string): void => {
        console.log('🔍 Iniciando busca de filiais:', query);
        setSearchQueryState(query);
    }, []);

    /**
     * Define query de busca
     */
    const setSearchQuery = useCallback((query: string): void => {
        setSearchQueryState(query);
    }, []);

    /**
     * Seleciona uma filial
     */
    const selectBranch = useCallback((branch: AppBranch | null): void => {
        console.log('🏢 Filial selecionada:', branch?.name || 'Nenhuma');
        setSelectedBranch(branch);
    }, []);

    /**
     * Limpa erro
     */
    const clearError = useCallback((): void => {
        setError(null);
    }, []);

    /**
     * Limpa cache
     */
    const clearCache = useCallback((): void => {
        console.log('🗑️ Limpando cache de filiais');
        branchesService.clearCache();
    }, []);

    /**
     * Busca filial por código
     */
    const findBranchByCode = useCallback(async (code: string): Promise<AppBranch | null> => {
        console.log('🔍 Buscando filial por código:', code);

        // Primeiro busca localmente
        const localBranch = branches.find(b => b.code === code || b.id === code);
        if (localBranch) {
            console.log('💾 Filial encontrada localmente');
            return localBranch;
        }

        // Busca no servidor
        try {
            const branch = await branchesService.getBranchByCode(code);

            if (branch && showToasts) {
                showSuccess(`✅ Filial encontrada: ${branch.name}`);
            } else if (!branch && showToasts) {
                showError(`❌ Filial não encontrada: ${code}`);
            }

            return branch;
        } catch (error: any) {
            console.error('❌ Erro ao buscar filial por código:', error);

            if (showToasts) {
                showError(`❌ Erro ao buscar filial: ${error.message}`);
            }

            return null;
        }
    }, [branches, showToasts, showSuccess, showError]);

    /**
     * Obtém todas as filiais (com paginação automática)
     */
    const getAllBranches = useCallback(async (): Promise<AppBranch[]> => {
        console.log('🏢 Buscando TODAS as filiais...');
        setIsLoading(true);
        setError(null);

        try {
            const result = await branchesService.getAllBranches();

            if (result.success) {
                setBranches(result.branches);
                setFilteredBranches(result.branches);

                if (showToasts) {
                    showSuccess(`✅ ${result.branches.length} filiais carregadas`);
                }

                return result.branches;
            } else {
                const errorMsg = result.error || 'Erro ao carregar todas as filiais';
                setError(errorMsg);

                if (showToasts) {
                    showError(`❌ ${errorMsg}`);
                }

                return [];
            }
        } catch (error: any) {
            const errorMsg = error.message || 'Erro inesperado ao carregar todas as filiais';
            console.error('❌ Erro ao carregar todas as filiais:', error);
            setError(errorMsg);

            if (showToasts) {
                showError(`❌ ${errorMsg}`);
            }

            return [];
        } finally {
            setIsLoading(false);
        }
    }, [showToasts, showSuccess, showError]);

    return {
        // Estados
        branches,
        filteredBranches,
        selectedBranch,
        isLoading,
        isRefreshing,
        isLoadingMore,
        hasNextPage,
        error,
        searchQuery,

        // Estatísticas
        totalBranches: branches.length,
        currentPage,

        // Ações
        loadBranches,
        refreshBranches,
        loadMoreBranches,
        searchBranches,
        setSearchQuery,
        selectBranch,
        clearError,
        clearCache,

        // Busca específica
        findBranchByCode,
        getAllBranches,
    };
};