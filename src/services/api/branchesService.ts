// src/services/api/branchesService.ts - Serviço de Filiais do Protheus
import { useConfigStore } from '../../store/configStore';
import type {
    AppBranch,
    ProteusBranch,
    ProteusBranchesResponse
} from '../../types/protheus';
import { authService } from './authService';
import { httpService } from './httpService';

interface BranchesParams {
    pageSize?: number;
    page?: number;
    search?: string;
}

interface BranchesResult {
    success: boolean;
    branches: AppBranch[];
    hasNext: boolean;
    error?: string;
    total?: number;
    page?: number;
}

export class BranchesService {
    private static instance: BranchesService;
    private cache: Map<string, BranchesResult> = new Map();
    private cacheTimeout = 5 * 60 * 1000; // 5 minutos

    private constructor() { }

    static getInstance(): BranchesService {
        if (!BranchesService.instance) {
            BranchesService.instance = new BranchesService();
        }
        return BranchesService.instance;
    }

    /**
     * Busca filiais do Protheus com paginação
     */
    async getBranches(params: BranchesParams = {}): Promise<BranchesResult> {
        const { pageSize = 20, page = 1, search = '' } = params;

        console.log('🏢 === BUSCANDO FILIAIS PROTHEUS ===');
        console.log('📄 Parâmetros:', { pageSize, page, search });

        // Verificar autenticação
        const currentUser = await authService.getCurrentUser();
        if (!currentUser || !currentUser.access_token) {
            console.error('❌ Usuário não autenticado para buscar filiais');
            return {
                success: false,
                branches: [],
                hasNext: false,
                error: 'Usuário não autenticado',
            };
        }

        // Verificar configuração
        const { connection } = useConfigStore.getState();
        if (!connection.baseUrl) {
            console.error('❌ URL base não configurada');
            return {
                success: false,
                branches: [],
                hasNext: false,
                error: 'Configuração de servidor não encontrada',
            };
        }

        // Chave do cache
        const cacheKey = `branches_${pageSize}_${page}_${search}`;

        // Verificar cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey)!;
            const cacheAge = Date.now() - (cached as any).timestamp;

            if (cacheAge < this.cacheTimeout) {
                console.log('💾 Usando cache de filiais');
                return cached;
            } else {
                console.log('🗑️ Cache expirado, removendo');
                this.cache.delete(cacheKey);
            }
        }

        // Construir URL
        const endpoint = '/api/framework/environment/v1/branches';
        let url = `${endpoint}?pageSize=${pageSize}`;

        if (page > 1) {
            url += `&page=${page}`;
        }

        if (search.trim()) {
            url += `&search=${encodeURIComponent(search.trim())}`;
        }

        console.log('🔗 URL da requisição:', `${connection.baseUrl}${url}`);

        try {
            // Fazer requisição autenticada
            const response = await httpService.get<ProteusBranchesResponse>(url);

            console.log('📊 Resposta do servidor:', {
                success: response.success,
                status: response.status,
                dataType: response.data ? typeof response.data : 'undefined',
                hasItems: response.data?.items ? response.data.items.length : 0,
            });

            if (!response.success) {
                console.error('❌ Erro na resposta do servidor:', response.error);
                return {
                    success: false,
                    branches: [],
                    hasNext: false,
                    error: response.error || 'Erro ao buscar filiais',
                };
            }

            if (!response.data || !Array.isArray(response.data.items)) {
                console.error('❌ Formato de resposta inválido:', response.data);
                return {
                    success: false,
                    branches: [],
                    hasNext: false,
                    error: 'Formato de resposta inválido do servidor',
                };
            }

            console.log('✅ Dados recebidos do servidor');
            console.log('📊 Quantidade de filiais:', response.data.items.length);
            console.log('➡️ Tem próxima página:', response.data.hasNext);

            // Log detalhado da primeira filial para debug
            if (response.data.items.length > 0) {
                console.log('🏢 Primeira filial (exemplo):', {
                    Code: response.data.items[0].Code,
                    Description: response.data.items[0].Description,
                    City: response.data.items[0].City,
                    State: response.data.items[0].State,
                });
            }

            // Converter filiais do Protheus para formato do app
            const convertProteusBranchToApp = (proteusBranch: ProteusBranch): AppBranch => {
                return {
                    id: proteusBranch.Code.trim(),
                    code: proteusBranch.Code.trim(),
                    name: proteusBranch.Description.trim(),
                    location: `${proteusBranch.City.trim()}, ${proteusBranch.State.trim()}`,
                    description: proteusBranch.Title.trim(),
                    // Dados extras
                    enterpriseGroup: proteusBranch.EnterpriseGroup,
                    companyCode: proteusBranch.CompanyCode,
                    unitOfBusiness: proteusBranch.UnitOfBusiness,
                    cgc: proteusBranch.Cgc,
                    phone: proteusBranch.Phone,
                    address: `${proteusBranch.Street.trim()}, ${proteusBranch.Neighborhood.trim()}`,
                    city: proteusBranch.City.trim(),
                    state: proteusBranch.State.trim(),
                    zipCode: proteusBranch.ZipCode,
                };
            };

            const appBranches = response.data.items.map(convertProteusBranchToApp);

            console.log('🔄 Filiais convertidas:', appBranches.length);

            // Log da primeira filial convertida
            if (appBranches.length > 0) {
                console.log('🏢 Primeira filial convertida:', {
                    id: appBranches[0].id,
                    name: appBranches[0].name,
                    location: appBranches[0].location,
                });
            }

            const result: BranchesResult = {
                success: true,
                branches: appBranches,
                hasNext: response.data.hasNext,
                page,
                total: response.data.items.length,
            };

            // Salvar no cache
            (result as any).timestamp = Date.now();
            this.cache.set(cacheKey, result);

            console.log('✅ Filiais processadas com sucesso');
            return result;

        } catch (error: any) {
            console.error('❌ === ERRO AO BUSCAR FILIAIS ===');
            console.error('Erro completo:', error);

            let errorMessage = 'Erro desconhecido ao buscar filiais';

            if (error.response) {
                console.error('📡 Status:', error.response.status);
                console.error('📄 Data:', error.response.data);

                if (error.response.status === 401) {
                    errorMessage = 'Sessão expirada. Faça login novamente.';
                    // Tentar refresh token
                    try {
                        await authService.refreshToken();
                        console.log('🔄 Token refreshed, tentando novamente...');
                        return this.getBranches(params); // Retry
                    } catch (refreshError) {
                        console.error('❌ Falha no refresh token:', refreshError);
                        await authService.signOut();
                        errorMessage = 'Sessão expirada. Faça login novamente.';
                    }
                } else if (error.response.status === 403) {
                    errorMessage = 'Sem permissão para acessar filiais';
                } else if (error.response.status === 404) {
                    errorMessage = 'Endpoint de filiais não encontrado';
                } else {
                    errorMessage = error.response.data?.message || `Erro ${error.response.status}`;
                }
            } else if (error.request) {
                console.error('📡 Request:', error.request);
                errorMessage = 'Servidor não responde';
            } else if (error.message) {
                errorMessage = error.message;
            }

            return {
                success: false,
                branches: [],
                hasNext: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Busca todas as filiais (paginação automática)
     */
    async getAllBranches(): Promise<BranchesResult> {
        console.log('🏢 Buscando TODAS as filiais...');

        let allBranches: AppBranch[] = [];
        let currentPage = 1;
        let hasNext = true;

        while (hasNext) {
            console.log(`📄 Buscando página ${currentPage}...`);

            const result = await this.getBranches({
                pageSize: 50, // Usar pageSize maior para menos requisições
                page: currentPage
            });

            if (!result.success) {
                console.error(`❌ Erro na página ${currentPage}:`, result.error);
                return result;
            }

            allBranches = [...allBranches, ...result.branches];
            hasNext = result.hasNext;
            currentPage++;

            console.log(`✅ Página ${currentPage - 1}: ${result.branches.length} filiais`);
            console.log(`📊 Total até agora: ${allBranches.length} filiais`);
        }

        console.log(`🎉 Todas as filiais carregadas: ${allBranches.length} total`);

        return {
            success: true,
            branches: allBranches,
            hasNext: false,
            total: allBranches.length,
        };
    }

    /**
     * Busca filial por código
     */
    async getBranchByCode(code: string): Promise<AppBranch | null> {
        console.log('🔍 Buscando filial por código:', code);

        // Primeiro tenta buscar no cache
        for (const cached of this.cache.values()) {
            const found = cached.branches.find(b => b.code === code || b.id === code);
            if (found) {
                console.log('💾 Filial encontrada no cache');
                return found;
            }
        }

        // Se não encontrou, busca na primeira página
        const result = await this.getBranches({ pageSize: 100 });

        if (result.success) {
            const found = result.branches.find(b => b.code === code || b.id === code);
            if (found) {
                console.log('✅ Filial encontrada na busca');
                return found;
            }
        }

        console.log('❌ Filial não encontrada:', code);
        return null;
    }

    /**
     * Busca filiais com filtro de texto
     */
    async searchBranches(query: string): Promise<BranchesResult> {
        console.log('🔍 Buscando filiais com filtro:', query);

        if (!query.trim()) {
            return this.getBranches();
        }

        // Se tiver cache, fazer busca local primeiro
        const allCached = Array.from(this.cache.values())
            .flatMap(cached => cached.branches);

        if (allCached.length > 0) {
            const filtered = allCached.filter(branch =>
                branch.name.toLowerCase().includes(query.toLowerCase()) ||
                branch.code.toLowerCase().includes(query.toLowerCase()) ||
                branch.location.toLowerCase().includes(query.toLowerCase())
            );

            if (filtered.length > 0) {
                console.log(`💾 Encontradas ${filtered.length} filiais no cache local`);
                return {
                    success: true,
                    branches: filtered,
                    hasNext: false,
                    total: filtered.length,
                };
            }
        }

        // Fazer busca no servidor
        return this.getBranches({ search: query });
    }

    /**
     * Limpa cache de filiais
     */
    clearCache(): void {
        console.log('🗑️ Limpando cache de filiais');
        this.cache.clear();
    }

    /**
     * Obtém estatísticas do cache
     */
    getCacheStats() {
        const totalCached = Array.from(this.cache.values())
            .reduce((sum, cached) => sum + cached.branches.length, 0);

        return {
            cacheEntries: this.cache.size,
            totalBranches: totalCached,
            cacheTimeout: this.cacheTimeout,
        };
    }
}

export const branchesService = BranchesService.getInstance();