import type { ApiResponse, ConnectionConfig } from '../../types/api';
import type { Branch, LoginCredentials, Module, User } from '../../types/auth';

interface ProtheusApiConfig {
    baseURL: string;
    timeout: number;
    headers: Record<string, string>;
}

export class ProtheusApiService {
    private static instance: ProtheusApiService;
    private config: ProtheusApiConfig | null = null;
    private authToken: string | null = null;

    private constructor() { }

    static getInstance(): ProtheusApiService {
        if (!ProtheusApiService.instance) {
            ProtheusApiService.instance = new ProtheusApiService();
        }
        return ProtheusApiService.instance;
    }

    initialize(connectionConfig: ConnectionConfig): void {
        const baseURL = `${connectionConfig.protocol.toLowerCase()}://${connectionConfig.address}:${connectionConfig.port}/${connectionConfig.environment}`;

        this.config = {
            baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        };
    }

    private async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        if (!this.config) {
            throw new Error('API não inicializada. Chame initialize() primeiro.');
        }

        const url = `${this.config.baseURL}${endpoint}`;

        const config: RequestInit = {
            ...options,
            headers: {
                ...this.config.headers,
                ...options.headers,
                ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
            },
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

            const response = await fetch(url, {
                ...config,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            return {
                success: true,
                data,
            };
        } catch (error) {
            console.error('Erro na requisição:', error);

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    return {
                        success: false,
                        error: 'Timeout na requisição',
                    };
                }

                return {
                    success: false,
                    error: error.message,
                };
            }

            return {
                success: false,
                error: 'Erro desconhecido na requisição',
            };
        }
    }

    // Teste de conexão
    async testConnection(): Promise<ApiResponse<{ status: string }>> {
        return this.makeRequest('/api/health', {
            method: 'GET',
        });
    }

    // Autenticação
    async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
        const response = await this.makeRequest<{ user: User; token: string }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });

        if (response.success && response.data) {
            this.authToken = response.data.token;
        }

        return response;
    }

    async logout(): Promise<ApiResponse<void>> {
        const response = await this.makeRequest<void>('/api/auth/logout', {
            method: 'POST',
        });

        if (response.success) {
            this.authToken = null;
        }

        return response;
    }

    // Filiais
    async getBranches(): Promise<ApiResponse<Branch[]>> {
        return this.makeRequest<Branch[]>('/api/branches', {
            method: 'GET',
        });
    }

    async getBranchById(id: string): Promise<ApiResponse<Branch>> {
        return this.makeRequest<Branch>(`/api/branches/${id}`, {
            method: 'GET',
        });
    }

    // Módulos
    async getModules(): Promise<ApiResponse<Module[]>> {
        return this.makeRequest<Module[]>('/api/modules', {
            method: 'GET',
        });
    }

    async getModuleById(id: string): Promise<ApiResponse<Module>> {
        return this.makeRequest<Module>(`/api/modules/${id}`, {
            method: 'GET',
        });
    }

    // Dados específicos por módulo
    async getModuleData(moduleCode: string, endpoint: string, params?: Record<string, any>): Promise<ApiResponse<any>> {
        const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
        return this.makeRequest(`/api/modules/${moduleCode}${endpoint}${queryString}`, {
            method: 'GET',
        });
    }

    async postModuleData(moduleCode: string, endpoint: string, data: any): Promise<ApiResponse<any>> {
        return this.makeRequest(`/api/modules/${moduleCode}${endpoint}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Relatórios
    async generateReport(reportId: string, params?: Record<string, any>): Promise<ApiResponse<{ reportUrl: string }>> {
        return this.makeRequest<{ reportUrl: string }>('/api/reports/generate', {
            method: 'POST',
            body: JSON.stringify({ reportId, params }),
        });
    }

    // Sincronização
    async syncData(lastSyncTimestamp?: Date): Promise<ApiResponse<{ updates: any[]; timestamp: Date }>> {
        const params = lastSyncTimestamp
            ? { lastSync: lastSyncTimestamp.toISOString() }
            : {};

        return this.makeRequest<{ updates: any[]; timestamp: Date }>('/api/sync', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    // Utilitários
    setAuthToken(token: string): void {
        this.authToken = token;
    }

    clearAuthToken(): void {
        this.authToken = null;
    }

    getConfig(): ProtheusApiConfig | null {
        return this.config;
    }
}

export const protheusApi = ProtheusApiService.getInstance();