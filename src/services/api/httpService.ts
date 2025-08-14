// src/services/api/httpService.ts - REFRESH TOKEN TOTVS CORRIGIDO
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useConfigStore } from '../../store/configStore';
import { authService, AuthType } from './authService';

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    status?: number;
}

class HttpService {
    private static instance: HttpService;
    private axiosInstance: AxiosInstance;
    private isRefreshing: boolean = false;
    private failedQueue: Array<{
        resolve: (value?: any) => void;
        reject: (error?: any) => void;
    }> = [];

    private constructor() {
        this.axiosInstance = axios.create({
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        this.setupInterceptors();
        this.updateBaseURL();
    }

    static getInstance(): HttpService {
        if (!HttpService.instance) {
            HttpService.instance = new HttpService();
        }
        return HttpService.instance;
    }

    /**
     * Configura os interceptors do axios
     */
    private setupInterceptors(): void {
        // Request interceptor - adiciona auth headers
        this.axiosInstance.interceptors.request.use(
            (config) => {
                // Atualiza base URL se necessário
                if (!config.baseURL) {
                    this.updateBaseURL();
                    config.baseURL = this.axiosInstance.defaults.baseURL;
                }

                // Adiciona headers de autenticação
                const authToken = authService.getAuthToken();
                const authType = authService.getAuthType();

                if (authToken) {
                    if (authType === AuthType.OAUTH2) {
                        config.headers.Authorization = `Bearer ${authToken}`;
                    } else {
                        config.headers.Authorization = `Basic ${authToken}`;
                    }
                }

                console.log('🚀 Request:', config.method?.toUpperCase(), config.url);
                return config;
            },
            (error) => {
                console.error('❌ Request Error:', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor - trata respostas e erros com REFRESH TOKEN AUTOMÁTICO
        this.axiosInstance.interceptors.response.use(
            (response: AxiosResponse) => {
                console.log('✅ Response:', response.status, response.config.url);
                return response;
            },
            async (error) => {
                const originalRequest = error.config;

                console.error('❌ Response Error:', error.response?.status, error.config?.url);

                // *** DETECTAR TOKEN EXPIRADO CONFORME TOTVS PROTHEUS ***
                if (this.isTokenExpiredError(error) && !originalRequest._retry) {
                    console.log('🔄 === TOKEN EXPIRADO DETECTADO (TOTVS) ===');
                    console.log('📡 Status:', error.response?.status);
                    console.log('📄 Data:', error.response?.data);

                    if (this.isRefreshing) {
                        console.log('⏳ Refresh já em andamento, adicionando à fila...');
                        // Se já está refreshing, adiciona à fila
                        return new Promise((resolve, reject) => {
                            this.failedQueue.push({
                                resolve: (token) => {
                                    originalRequest.headers.Authorization = `Bearer ${token}`;
                                    resolve(this.axiosInstance(originalRequest));
                                },
                                reject
                            });
                        });
                    }

                    originalRequest._retry = true;
                    this.isRefreshing = true;

                    try {
                        // Verificar se é OAuth2 para tentar refresh token
                        if (authService.getAuthType() === AuthType.OAUTH2) {
                            console.log('🔄 Tentando refresh token TOTVS...');

                            const refreshedUser = await authService.refreshToken();
                            console.log('✅ Token TOTVS refreshed com sucesso');

                            // Processa fila de requisições que falharam
                            this.processQueue(null, refreshedUser.access_token);

                            // Atualizar header da requisição original
                            originalRequest.headers.Authorization = `Bearer ${refreshedUser.access_token}`;

                            // Retry da requisição original
                            return this.axiosInstance(originalRequest);
                        } else {
                            // Para outros tipos de auth, força logout
                            console.log('❌ Não é OAuth2, forçando logout');
                            await authService.signOut();
                            this.processQueue(new Error('Session expired'), null);
                            return Promise.reject(error);
                        }
                    } catch (refreshError: any) {
                        console.error('❌ === FALHA NO REFRESH TOKEN TOTVS ===');
                        console.error('Erro:', refreshError);

                        this.processQueue(refreshError, null);

                        // Forçar logout se refresh falhou
                        await authService.signOut();

                        // Retornar erro mais específico
                        const newError = new Error('❌ Sessão expirada. Faça login novamente.');
                        return Promise.reject(newError);
                    } finally {
                        this.isRefreshing = false;
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    /**
     * *** DETECTAR TOKEN EXPIRADO CONFORME TOTVS PROTHEUS ***
     * Verifica status 401 e mensagens específicas como "token expired"
     */
    private isTokenExpiredError(error: any): boolean {
        if (!error || !error.response) {
            return false;
        }

        const status = error.response.status;
        const data = error.response.data;

        console.log('🔍 Verificando se é token expirado TOTVS:');
        console.log('📡 Status:', status);
        console.log('📄 Data:', data);

        // Status 401 geralmente indica token expirado no TOTVS
        if (status === 401) {
            console.log('✅ Status 401 detectado - Token expirado TOTVS');
            return true;
        }

        // Verificar mensagens específicas do TOTVS Protheus
        if (data) {
            const errorMessage = (data.error || data.message || data.errorMessage || '').toLowerCase();
            console.log('🔍 Mensagem de erro:', errorMessage);

            if (errorMessage.includes('token expired') ||
                errorMessage.includes('expired') ||
                errorMessage.includes('invalid token') ||
                errorMessage.includes('unauthorized') ||
                errorMessage.includes('token inválido') ||
                errorMessage.includes('sessão expirada') ||
                errorMessage.includes('session expired')) {
                console.log('✅ Mensagem de token expirado detectada TOTVS');
                return true;
            }
        }

        console.log('❌ Não é erro de token expirado');
        return false;
    }

    /**
     * Processa fila de requisições após refresh token
     */
    private processQueue(error: any, token: string | null = null): void {
        console.log(`🔄 Processando fila de requisições: ${this.failedQueue.length} pendentes`);

        this.failedQueue.forEach(({ resolve, reject }) => {
            if (error) {
                reject(error);
            } else {
                resolve(token);
            }
        });

        this.failedQueue = [];
        console.log('✅ Fila de requisições processada');
    }

    /**
     * Atualiza URL base baseada na configuração
     */
    updateBaseURL(): void {
        const { connection } = useConfigStore.getState();
        if (connection.baseUrl) {
            this.axiosInstance.defaults.baseURL = connection.baseUrl;
            console.log('🔗 Base URL atualizada:', connection.baseUrl);
        }
    }

    /**
     * Converte resposta do axios para formato padronizado
     */
    private formatResponse<T>(response: AxiosResponse<T>): ApiResponse<T> {
        return {
            success: true,
            data: response.data,
            status: response.status,
        };
    }

    /**
     * Converte erro do axios para formato padronizado
     */
    private formatError(error: any): ApiResponse {
        if (error.code === 'ECONNABORTED') {
            return {
                success: false,
                error: 'Timeout na requisição',
                status: 408,
            };
        }

        if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
            return {
                success: false,
                error: 'Não foi possível conectar ao servidor',
                status: 0,
            };
        }

        if (error.response) {
            // Verificar se é erro de token expirado para dar mensagem mais clara
            if (this.isTokenExpiredError(error)) {
                return {
                    success: false,
                    error: 'Sessão expirada. Fazendo login automaticamente...',
                    status: error.response.status,
                    data: error.response.data,
                };
            }

            return {
                success: false,
                error: error.response.data?.message ||
                    error.response.data?.error ||
                    error.response.statusText ||
                    'Erro na requisição',
                status: error.response.status,
                data: error.response.data,
            };
        }

        return {
            success: false,
            error: error.message || 'Erro desconhecido na requisição',
            status: 0,
        };
    }

    /**
     * Requisição GET
     */
    async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.axiosInstance.get<T>(url, config);
            return this.formatResponse(response);
        } catch (error) {
            return this.formatError(error);
        }
    }

    /**
     * Requisição POST
     */
    async post<T = any>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> {
        try {
            const response = await this.axiosInstance.post<T>(url, data, config);
            return this.formatResponse(response);
        } catch (error) {
            return this.formatError(error);
        }
    }

    /**
     * Requisição PUT
     */
    async put<T = any>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> {
        try {
            const response = await this.axiosInstance.put<T>(url, data, config);
            return this.formatResponse(response);
        } catch (error) {
            return this.formatError(error);
        }
    }

    /**
     * Requisição DELETE
     */
    async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.axiosInstance.delete<T>(url, config);
            return this.formatResponse(response);
        } catch (error) {
            return this.formatError(error);
        }
    }

    /**
     * Requisição PATCH
     */
    async patch<T = any>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> {
        try {
            const response = await this.axiosInstance.patch<T>(url, data, config);
            return this.formatResponse(response);
        } catch (error) {
            return this.formatError(error);
        }
    }

    /**
     * Requisição customizada
     */
    async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.axiosInstance.request<T>(config);
            return this.formatResponse(response);
        } catch (error) {
            return this.formatError(error);
        }
    }

    /**
     * Define timeout padrão
     */
    setDefaultTimeout(timeout: number): void {
        this.axiosInstance.defaults.timeout = timeout;
    }

    /**
     * Obtém timeout padrão
     */
    getDefaultTimeout(): number {
        return this.axiosInstance.defaults.timeout || 30000;
    }

    /**
     * Define URL base
     */
    setBaseURL(baseURL: string): void {
        this.axiosInstance.defaults.baseURL = baseURL;
    }

    /**
     * Obtém URL base
     */
    getBaseURL(): string {
        return this.axiosInstance.defaults.baseURL || '';
    }

    /**
     * Obtém instância do axios (para casos especiais)
     */
    getAxiosInstance(): AxiosInstance {
        return this.axiosInstance;
    }

    /**
     * Cancela todas as requisições pendentes
     */
    cancelAllRequests(): void {
        console.log('🚫 Cancelando todas as requisições...');
        // Limpar fila de refresh
        this.failedQueue = [];
        this.isRefreshing = false;
    }

    /**
     * Define headers padrão
     */
    setDefaultHeaders(headers: Record<string, string>): void {
        Object.assign(this.axiosInstance.defaults.headers.common, headers);
    }

    /**
     * Remove header padrão
     */
    removeDefaultHeader(key: string): void {
        delete this.axiosInstance.defaults.headers.common[key];
    }

    /**
     * Obter estatísticas do serviço
     */
    getStats() {
        return {
            baseURL: this.getBaseURL(),
            timeout: this.getDefaultTimeout(),
            isRefreshing: this.isRefreshing,
            queueSize: this.failedQueue.length,
            hasAuthToken: !!authService.getAuthToken(),
            authType: authService.getAuthType(),
        };
    }
}

export const httpService = HttpService.getInstance();

// Mantém compatibilidade com o nome anterior
export const httpInterceptor = httpService;