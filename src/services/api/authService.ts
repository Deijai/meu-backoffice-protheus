// src/services/api/authService.ts - VERSÃO OAUTH2 PROTHEUS COM AXIOS
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

    /**
     * LOGIN PRINCIPAL usando OAuth2 do Protheus com axios
     */
    async signIn(credentials: LoginCredentials): Promise<AuthUser> {
        const { connection } = useConfigStore.getState();

        if (!connection.baseUrl) {
            throw new Error('❌ Configuração REST não encontrada');
        }

        console.log('🔄 === LOGIN OAUTH2 PROTHEUS INICIADO ===');
        console.log('👤 Usuário:', credentials.username);
        console.log('🌐 URL Base:', connection.baseUrl);

        const oauthUrl = `${connection.baseUrl}/api/oauth2/v1/token?grant_type=password`;
        console.log('🔐 URL OAuth:', oauthUrl);

        try {
            const response = await axios.post(oauthUrl, {}, {
                headers: {
                    'Content-Type': 'application/json',
                    'username': credentials.username,
                    'password': credentials.password,
                },
                timeout: 15000,
                validateStatus: (status) => status < 500, // Aceitar qualquer status < 500
            });

            console.log('📡 Status da resposta:', response.status);

            if (response.status !== 200) {
                if (response.status === 401) {
                    console.log('❌ Credenciais rejeitadas pelo servidor');
                    throw new Error('❌ Usuário ou senha incorretos');
                } else if (response.status === 400) {
                    console.log('❌ Requisição inválida');
                    throw new Error('❌ Dados de login inválidos');
                } else {
                    console.log('❌ Erro no servidor:', response.status);
                    throw new Error(`❌ Erro no servidor: ${response.status}`);
                }
            }

            const oauthData: OAuth2Response = response.data;
            console.log('✅ Token OAuth2 recebido');
            console.log('🔑 Token Type:', oauthData.token_type);
            console.log('⏰ Expires In:', oauthData.expires_in, 'segundos');

            if (!oauthData.access_token) {
                throw new Error('❌ Token de acesso não retornado pelo servidor');
            }

            // Calcular quando o token irá expirar
            const tokenExpiresAt = new Date(Date.now() + (oauthData.expires_in * 1000)).toISOString();

            // Criar usuário autenticado
            const authUser: AuthUser = {
                username: credentials.username,
                keepConnected: credentials.keepConnected || false,
                lastLogin: new Date().toISOString(),
                authType: AuthType.OAUTH2,
                access_token: oauthData.access_token,
                refresh_token: oauthData.refresh_token,
                token_type: oauthData.token_type,
                expires_in: oauthData.expires_in,
                tokenExpiresAt,
            };

            // Salvar usuário
            await this.saveAuthenticatedUser(authUser);

            console.log('✅ Login OAuth2 concluído com sucesso');
            return authUser;

        } catch (error: any) {
            console.error('❌ Erro no login OAuth2:', error);

            // Tratar diferentes tipos de erro axios
            if (error.code === 'ECONNABORTED') {
                throw new Error('❌ Timeout na conexão com o servidor');
            } else if (error.code === 'ECONNREFUSED') {
                throw new Error('❌ Conexão recusada - verifique se o servidor está ligado');
            } else if (error.code === 'ENOTFOUND') {
                throw new Error('❌ Servidor não encontrado - verifique o endereço');
            } else if (error.response) {
                // Servidor respondeu com erro
                const status = error.response.status;
                const data = error.response.data;

                if (status === 401) {
                    throw new Error('❌ Usuário ou senha incorretos');
                } else if (status === 400) {
                    throw new Error('❌ Dados de login inválidos');
                } else {
                    const errorMsg = data?.error || data?.message || `Erro ${status}`;
                    throw new Error(`❌ ${errorMsg}`);
                }
            } else if (error.request) {
                throw new Error('❌ Erro de conexão com o servidor');
            } else {
                throw new Error(`❌ Erro na autenticação: ${error.message}`);
            }
        }
    }

    /**
     * Verificar se servidor OAuth2 está funcionando com axios
     */
    async checkSecurity(): Promise<boolean> {
        const { connection } = useConfigStore.getState();

        if (!connection.baseUrl) {
            return false;
        }

        console.log('🔒 Verificando servidor OAuth2...');
        const oauthUrl = `${connection.baseUrl}/api/oauth2/v1/token?grant_type=password`;

        try {
            // Tentar com credenciais de teste usando axios
            const response = await axios.post(oauthUrl, {}, {
                headers: {
                    'Content-Type': 'application/json',
                    'username': 'test_user_invalid',
                    'password': 'test_password_invalid',
                },
                timeout: 10000,
                validateStatus: (status) => status < 500, // Aceitar qualquer status < 500
            });

            console.log('📡 Status teste segurança:', response.status);

            // Se retornar 401 = servidor funcionando e validando credenciais
            if (response.status === 401) {
                console.log('✅ Servidor OAuth2 seguro (rejeitou credenciais inválidas)');
                return true;
            }

            // Se retornar 400 = servidor funcionando (bad request)
            if (response.status === 400) {
                console.log('✅ Servidor OAuth2 funcionando (bad request)');
                return true;
            }

            // Se retornar 200 com token = problema (não deveria aceitar credenciais falsas)
            if (response.status === 200) {
                if (response.data?.access_token) {
                    console.log('⚠️ ATENÇÃO: Servidor aceitou credenciais falsas!');
                    return false;
                } else {
                    console.log('✅ Servidor funcionando');
                    return true;
                }
            }

            console.log('⚠️ Status inesperado:', response.status);
            return false;

        } catch (error: any) {
            console.error('❌ Erro ao verificar segurança:', error);

            if (error.code === 'ECONNABORTED') {
                console.log('❌ Timeout na verificação');
                return false;
            } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                console.log('❌ Servidor não acessível');
                return false;
            } else if (error.response) {
                // Se retornou erro 401, significa que está seguro
                if (error.response.status === 401) {
                    console.log('✅ Servidor OAuth2 seguro (401 em teste)');
                    return true;
                }
            }

            return false;
        }
    }

    /**
     * Refresh do token OAuth2 com axios
     */
    async refreshToken(): Promise<AuthUser> {
        const currentUser = await this.getCurrentUser();

        if (!currentUser || !currentUser.refresh_token) {
            throw new Error('❌ Nenhum refresh token disponível');
        }

        const { connection } = useConfigStore.getState();
        const refreshUrl = `${connection.baseUrl}/api/oauth2/v1/token?grant_type=refresh_token`;

        console.log('🔄 Renovando token OAuth2...');

        try {
            const response = await axios.post(refreshUrl, {
                refresh_token: currentUser.refresh_token,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.access_token}`,
                },
                timeout: 10000,
                validateStatus: (status) => status < 500,
            });

            if (response.status !== 200 || !response.data.access_token) {
                throw new Error(`Erro ${response.status} no refresh token`);
            }

            const oauthData: OAuth2Response = response.data;

            // Atualizar dados do usuário
            const updatedUser: AuthUser = {
                ...currentUser,
                access_token: oauthData.access_token,
                refresh_token: oauthData.refresh_token || currentUser.refresh_token,
                expires_in: oauthData.expires_in,
                tokenExpiresAt: new Date(Date.now() + (oauthData.expires_in * 1000)).toISOString(),
                lastLogin: new Date().toISOString(),
            };

            await this.saveAuthenticatedUser(updatedUser);

            console.log('✅ Token renovado com sucesso');
            return updatedUser;

        } catch (error: any) {
            console.error('❌ Erro no refresh token:', error);

            // Se refresh falhar, forçar novo login
            await this.signOut();
            throw new Error('❌ Sessão expirada, faça login novamente');
        }
    }

    /**
     * Verificar se token está válido
     */
    async isTokenValid(): Promise<boolean> {
        const currentUser = await this.getCurrentUser();

        if (!currentUser || !currentUser.access_token || !currentUser.tokenExpiresAt) {
            return false;
        }

        const expiresAt = new Date(currentUser.tokenExpiresAt);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();

        // Se faltam menos de 5 minutos, considerar inválido
        if (timeUntilExpiry < 5 * 60 * 1000) {
            console.log('⚠️ Token expirando em breve');
            return false;
        }

        return true;
    }

    /**
     * Salvar usuário autenticado
     */
    private async saveAuthenticatedUser(authUser: AuthUser): Promise<void> {
        this.currentUser = authUser;

        // Salvar usuário atual
        await asyncStorageService.setItem('current_user', authUser);

        // Se keepConnected, salvar para auto login
        if (authUser.keepConnected) {
            let savedUsers = await this.getSavedUsers();

            // Remover usuário existente
            savedUsers = savedUsers.filter(u =>
                u.username.toLowerCase() !== authUser.username.toLowerCase()
            );

            // Adicionar usuário atualizado
            savedUsers.push(authUser);

            await asyncStorageService.setItem('saved_users', savedUsers);
            console.log('💾 Usuário salvo para auto login');
        }

        console.log('✅ Usuário salvo no storage');
    }

    /**
     * Logout com axios
     */
    async signOut(): Promise<void> {
        console.log('🚪 Fazendo logout...');

        // Tentar revogar token no servidor (opcional)
        try {
            const currentUser = await this.getCurrentUser();
            if (currentUser?.access_token) {
                const { connection } = useConfigStore.getState();
                const revokeUrl = `${connection.baseUrl}/api/oauth2/v1/revoke`;

                await axios.post(revokeUrl, {}, {
                    headers: {
                        'Authorization': `Bearer ${currentUser.access_token}`,
                    },
                    timeout: 5000,
                    validateStatus: () => true, // Aceitar qualquer status
                });

                console.log('🔓 Token revogado no servidor');
            }
        } catch (error) {
            console.log('⚠️ Erro ao revogar token (continuando logout):', error);
        }

        // Limpar estado local
        this.currentUser = null;
        await asyncStorageService.removeItem('current_user');

        console.log('✅ Logout realizado');
    }

    /**
     * Obter usuário atual
     */
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

    /**
     * Verificar auto login
     */
    async checkAutoLogin(): Promise<AuthUser | null> {
        console.log('🔍 Verificando auto login...');

        const savedUsers = await this.getSavedUsers();

        if (savedUsers.length === 0) {
            console.log('ℹ️ Nenhum usuário salvo');
            return null;
        }

        // Ordenar por último login
        const sortedUsers = savedUsers.sort((a, b) =>
            new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime()
        );

        for (const user of sortedUsers) {
            if (user.keepConnected && user.access_token) {
                // Verificar se token ainda é válido
                const expiresAt = new Date(user.tokenExpiresAt);
                const now = new Date();

                if (expiresAt > now) {
                    console.log('✅ Auto login disponível para:', user.username);
                    return user;
                } else {
                    console.log('⚠️ Token expirado para:', user.username);

                    // Tentar refresh se tiver refresh_token
                    if (user.refresh_token) {
                        try {
                            this.currentUser = user;
                            const refreshedUser = await this.refreshToken();
                            console.log('✅ Token renovado para auto login');
                            return refreshedUser;
                        } catch (error) {
                            console.log('❌ Erro no refresh para auto login:', error);
                        }
                    }
                }
            }
        }

        console.log('ℹ️ Nenhum auto login válido disponível');
        return null;
    }

    /**
     * Obter token de autorização
     */
    getAuthToken(): string | null {
        if (!this.currentUser?.access_token) {
            return null;
        }

        return `${this.currentUser.token_type} ${this.currentUser.access_token}`;
    }

    /**
     * Obter tipo de autenticação
     */
    getAuthType(): AuthType {
        return AuthType.OAUTH2;
    }

    /**
     * Obter usuários salvos
     */
    private async getSavedUsers(): Promise<AuthUser[]> {
        const users = await asyncStorageService.getItem<AuthUser[]>('saved_users');
        return Array.isArray(users) ? users : [];
    }

    /**
     * Limpar todos os dados (debug)
     */
    async clearStorage(): Promise<void> {
        console.log('🗑️ Limpando storage OAuth2...');
        await asyncStorageService.removeItem('current_user');
        await asyncStorageService.removeItem('saved_users');
        this.currentUser = null;
        console.log('✅ Storage limpo');
    }

    /**
     * Listar usuários salvos (debug)
     */
    async listStoredUsers(): Promise<AuthUser[]> {
        const users = await this.getSavedUsers();
        console.log('📋 Usuários salvos:', users.length);
        return users;
    }

    /**
     * Informações do sistema (debug)
     */
    getSystemInfo() {
        return {
            currentUser: this.currentUser?.username || null,
            authType: AuthType.OAUTH2,
            hasToken: !!this.currentUser?.access_token,
            tokenValid: this.currentUser ? this.isTokenValid() : false,
            tokenExpiresAt: this.currentUser?.tokenExpiresAt || null,
        };
    }

    /**
     * Testar credenciais sem salvar (debug) com axios
     */
    async testCredentialsOnly(credentials: LoginCredentials): Promise<{
        success: boolean;
        data?: OAuth2Response;
        error?: string;
    }> {
        const { connection } = useConfigStore.getState();

        if (!connection.baseUrl) {
            return { success: false, error: 'URL não configurada' };
        }

        const oauthUrl = `${connection.baseUrl}/api/oauth2/v1/token?grant_type=password`;

        try {
            const response = await axios.post(oauthUrl, {}, {
                headers: {
                    'Content-Type': 'application/json',
                    'username': credentials.username,
                    'password': credentials.password,
                },
                timeout: 10000,
                validateStatus: (status) => status < 500, // Aceitar qualquer status < 500
            });

            if (response.status === 200 && response.data.access_token) {
                return { success: true, data: response.data };
            } else {
                return {
                    success: false,
                    error: response.data?.error || `Status ${response.status}`
                };
            }

        } catch (error: any) {
            let errorMessage = 'Erro na requisição';

            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Timeout na requisição';
            } else if (error.response) {
                errorMessage = error.response.data?.error || `Status ${error.response.status}`;
            } else if (error.request) {
                errorMessage = 'Não foi possível conectar ao servidor';
            } else {
                errorMessage = error.message || 'Erro desconhecido';
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    }
}

export const authService = AuthService.getInstance();