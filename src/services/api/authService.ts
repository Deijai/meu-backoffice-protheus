// src/services/api/authService.ts - REFRESH TOKEN CORRIGIDO TOTVS
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
    password?: string; // Para auto login
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
     * LOGIN PRINCIPAL - ACEITA STATUS 200 E 201
     */
    async signIn(credentials: LoginCredentials): Promise<AuthUser> {
        const { connection } = useConfigStore.getState();

        if (!connection.baseUrl) {
            throw new Error('❌ Configuração REST não encontrada');
        }

        console.log('🔄 === LOGIN OAUTH2 INICIADO ===');
        console.log('👤 Usuário:', credentials.username);
        console.log('🌐 URL Base:', connection.baseUrl);

        const oauthUrl = `${connection.baseUrl}/api/oauth2/v1/token?grant_type=password`;
        console.log('🔐 URL OAuth COMPLETA:', oauthUrl);

        try {
            console.log('📤 ENVIANDO REQUISIÇÃO...');

            const response = await axios.post(oauthUrl, {}, {
                headers: {
                    'Content-Type': 'application/json',
                    'username': credentials.username,
                    'password': credentials.password,
                },
                timeout: 15000,
                validateStatus: (status) => {
                    console.log(`📡 STATUS RECEBIDO: ${status}`);
                    return status < 500;
                },
            });

            console.log('📊 === RESPOSTA COMPLETA DO SERVIDOR ===');
            console.log('📡 Status:', response.status);
            console.log('📄 Data COMPLETA:', JSON.stringify(response.data, null, 2));

            // VALIDAÇÃO CORRIGIDA - ACEITA 200 E 201
            if (response.status === 200 || response.status === 201) {
                console.log(`✅ Status ${response.status} - Analisando dados...`);

                if (response.data?.access_token) {
                    console.log('🔑 TOKEN ENCONTRADO - Login VÁLIDO');

                    // CRIAR USUÁRIO AUTENTICADO
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
                    console.log('✅ LOGIN CONCLUÍDO COM SUCESSO');
                    return authUser;

                } else {
                    console.log(`❌ Status ${response.status} mas SEM TOKEN`);
                    throw new Error(`❌ Servidor retornou status ${response.status} mas sem token de acesso`);
                }

            } else if (response.status === 401) {
                console.log('❌ Status 401 - CREDENCIAIS REJEITADAS');
                throw new Error('❌ Usuário ou senha incorretos');

            } else if (response.status === 400) {
                console.log('❌ Status 400 - REQUISIÇÃO INVÁLIDA');
                throw new Error('❌ Dados de login inválidos');

            } else {
                console.log(`❌ Status inesperado: ${response.status}`);

                // SE TEM TOKEN, ACEITAR MESMO COM STATUS DIFERENTE
                if (response.data?.access_token) {
                    console.log('🔧 Status diferente mas TEM TOKEN - Aceitando login...');

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
                    console.log(`✅ LOGIN ACEITO com status ${response.status}`);
                    return authUser;
                } else {
                    throw new Error(`❌ Status ${response.status} e sem token`);
                }
            }

        } catch (error: any) {
            console.error('🚨 === ERRO NO LOGIN ===');
            console.error('🚨 Tipo do erro:', error.constructor.name);
            console.error('🚨 Mensagem:', error.message);

            if (error.response) {
                console.error('🚨 Response Status:', error.response.status);
                console.error('🚨 Response Data:', error.response.data);
            }

            // TRATAR DIFERENTES TIPOS DE ERRO
            if (error.code === 'ECONNABORTED') {
                throw new Error('❌ Timeout na conexão (servidor demorou mais de 15 segundos)');
            } else if (error.code === 'ECONNREFUSED') {
                throw new Error('❌ Conexão recusada - servidor pode estar desligado');
            } else if (error.code === 'ENOTFOUND') {
                throw new Error('❌ Servidor não encontrado - verifique o endereço');
            } else if (error.response) {
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
                throw new Error('❌ Erro de conexão - servidor não responde');
            } else {
                throw new Error(`❌ Erro inesperado: ${error.message}`);
            }
        }
    }

    /**
     * *** REFRESH TOKEN CORRIGIDO PARA TOTVS PROTHEUS ***
     * Endpoint: /tlpp/oauth2/token
     * Parâmetros: refresh_token e grant_type na query string
     */
    async refreshToken(): Promise<AuthUser> {
        const currentUser = await this.getCurrentUser();

        if (!currentUser || !currentUser.refresh_token) {
            throw new Error('❌ Nenhum refresh token disponível');
        }

        const { connection } = useConfigStore.getState();

        // ENDPOINT CORRETO DO TOTVS PROTHEUS
        const refreshUrl = `${connection.baseUrl}/tlpp/oauth2/token`;

        console.log('🔄 === REFRESH TOKEN TOTVS PROTHEUS INICIADO ===');
        console.log('🔗 URL:', refreshUrl);
        console.log('🔑 Refresh Token:', currentUser.refresh_token.substring(0, 20) + '...');

        try {
            // ENVIAR PARÂMETROS NA QUERY STRING CONFORME DOCUMENTAÇÃO TOTVS
            const response = await axios.post(refreshUrl, {}, {
                params: {
                    refresh_token: currentUser.refresh_token,
                    grant_type: 'refresh_token'
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.access_token}`,
                },
                timeout: 10000,
                validateStatus: (status) => {
                    console.log(`📡 Refresh Status: ${status}`);
                    return status < 500;
                },
            });

            console.log('📊 === RESPOSTA DO REFRESH TOKEN ===');
            console.log('📡 Status:', response.status);
            console.log('📄 Data:', JSON.stringify(response.data, null, 2));

            // VERIFICAR SE REFRESH FOI BEM-SUCEDIDO
            if ((response.status === 200 || response.status === 201) && response.data?.access_token) {
                console.log('✅ REFRESH TOKEN BEM-SUCEDIDO');

                const oauthData: OAuth2Response = response.data;

                // Atualizar dados do usuário
                const updatedUser: AuthUser = {
                    ...currentUser,
                    access_token: oauthData.access_token,
                    refresh_token: oauthData.refresh_token || currentUser.refresh_token, // Manter o antigo se não vier novo
                    expires_in: oauthData.expires_in,
                    tokenExpiresAt: new Date(Date.now() + (oauthData.expires_in * 1000)).toISOString(),
                    lastLogin: new Date().toISOString(),
                };

                await this.saveAuthenticatedUser(updatedUser);

                console.log('✅ Token renovado com sucesso');
                console.log('🔑 Novo token:', updatedUser.access_token.substring(0, 20) + '...');
                console.log('⏰ Expira em:', updatedUser.expires_in, 'segundos');

                return updatedUser;

            } else {
                console.error('❌ Refresh token falhou:', response.status, response.data);
                throw new Error(`❌ Refresh token falhou: Status ${response.status}`);
            }

        } catch (error: any) {
            console.error('🚨 === ERRO NO REFRESH TOKEN ===');
            console.error('🚨 Erro completo:', error);

            if (error.response) {
                console.error('📡 Status:', error.response.status);
                console.error('📄 Data:', error.response.data);

                // VERIFICAR SE É "token expired" CONFORME DOCUMENTAÇÃO
                const errorMessage = error.response.data?.error || error.response.data?.message || '';

                if (errorMessage.toLowerCase().includes('token expired') ||
                    errorMessage.toLowerCase().includes('expired') ||
                    error.response.status === 401) {
                    console.log('🔓 Token realmente expirado, forçando novo login');
                }
            }

            // Se refresh falhar, forçar novo login
            await this.signOut();
            throw new Error('❌ Sessão expirada, faça login novamente');
        }
    }

    /**
     * VERIFICAR AUTO LOGIN
     */
    async checkAutoLogin(): Promise<AuthUser | null> {
        console.log('🔍 === VERIFICANDO AUTO LOGIN ===');

        const savedUsers = await this.getSavedUsers();
        console.log('📋 Usuários salvos encontrados:', savedUsers.length);

        if (savedUsers.length === 0) {
            console.log('ℹ️ Nenhum usuário salvo para auto login');
            return null;
        }

        // Ordenar por último login
        const sortedUsers = savedUsers.sort((a, b) =>
            new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime()
        );

        for (const user of sortedUsers) {
            console.log('🔍 Verificando usuário:', user.username);
            console.log('🔄 KeepConnected:', user.keepConnected);
            console.log('🔑 Tem Token:', !!user.access_token);
            console.log('🔒 Tem Senha:', !!user.password);

            if (user.keepConnected && user.access_token && user.password) {
                // Verificar se token ainda é válido
                if (user.tokenExpiresAt) {
                    const expiresAt = new Date(user.tokenExpiresAt);
                    const now = new Date();
                    const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60);

                    console.log(`⏰ Token expira em ${minutesUntilExpiry.toFixed(1)} minutos`);

                    if (expiresAt > now) {
                        console.log('✅ Auto login disponível para:', user.username);
                        return user;
                    } else {
                        console.log('⚠️ Token expirado para:', user.username);

                        // Tentar refresh se tiver refresh_token
                        if (user.refresh_token) {
                            try {
                                console.log('🔄 Tentando renovar token...');
                                this.currentUser = user;
                                const refreshedUser = await this.refreshToken();
                                console.log('✅ Token renovado para auto login');
                                return refreshedUser;
                            } catch (error) {
                                console.log('❌ Erro no refresh para auto login:', error);
                            }
                        }
                    }
                } else {
                    console.log('⚠️ Token sem data de expiração');
                    return user; // Retorna mesmo assim
                }
            } else {
                console.log('❌ Usuário não habilitado para auto login');
            }
        }

        console.log('ℹ️ Nenhum auto login válido disponível');
        return null;
    }

    /**
     * VERIFICAR SEGURANÇA DO SERVIDOR
     */
    async checkSecurity(): Promise<boolean> {
        const { connection } = useConfigStore.getState();

        if (!connection.baseUrl) {
            console.log('❌ Sem URL base para teste de segurança');
            return false;
        }

        console.log('🔒 === TESTE DE SEGURANÇA INICIADO ===');
        const oauthUrl = `${connection.baseUrl}/api/oauth2/v1/token?grant_type=password`;
        console.log('🔗 URL de teste:', oauthUrl);

        try {
            // Usar credenciais OBVIAMENTE inválidas
            const testCredentials = {
                username: 'usuario_inexistente_teste_12345',
                password: 'senha_impossivel_teste_67890'
            };

            console.log('🧪 Testando com credenciais FALSAS:', testCredentials.username);

            const response = await axios.post(oauthUrl, {}, {
                headers: {
                    'Content-Type': 'application/json',
                    'username': testCredentials.username,
                    'password': testCredentials.password,
                },
                timeout: 10000,
                validateStatus: (status) => status < 500,
            });

            console.log('🔒 Status do teste de segurança:', response.status);

            if (response.status === 401) {
                console.log('✅ SERVIDOR SEGURO: Rejeitou credenciais falsas (401)');
                return true;
            } else if (response.status === 400) {
                console.log('✅ SERVIDOR FUNCIONANDO: Bad request (400)');
                return true;
            } else if (response.status === 200 || response.status === 201) {
                if (response.data?.access_token) {
                    console.log('🚨 PROBLEMA CRÍTICO: Servidor aceitou credenciais FALSAS!');
                    return false; // SERVIDOR NÃO É SEGURO!
                } else {
                    console.log('✅ Servidor funcionando (sem token)');
                    return true;
                }
            } else {
                console.log(`⚠️ Status inesperado: ${response.status}`);
                return false;
            }

        } catch (error: any) {
            console.error('🔒 Erro no teste de segurança:', error);

            if (error.response?.status === 401) {
                console.log('✅ SERVIDOR SEGURO: Erro 401 esperado');
                return true;
            }

            console.log('❌ Falha no teste de segurança');
            return false;
        }
    }

    /**
     * TESTE DE CREDENCIAIS SEM SALVAR
     */
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

        console.log('🧪 === TESTE DE CREDENCIAIS INICIADO ===');
        console.log('👤 Username:', credentials.username);
        console.log('🔗 URL:', oauthUrl);

        try {
            const startTime = Date.now();

            const response = await axios.post(oauthUrl, {}, {
                headers: {
                    'Content-Type': 'application/json',
                    'username': credentials.username,
                    'password': credentials.password,
                },
                timeout: 10000,
                validateStatus: (status) => {
                    console.log(`🧪 Status recebido no teste: ${status}`);
                    return status < 500;
                },
            });

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            console.log('🧪 === RESULTADO DO TESTE ===');
            console.log(`⏱️ Tempo de resposta: ${responseTime}ms`);
            console.log('📡 Status:', response.status);

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

            // ACEITAR STATUS 200 E 201
            if ((response.status === 200 || response.status === 201) && response.data?.access_token) {
                console.log(`✅ TESTE: Credenciais ACEITAS pelo servidor (Status: ${response.status})`);
                return {
                    success: true,
                    data: response.data,
                    debugInfo
                };
            } else {
                console.log(`❌ TESTE: Credenciais REJEITADAS (Status: ${response.status})`);
                return {
                    success: false,
                    error: response.data?.error || `Status ${response.status}`,
                    debugInfo
                };
            }

        } catch (error: any) {
            console.error('🧪 === ERRO NO TESTE ===');

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

    /**
     * DETECTAR SE PRECISA REFRESH TOKEN
     * Verifica mensagens como "token expired" conforme documentação TOTVS
     */
    static isTokenExpiredError(error: any): boolean {
        if (!error || !error.response) {
            return false;
        }

        const status = error.response.status;
        const data = error.response.data;

        // Status 401 geralmente indica token expirado
        if (status === 401) {
            return true;
        }

        // Verificar mensagens específicas do TOTVS
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

    // ... resto dos métodos iguais (saveAuthenticatedUser, signOut, getCurrentUser, etc.)

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
            console.log('💾 Usuário salvo para auto login');
        }

        console.log('✅ Usuário salvo no storage');
    }

    async signOut(): Promise<void> {
        console.log('🚪 Fazendo logout...');

        try {
            const currentUser = await this.getCurrentUser();
            if (currentUser?.access_token) {
                const { connection } = useConfigStore.getState();

                // ENDPOINT CORRETO PARA REVOKE NO TOTVS (se existir)
                const revokeUrl = `${connection.baseUrl}/tlpp/oauth2/revoke`;

                await axios.post(revokeUrl, {}, {
                    headers: {
                        'Authorization': `Bearer ${currentUser.access_token}`,
                    },
                    timeout: 5000,
                    validateStatus: () => true,
                });

                console.log('🔓 Token revogado no servidor');
            }
        } catch (error) {
            console.log('⚠️ Erro ao revogar token (continuando logout):', error);
        }

        this.currentUser = null;
        await asyncStorageService.removeItem('current_user');
        console.log('✅ Logout realizado');
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
            console.log('⚠️ Token expirando em breve');
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
        console.log('🗑️ Limpando storage OAuth2...');
        await asyncStorageService.removeItem('current_user');
        await asyncStorageService.removeItem('saved_users');
        this.currentUser = null;
        console.log('✅ Storage limpo');
    }

    async listStoredUsers(): Promise<AuthUser[]> {
        const users = await this.getSavedUsers();
        console.log('📋 Usuários salvos:', users.length);
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