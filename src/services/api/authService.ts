// src/services/api/authService.ts
import axios from 'axios';
import { useConfigStore } from '../../store/configStore';
import { asyncStorageService } from '../storage/asyncStorage';

export enum AuthType {
    OAUTH2 = 'OAUTH2'
}

export interface LoginCredentials {
    username: string;
    password: string;
    keepConnected?: boolean;
}

export interface AuthUser {
    username: string;
    keepConnected: boolean;
    lastLogin: string;
    authType: AuthType;
    access_token: string;
    refresh_token?: string;
    token_type: string;
    expires_in: number;
    tokenExpiresAt: string;
    password?: string;
}

export interface OAuth2Response {
    access_token: string;
    refresh_token?: string;
    token_type: string;
    expires_in: number;
    scope?: string;
}

export class AuthService {
    private static instance: AuthService;
    private currentUser: AuthUser | null = null;

    private constructor() { }

    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    async signIn(credentials: LoginCredentials): Promise<AuthUser> {
        const { connection } = useConfigStore.getState();

        if (!connection.baseUrl) {
            throw new Error('Configuração REST não encontrada');
        }

        const oauthUrl = `${connection.baseUrl}/api/oauth2/v1/token?grant_type=password`;

        try {
            const response = await axios.post(oauthUrl, {}, {
                headers: {
                    'Content-Type': 'application/json',
                    'username': credentials.username,
                    'password': credentials.password,
                },
                timeout: 15000,
                validateStatus: (status) => status < 500,
            });

            if (response.status === 200 || response.status === 201) {
                if (response.data?.access_token) {
                    const tokenExpiresAt = new Date(Date.now() + (response.data.expires_in * 1000)).toISOString();

                    const authUser: AuthUser = {
                        username: credentials.username,
                        keepConnected: credentials.keepConnected || false,
                        lastLogin: new Date().toISOString(),
                        authType: AuthType.OAUTH2,
                        access_token: response.data.access_token,
                        refresh_token: response.data.refresh_token,
                        token_type: response.data.token_type,
                        expires_in: response.data.expires_in,
                        tokenExpiresAt,
                        password: credentials.keepConnected ? credentials.password : undefined,
                    };

                    await this.saveAuthenticatedUser(authUser);
                    return authUser;
                } else {
                    throw new Error(`Servidor retornou status ${response.status} mas sem token de acesso`);
                }
            } else if (response.status === 401) {
                throw new Error('Usuário ou senha incorretos');
            } else if (response.status === 400) {
                throw new Error('Dados de login inválidos');
            } else {
                if (response.data?.access_token) {
                    const tokenExpiresAt = new Date(Date.now() + (response.data.expires_in * 1000)).toISOString();

                    const authUser: AuthUser = {
                        username: credentials.username,
                        keepConnected: credentials.keepConnected || false,
                        lastLogin: new Date().toISOString(),
                        authType: AuthType.OAUTH2,
                        access_token: response.data.access_token,
                        refresh_token: response.data.refresh_token,
                        token_type: response.data.token_type,
                        expires_in: response.data.expires_in,
                        tokenExpiresAt,
                        password: credentials.keepConnected ? credentials.password : undefined,
                    };

                    await this.saveAuthenticatedUser(authUser);
                    return authUser;
                } else {
                    throw new Error(`Status ${response.status} e sem token`);
                }
            }
        } catch (error: any) {
            if (error.code === 'ECONNABORTED') {
                throw new Error('Timeout na conexão (servidor demorou mais de 15 segundos)');
            } else if (error.code === 'ECONNREFUSED') {
                throw new Error('Conexão recusada - servidor pode estar desligado');
            } else if (error.code === 'ENOTFOUND') {
                throw new Error('Servidor não encontrado - verifique o endereço');
            } else if (error.response) {
                const status = error.response.status;
                const data = error.response.data;

                if (status === 401) {
                    throw new Error('Usuário ou senha incorretos');
                } else if (status === 400) {
                    throw new Error('Dados de login inválidos');
                } else {
                    const errorMsg = data?.error || data?.message || `Erro ${status}`;
                    throw new Error(`${errorMsg}`);
                }
            } else if (error.request) {
                throw new Error('Erro de conexão - servidor não responde');
            } else {
                throw new Error(`Erro inesperado: ${error.message}`);
            }
        }
    }

    async isRefreshTokenExpired(): Promise<boolean> {
        const user = await this.getCurrentUser();
        if (!user || !user.tokenExpiresAt) {
            return true;
        }

        const expiresAt = new Date(user.tokenExpiresAt);
        const now = new Date();
        const hoursExpired = (now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60);

        if (hoursExpired > 24) {
            return true;
        }

        return false;
    }

    async refreshToken(): Promise<AuthUser> {
        const currentUser = await this.getCurrentUser();

        if (!currentUser || !currentUser.refresh_token) {
            throw new Error('Nenhum refresh token disponível');
        }

        const isRefreshExpired = await this.isRefreshTokenExpired();
        if (isRefreshExpired) {
            await this.clearExpiredUser(currentUser.username);
            throw new Error('Sessão expirada há muito tempo. Faça login novamente.');
        }

        const { connection } = useConfigStore.getState();

        if (!connection.baseUrl) {
            throw new Error('Configuração REST não encontrada');
        }

        const baseUrl = `${connection.baseUrl}/api/oauth2/v1/token`;

        try {
            const response = await axios.post(baseUrl, {}, {
                params: {
                    grant_type: 'refresh_token',
                    refresh_token: currentUser.refresh_token
                },
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 15000,
                validateStatus: (status) => status < 500,
            });

            if ((response.status === 200 || response.status === 201) && response.data?.access_token) {
                const refreshResponse = response.data;

                const updatedUser: AuthUser = {
                    ...currentUser,
                    access_token: refreshResponse.access_token,
                    refresh_token: refreshResponse.refresh_token || currentUser.refresh_token,
                    token_type: refreshResponse.token_type || 'Bearer',
                    expires_in: refreshResponse.expires_in,
                    tokenExpiresAt: new Date(Date.now() + (refreshResponse.expires_in * 1000)).toISOString(),
                    lastLogin: new Date().toISOString(),
                };

                this.currentUser = updatedUser;
                await asyncStorageService.setItem('current_user', updatedUser);

                if (updatedUser.keepConnected) {
                    let savedUsers = await this.getSavedUsers();
                    savedUsers = savedUsers.filter(u =>
                        u.username.toLowerCase() !== updatedUser.username.toLowerCase()
                    );
                    savedUsers.push(updatedUser);
                    await asyncStorageService.setItem('saved_users', savedUsers);
                }

                return updatedUser;
            } else if (response.status === 400 || response.status === 401) {
                const errorData = response.data;
                const isInvalidGrant = errorData?.message?.includes('invalid_grant') ||
                    errorData?.code === 401;

                if (isInvalidGrant) {
                    await this.clearExpiredUser(currentUser.username);
                    throw new Error('Sessão expirada. Faça login novamente.');
                } else {
                    const errorMsg = errorData?.message || errorData?.error || 'Erro no refresh token';
                    throw new Error(`${errorMsg}`);
                }
            } else {
                throw new Error(`Erro no refresh token: Status ${response.status}`);
            }
        } catch (error: any) {
            if (error.response) {
                if (error.response.status === 400 || error.response.status === 401) {
                    const errorData = error.response.data;
                    const isInvalidGrant = errorData?.message?.includes('invalid_grant') ||
                        errorData?.message?.includes('Falha de autenticação') ||
                        errorData?.code === 401;

                    if (isInvalidGrant) {
                        await this.clearExpiredUser(currentUser.username);
                        throw new Error('Sessão expirada. Faça login novamente.');
                    } else {
                        const errorMsg = errorData?.message || errorData?.error || 'Erro de autenticação';
                        throw new Error(`${errorMsg}`);
                    }
                } else {
                    const errorMsg = error.response.data?.message ||
                        error.response.data?.error ||
                        `Erro no servidor: ${error.response.status}`;
                    throw new Error(`${errorMsg}`);
                }
            } else if (error.request) {
                throw new Error('Erro de conexão - servidor não responde');
            } else {
                throw new Error(`Erro inesperado: ${error.message}`);
            }
        }
    }

    private async clearExpiredUser(username: string): Promise<void> {
        try {
            const currentUser = await this.getCurrentUser();
            if (currentUser?.username.toLowerCase() === username.toLowerCase()) {
                this.currentUser = null;
                await asyncStorageService.removeItem('current_user');
            }

            let savedUsers = await this.getSavedUsers();
            const beforeCount = savedUsers.length;
            savedUsers = savedUsers.filter(u =>
                u.username.toLowerCase() !== username.toLowerCase()
            );

            if (savedUsers.length < beforeCount) {
                await asyncStorageService.setItem('saved_users', savedUsers);
            }
        } catch (error) {
            // Falha silenciosa
        }
    }

    async isTokenExpiringSoon(): Promise<boolean> {
        const user = await this.getCurrentUser();
        if (!user || !user.tokenExpiresAt) {
            return true;
        }

        const expiresAt = new Date(user.tokenExpiresAt);
        const now = new Date();
        const fiveMinutesFromNow = new Date(now.getTime() + (5 * 60 * 1000));

        return expiresAt <= fiveMinutesFromNow;
    }

    async ensureValidToken(): Promise<AuthUser | null> {
        const user = await this.getCurrentUser();
        if (!user) {
            return null;
        }

        const isExpiring = await this.isTokenExpiringSoon();
        if (isExpiring && user.refresh_token) {
            try {
                return await this.refreshToken();
            } catch (error) {
                await this.signOut();
                return null;
            }
        }

        return user;
    }

    async checkAutoLogin(): Promise<any> {
        try {
            const savedUsers = await this.getSavedUsers();

            if (savedUsers.length === 0) {
                return null;
            }

            for (const user of savedUsers) {
                if (!user.keepConnected || !user.access_token) {
                    continue;
                }

                if (user.tokenExpiresAt) {
                    const expiresAt = new Date(user.tokenExpiresAt);
                    const now = new Date();
                    const minutesExpired = (now.getTime() - expiresAt.getTime()) / (1000 * 60);
                    const hoursExpired = minutesExpired / 60;
                    const daysExpired = hoursExpired / 24;

                    if (daysExpired > 7) {
                        await this.clearExpiredUser(user.username);
                        continue;
                    }

                    if (minutesExpired > 0 && hoursExpired < 24 && user.refresh_token) {
                        try {
                            this.currentUser = user;
                            const refreshedUser = await this.refreshToken();
                            return refreshedUser;
                        } catch (refreshError: any) {
                            if (refreshError.message?.includes('Sessão expirada') ||
                                refreshError.message?.includes('invalid_grant')) {
                                await this.clearExpiredUser(user.username);
                            }
                            continue;
                        }
                    }

                    if (hoursExpired > 24) {
                        if (user.password) {
                            return {
                                username: user.username,
                                password: user.password,
                                keepConnected: true,
                                needsManualLogin: true,
                            };
                        } else {
                            await this.clearExpiredUser(user.username);
                            continue;
                        }
                    }
                }

                if (user.tokenExpiresAt) {
                    const expiresAt = new Date(user.tokenExpiresAt);
                    const now = new Date();
                    if (expiresAt > now) {
                        this.currentUser = user;
                        return user;
                    }
                }

                if (user.password) {
                    return {
                        username: user.username,
                        password: user.password,
                        keepConnected: true,
                    };
                }
            }

            return null;
        } catch (error: any) {
            return null;
        }
    }

    async checkSecurity(): Promise<boolean> {
        const { connection } = useConfigStore.getState();

        if (!connection.baseUrl) {
            return false;
        }

        const oauthUrl = `${connection.baseUrl}/api/oauth2/v1/token?grant_type=password`;

        try {
            const testCredentials = {
                username: 'usuario_inexistente_teste_12345',
                password: 'senha_impossivel_teste_67890'
            };

            const response = await axios.post(oauthUrl, {}, {
                headers: {
                    'Content-Type': 'application/json',
                    'username': testCredentials.username,
                    'password': testCredentials.password,
                },
                timeout: 10000,
                validateStatus: (status) => status < 500,
            });

            if (response.status === 401 || response.status === 400) {
                return true;
            } else if (response.status === 200 || response.status === 201) {
                if (response.data?.access_token) {
                    return false;
                } else {
                    return true;
                }
            } else {
                return false;
            }
        } catch (error: any) {
            if (error.response?.status === 401) {
                return true;
            }
            return false;
        }
    }

    async testCredentialsOnly(credentials: LoginCredentials): Promise<{
        success: boolean;
        data?: OAuth2Response;
        error?: string;
        debugInfo?: any;
    }> {
        const { connection } = useConfigStore.getState();

        if (!connection.baseUrl) {
            return {
                success: false,
                error: 'URL não configurada',
                debugInfo: { step: 'validation', issue: 'no_base_url' }
            };
        }

        const oauthUrl = `${connection.baseUrl}/api/oauth2/v1/token?grant_type=password`;

        try {
            const startTime = Date.now();

            const response = await axios.post(oauthUrl, {}, {
                headers: {
                    'Content-Type': 'application/json',
                    'username': credentials.username,
                    'password': credentials.password,
                },
                timeout: 10000,
                validateStatus: (status) => status < 500,
            });

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            const debugInfo = {
                status: response.status,
                responseTime,
                hasToken: !!response.data?.access_token,
                tokenType: response.data?.token_type,
                expiresIn: response.data?.expires_in,
                hasRefreshToken: !!response.data?.refresh_token,
                dataKeys: Object.keys(response.data || {}),
                timestamp: new Date().toISOString(),
            };

            if ((response.status === 200 || response.status === 201) && response.data?.access_token) {
                return {
                    success: true,
                    data: response.data,
                    debugInfo
                };
            } else {
                return {
                    success: false,
                    error: response.data?.error || `Status ${response.status}`,
                    debugInfo
                };
            }
        } catch (error: any) {
            let errorMessage = 'Erro na requisição';
            let debugInfo: any = {
                errorType: error.constructor.name,
                errorCode: error.code,
                timestamp: new Date().toISOString(),
            };

            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Timeout na requisição (10s)';
                debugInfo.issue = 'timeout';
            } else if (error.response) {
                errorMessage = error.response.data?.error || `Status ${error.response.status}`;
                debugInfo = {
                    ...debugInfo,
                    responseStatus: error.response.status,
                    responseData: error.response.data,
                    issue: 'server_error',
                };
            } else if (error.request) {
                errorMessage = 'Servidor não responde';
                debugInfo.issue = 'no_response';
            } else {
                errorMessage = error.message || 'Erro desconhecido';
                debugInfo.issue = 'unknown';
            }

            return {
                success: false,
                error: errorMessage,
                debugInfo
            };
        }
    }

    static isTokenExpiredError(error: any): boolean {
        if (!error || !error.response) {
            return false;
        }

        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
            return true;
        }

        if (data) {
            const errorMessage = (data.error || data.message || '').toLowerCase();

            if (errorMessage.includes('token expired') ||
                errorMessage.includes('expired') ||
                errorMessage.includes('invalid token') ||
                errorMessage.includes('unauthorized')) {
                return true;
            }
        }

        return false;
    }

    private async saveAuthenticatedUser(authUser: AuthUser): Promise<void> {
        this.currentUser = authUser;
        await asyncStorageService.setItem('current_user', authUser);

        if (authUser.keepConnected) {
            let savedUsers = await this.getSavedUsers();
            savedUsers = savedUsers.filter(u =>
                u.username.toLowerCase() !== authUser.username.toLowerCase()
            );
            savedUsers.push(authUser);
            await asyncStorageService.setItem('saved_users', savedUsers);
        }
    }

    async signOut(): Promise<void> {
        try {
            const currentUser = await this.getCurrentUser();
            if (currentUser?.access_token) {
                const { connection } = useConfigStore.getState();
                const revokeUrl = `${connection.baseUrl}/tlpp/oauth2/revoke`;

                await axios.post(revokeUrl, {}, {
                    headers: {
                        'Authorization': `Bearer ${currentUser.access_token}`,
                    },
                    timeout: 5000,
                    validateStatus: () => true,
                });
            }
        } catch (error) {
            // Falha silenciosa
        }

        this.currentUser = null;
        await asyncStorageService.removeItem('current_user');
    }

    async getCurrentUser(): Promise<AuthUser | null> {
        if (this.currentUser) {
            return this.currentUser;
        }

        const storedUser = await asyncStorageService.getItem<AuthUser>('current_user');
        if (storedUser) {
            this.currentUser = storedUser;
        }

        return this.currentUser;
    }

    async isTokenValid(): Promise<boolean> {
        const currentUser = await this.getCurrentUser();

        if (!currentUser || !currentUser.access_token || !currentUser.tokenExpiresAt) {
            return false;
        }

        const expiresAt = new Date(currentUser.tokenExpiresAt);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();

        if (timeUntilExpiry < 5 * 60 * 1000) {
            return false;
        }

        return true;
    }

    getAuthToken(): string | null {
        if (!this.currentUser?.access_token) {
            return null;
        }
        return this.currentUser.access_token;
    }

    getAuthType(): AuthType {
        return AuthType.OAUTH2;
    }

    private async getSavedUsers(): Promise<AuthUser[]> {
        const users = await asyncStorageService.getItem<AuthUser[]>('saved_users');
        return Array.isArray(users) ? users : [];
    }

    async clearStorage(): Promise<void> {
        await asyncStorageService.removeItem('current_user');
        await asyncStorageService.removeItem('saved_users');
        this.currentUser = null;
    }

    async listStoredUsers(): Promise<AuthUser[]> {
        const users = await this.getSavedUsers();
        return users;
    }

    getSystemInfo() {
        return {
            currentUser: this.currentUser?.username || null,
            authType: AuthType.OAUTH2,
            hasToken: !!this.currentUser?.access_token,
            tokenValid: this.currentUser ? this.isTokenValid() : false,
            tokenExpiresAt: this.currentUser?.tokenExpiresAt || null,
            hasRefreshToken: !!this.currentUser?.refresh_token,
        };
    }
}

export const authService = AuthService.getInstance();