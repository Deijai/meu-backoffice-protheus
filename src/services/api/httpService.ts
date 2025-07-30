// src/services/api/httpService.ts
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

        // Response interceptor - trata respostas e erros
        this.axiosInstance.interceptors.response.use(
            (response: AxiosResponse) => {
                console.log('✅ Response:', response.status, response.config.url);
                return response;
            },
            async (error) => {
                const originalRequest = error.config;

                console.error('❌ Response Error:', error.response?.status, error.config?.url);

                // Handle 401 - Token expirado
                if (error.response?.status === 401 && !originalRequest._retry) {
                    if (this.isRefreshing) {
                        // Se já está refreshing, adiciona à fila
                        return new Promise((resolve, reject) => {
                            this.failedQueue.push({ resolve, reject });
                        }).then(() => {
                            return this.axiosInstance(originalRequest);
                        }).catch(err => {
                            return Promise.reject(err);
                        });
                    }

                    originalRequest._retry = true;
                    this.isRefreshing = true;

                    try {
                        // Tenta refresh token se for OAUTH2
                        if (authService.getAuthType() === AuthType.OAUTH2) {
                            await authService.refreshToken();

                            // Processa fila de requisições que falharam
                            this.processQueue(null);

                            // Retry da requisição original
                            return this.axiosInstance(originalRequest);
                        } else {
                            // Para BASIC, força logout
                            await authService.signOut();
                            this.processQueue(new Error('Session expired'), null);
                            return Promise.reject(error);
                        }
                    } catch (refreshError) {
                        this.processQueue(refreshError, null);
                        await authService.signOut();
                        return Promise.reject(refreshError);
                    } finally {
                        this.isRefreshing = false;
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    /**
     * Processa fila de requisições após refresh token
     */
    private processQueue(error: any, token: string | null = null): void {
        this.failedQueue.forEach(({ resolve, reject }) => {
            if (error) {
                reject(error);
            } else {
                resolve(token);
            }
        });

        this.failedQueue = [];
    }

    /**
     * Atualiza URL base baseada na configuração
     */
    updateBaseURL(): void {
        const { connection } = useConfigStore.getState();
        if (connection.baseUrl) {
            this.axiosInstance.defaults.baseURL = connection.baseUrl;
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
            return {
                success: false,
                error: error.response.data?.message || error.response.statusText || 'Erro na requisição',
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
        // Axios não tem método nativo para isso, mas podemos implementar se necessário
        console.log('Cancelando todas as requisições...');
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
}

export const httpService = HttpService.getInstance();

// Mantém compatibilidade com o nome anterior
export const httpInterceptor = httpService;