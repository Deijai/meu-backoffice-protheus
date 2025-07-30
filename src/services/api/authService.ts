// src/services/api/authService.ts - VERSÃO CORRIGIDA
import axios from 'axios';
import { sha256 } from 'js-sha256';
import { useConfigStore } from '../../store/configStore';
import { asyncStorageService } from '../storage/asyncStorage';

export enum AuthType {
    BASIC = 'BASIC',
    OAUTH2 = 'OAUTH2'
}

export interface LoginCredentials {
    username: string;
    password: string;
    keepConnected?: boolean;
}

export interface AuthUser {
    username: string;
    cryptedPassword: string;
    keepConnected: boolean;
    lastLogin: string;
    authType: AuthType;
    tenantId?: string;
    establishment?: any;
    access_token?: string;
    refresh_token?: string;
    password?: string;
}

// ✅ CREDENCIAIS VÁLIDAS DO SEU SISTEMA
const VALID_CREDENTIALS = [
    { username: 'admin', password: '1234' }, // ← SUA CREDENCIAL PRINCIPAL
    { username: 'Administrador', password: 'admin' },
    { username: 'user', password: 'user123' },
    // Adicione mais credenciais conforme necessário
];

export class AuthService {
    private static instance: AuthService;
    private currentUser: AuthUser | null = null;
    private authType: AuthType = AuthType.BASIC;
    private axiosInstance = axios.create({
        timeout: 30000,
    });

    private constructor() { }

    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    /**
     * ========================================
     * LOGIN PRINCIPAL (VERSÃO CORRIGIDA V3 - SEGUINDO PADRÃO IONIC)
     * ========================================
     */
    async signIn(credentials: LoginCredentials): Promise<AuthUser> {
        const { connection } = useConfigStore.getState();

        if (!connection.baseUrl) {
            throw new Error('❌ Configuração REST não encontrada');
        }

        console.log('🔄 === LOGIN INICIADO ===');
        console.log('👤 Usuário:', credentials.username);
        console.log('🌐 URL:', connection.baseUrl);

        // Determina tipo de auth
        this.authType = connection.protocol === 'HTTPS' ? AuthType.OAUTH2 : AuthType.BASIC;
        console.log('🔐 Tipo de auth:', this.authType);

        // ✅ STRATEGY IONIC: VALIDAÇÃO LOCAL + SERVIDOR
        console.log('🔍 Validando credenciais localmente primeiro...');
        const isValidLocal = await this.validateCredentialsLocally(credentials);

        if (!isValidLocal) {
            console.log('❌ Credenciais rejeitadas na validação local');
            throw new Error('❌ Usuário ou senha incorretos');
        }

        console.log('✅ Credenciais válidas localmente');

        // ✅ TENTAR LOGIN NO SERVIDOR (seguindo padrão Ionic)
        if (await this.isServerAvailable()) {
            console.log('📡 Servidor disponível - tentando autenticação...');

            try {
                await this.tryServerAuthentication(credentials);
                console.log('✅ Servidor autenticou com sucesso');
            } catch (serverError: any) {
                if (serverError.response?.status === 401) {
                    console.log('❌ Servidor rejeitou credenciais');
                    throw new Error('❌ Credenciais rejeitadas pelo servidor');
                } else {
                    console.log('⚠️ Erro de conectividade com servidor, mas credenciais locais OK');
                    // Continuar com login offline
                }
            }
        } else {
            console.log('⚠️ Servidor indisponível - login offline');
        }

        // ✅ PROCESSAR LOGIN
        return this.handleUserSignIn({
            username: credentials.username,
            password: credentials.password,
            keepConnected: credentials.keepConnected || false,
            lastLogin: new Date().toISOString(),
            source: 'local-validation',
        });
    }

    /**
     * ========================================
     * VERIFICAR SE SERVIDOR ESTÁ DISPONÍVEL (PADRÃO IONIC)
     * ========================================
     */
    private async isServerAvailable(): Promise<boolean> {
        const { connection } = useConfigStore.getState();

        try {
            const response = await this.axiosInstance.get(`${connection.baseUrl}/ping`, {
                timeout: 5000,
            });

            console.log('📡 Ping respondeu:', response.status);
            return true; // Qualquer resposta = servidor disponível
        } catch (error: any) {
            if (error.response?.status === 401) {
                console.log('✅ Servidor seguro (401 no ping)');
                return true; // 401 = servidor funcionando e seguro
            } else {
                console.log('❌ Servidor indisponível:', error.message);
                return false; // Erro real de conectividade
            }
        }
    }

    /**
     * ========================================
     * TENTAR AUTENTICAÇÃO NO SERVIDOR (PADRÃO IONIC)
     * ========================================
     */
    private async tryServerAuthentication(credentials: LoginCredentials): Promise<void> {
        const { connection } = useConfigStore.getState();

        try {
            const authHeader = this.generateBasicAuth(credentials.username, credentials.password);

            console.log('📡 Tentando autenticação no servidor...');
            const response = await this.axiosInstance.get(`${connection.baseUrl}/healthcheck`, {
                headers: {
                    'Authorization': `Basic ${authHeader}`,
                },
                timeout: 10000,
            });

            console.log('✅ Servidor autenticou:', response.status);
            // Se chegou aqui sem erro = credenciais válidas no servidor
        } catch (error: any) {
            console.log('❌ Erro na autenticação servidor:', error.response?.status);
            throw error; // Propagar erro para tratamento acima
        }
    }

    /**
     * ========================================
     * VALIDAÇÃO LOCAL DE CREDENCIAIS
     * ========================================
     */
    private async validateCredentialsLocally(credentials: LoginCredentials): Promise<boolean> {
        console.log('🔍 Validação local iniciada...');

        // 1. Verificar credenciais hardcoded
        const isValidHardcoded = VALID_CREDENTIALS.some(validCred =>
            validCred.username.toLowerCase() === credentials.username.toLowerCase() &&
            validCred.password === credentials.password
        );

        if (isValidHardcoded) {
            console.log('✅ Credencial válida (hardcoded)');
            return true;
        }

        // 2. Verificar no storage
        const users = await this.getStoredUsers();
        const cryptedPassword = sha256(credentials.password);

        const storedUser = users.find(u =>
            u.username.toLowerCase() === credentials.username.toLowerCase() &&
            u.cryptedPassword === cryptedPassword
        );

        if (storedUser) {
            console.log('✅ Credencial válida (storage)');
            return true;
        }

        console.log('❌ Credencial não encontrada');
        return false;
    }

    /**
     * ========================================
     * TESTAR CONECTIVIDADE DO SERVIDOR
     * ========================================
     */
    private async testServerConnectivity(): Promise<void> {
        const { connection } = useConfigStore.getState();

        try {
            const response = await this.axiosInstance.get(`${connection.baseUrl}/ping`, {
                timeout: 5000,
            });

            console.log('📡 Servidor respondeu:', response.status);
            // Não importa o status, só queremos saber se está acessível
        } catch (error: any) {
            console.log('⚠️ Servidor não acessível:', error.message);
            throw error;
        }
    }



    /**
     * ========================================
     * VERIFICAÇÃO DE SEGURANÇA (PADRÃO IONIC)
     * ========================================
     */
    async checkSecurity(): Promise<boolean> {
        const { connection } = useConfigStore.getState();

        console.log('🔒 Verificando servidor...');
        console.log('📡 URL:', `${connection.baseUrl}/ping`);

        try {
            const response = await this.axiosInstance.get(`${connection.baseUrl}/ping`, {
                timeout: 10000,
            });

            if (response.status === 200) {
                console.log('⚠️ Servidor responde sem auth (pode não ser seguro)');

                // Testar se realmente valida credenciais
                const validatesAuth = await this.testServerAuthValidation();
                if (validatesAuth) {
                    console.log('✅ Servidor valida credenciais adequadamente');
                    return true;
                } else {
                    console.log('❌ Servidor NÃO valida credenciais adequadamente');
                    return false;
                }
            } else {
                console.log('✅ Servidor protegido');
                return true;
            }
        } catch (error: any) {
            if (error.response?.status === 401) {
                console.log('✅ Servidor protegido (401 no ping) - PADRÃO IONIC');
                return true; // ✅ SEGUINDO PADRÃO IONIC: 401 = SEGURO
            } else {
                console.log('⚠️ Erro de conectividade:', error.message);
                return false; // Erro real de rede
            }
        }
    }

    /**
     * ========================================
     * TESTAR SE SERVIDOR VALIDA CREDENCIAIS
     * ========================================
     */
    private async testServerAuthValidation(): Promise<boolean> {
        const { connection } = useConfigStore.getState();

        console.log('🧪 Testando se servidor valida credenciais...');

        try {
            // Teste com credenciais obviamente falsas
            const fakeAuth = this.generateBasicAuth('fake_user_123', 'fake_password_456');

            const response = await this.axiosInstance.get(`${connection.baseUrl}/healthcheck`, {
                headers: { 'Authorization': `Basic ${fakeAuth}` },
                timeout: 5000,
            });

            if (response.status === 200) {
                console.log('❌ SERVIDOR NÃO VALIDA CREDENCIAIS! (aceitou credenciais falsas)');
                return false; // Servidor não é seguro
            } else {
                console.log('✅ Servidor rejeitou credenciais falsas');
                return true; // Servidor é seguro
            }

        } catch (error: any) {
            if (error.response?.status === 401) {
                console.log('✅ Servidor rejeitou credenciais falsas (401)');
                return true; // Servidor é seguro
            } else {
                console.log('⚠️ Erro no teste de validação:', error.message);
                return false; // Assumir não seguro
            }
        }
    }

    /**
     * ========================================
     * PROCESSAMENTO DO USUÁRIO
     * ========================================
     */
    private async handleUserSignIn(userData: any): Promise<AuthUser> {
        console.log('💾 Salvando usuário...');

        const users = await this.getStoredUsers();
        const cryptedPassword = sha256(userData.password);

        let user = users.find(u =>
            u.username.toLowerCase() === userData.username.toLowerCase()
        );

        if (user) {
            console.log('🔄 Atualizando usuário existente');
            user.cryptedPassword = cryptedPassword;
            user.keepConnected = userData.keepConnected;
            user.lastLogin = userData.lastLogin;
            user.authType = this.authType;

            if (user.keepConnected) {
                user.password = userData.password;
            } else {
                delete user.password;
            }
        } else {
            console.log('➕ Criando novo usuário');
            user = {
                username: userData.username,
                cryptedPassword,
                keepConnected: userData.keepConnected,
                lastLogin: userData.lastLogin,
                authType: this.authType,
            };

            if (user.keepConnected) {
                user.password = userData.password;
            }

            users.push(user);
        }

        await this.saveUsers(users);

        if (user.keepConnected) {
            await this.keepUser(user);
        }

        this.currentUser = user;
        console.log('✅ Usuário salvo com sucesso');
        return user;
    }

    /**
     * ========================================
     * DETECÇÃO DE ERRO DE REDE
     * ========================================
     */
    private isNetworkError(error: any): boolean {
        const networkErrors = [
            'ECONNABORTED',
            'NETWORK_ERROR',
            'ECONNREFUSED',
            'ENOTFOUND',
            'ETIMEDOUT',
        ];

        return (
            networkErrors.includes(error.code) ||
            error.message?.includes('Network Error') ||
            error.message?.includes('timeout') ||
            error.message?.includes('fetch')
        );
    }

    /**
     * ========================================
     * MÉTODOS BÁSICOS (INALTERADOS)
     * ========================================
     */
    async signOut(): Promise<void> {
        console.log('🚪 Fazendo logout...');
        this.currentUser = null;
        await asyncStorageService.removeItem('user');
        console.log('✅ Logout realizado');
    }

    async getCurrentUser(): Promise<AuthUser | null> {
        if (this.currentUser) {
            return this.currentUser;
        }

        const storedUser = await asyncStorageService.getItem<AuthUser>('user');
        if (storedUser) {
            this.currentUser = storedUser;
        }

        return this.currentUser;
    }

    async checkAutoLogin(): Promise<AuthUser | null> {
        console.log('🔍 Verificando auto login...');

        const users = await this.getStoredUsers();

        if (users.length === 0) {
            console.log('ℹ️ Nenhum usuário salvo');
            return null;
        }

        const sortedUsers = users.sort((a, b) =>
            new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime()
        );

        const lastUser = sortedUsers[0];

        if (lastUser.keepConnected && lastUser.password) {
            console.log('✅ Auto login disponível para:', lastUser.username);
            return lastUser;
        }

        return null;
    }

    private generateBasicAuth(username: string, password: string): string {
        return btoa(`${username}:${password}`);
    }

    getAuthToken(): string | null {
        if (!this.currentUser) return null;

        if (this.authType === AuthType.OAUTH2) {
            return this.currentUser.access_token || null;
        } else {
            if (this.currentUser.password) {
                return this.generateBasicAuth(this.currentUser.username, this.currentUser.password);
            }
        }

        return null;
    }

    getAuthType(): AuthType {
        return this.authType;
    }

    async refreshToken(): Promise<void> {
        // Implementar se necessário para OAUTH2
        console.log('🔄 Refresh token não implementado');
    }

    private async getStoredUsers(): Promise<AuthUser[]> {
        const users = await asyncStorageService.getItem<AuthUser[]>('users');
        return Array.isArray(users) ? users : [];
    }

    private async saveUsers(users: AuthUser[]): Promise<void> {
        await asyncStorageService.setItem('users', users);
    }

    private async keepUser(user: AuthUser): Promise<void> {
        await asyncStorageService.setItem('user', user);
    }

    /**
     * ========================================
     * MÉTODOS DE DEBUG
     * ========================================
     */
    async clearStorage(): Promise<void> {
        console.log('🗑️ Limpando storage...');
        await asyncStorageService.removeItem('users');
        await asyncStorageService.removeItem('user');
        this.currentUser = null;
        console.log('✅ Storage limpo');
    }

    async listStoredUsers(): Promise<AuthUser[]> {
        const users = await this.getStoredUsers();
        console.log('📋 Usuários no storage:', users.length);
        return users;
    }

    getSystemInfo() {
        return {
            currentUser: this.currentUser?.username || null,
            authType: this.authType,
            hasToken: !!this.getAuthToken(),
            validCredentials: VALID_CREDENTIALS.map(c => c.username),
        };
    }

    /**
     * ========================================
     * CONFIGURAR CREDENCIAIS VÁLIDAS (ESTÁTICOS)
     * ========================================
     */
    static addValidCredential(username: string, password: string): void {
        const exists = VALID_CREDENTIALS.some(c =>
            c.username.toLowerCase() === username.toLowerCase()
        );

        if (!exists) {
            VALID_CREDENTIALS.push({ username, password });
            console.log('✅ Credencial adicionada:', username);
        }
    }

    static getValidCredentials(): Array<{ username: string, password: string }> {
        return [...VALID_CREDENTIALS];
    }

    /**
     * ========================================
     * NOVO: MÉTODO DE TESTE PARA DEBUG (VERSÃO IONIC)
     * ========================================
     */
    async testCredentialsOnly(credentials: LoginCredentials): Promise<{
        localValid: boolean;
        serverAvailable?: boolean;
        serverAuthWorked?: boolean;
        serverSecure?: boolean;
        error?: string;
    }> {
        console.log('🧪 Testando credenciais (modo debug)...');

        // Teste local
        const localValid = await this.validateCredentialsLocally(credentials);

        // Teste disponibilidade do servidor
        try {
            const serverAvailable = await this.isServerAvailable();

            if (serverAvailable) {
                // Se servidor disponível, testar autenticação real
                try {
                    await this.tryServerAuthentication(credentials);

                    return {
                        localValid,
                        serverAvailable: true,
                        serverAuthWorked: true,
                        serverSecure: true,
                    };
                } catch (authError: any) {
                    return {
                        localValid,
                        serverAvailable: true,
                        serverAuthWorked: false,
                        serverSecure: true,
                        error: `Auth falhou: ${authError.response?.status}`,
                    };
                }
            } else {
                return {
                    localValid,
                    serverAvailable: false,
                    error: 'Servidor indisponível',
                };
            }
        } catch (error: any) {
            return {
                localValid,
                serverAvailable: false,
                error: error.message,
            };
        }
    }
}

export const authService = AuthService.getInstance();