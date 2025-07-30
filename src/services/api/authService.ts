// src/services/api/authService.ts - WORKAROUND para servidor sem validação
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

// LISTA DE CREDENCIAIS VÁLIDAS (temporário até corrigir servidor)
const VALID_CREDENTIALS = [
    { username: 'admin', password: '123456' },
    { username: 'Administrador', password: 'admin' },
    { username: 'user', password: 'user123' },
    // Adicione aqui as credenciais válidas do seu sistema
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
     * LOGIN COM VALIDAÇÃO LOCAL (WORKAROUND)
     * ========================================
     * Como o servidor não valida, validamos localmente
     */
    async signIn(credentials: LoginCredentials): Promise<AuthUser> {
        const { connection } = useConfigStore.getState();

        if (!connection.baseUrl) {
            throw new Error('❌ Configuração REST não encontrada');
        }

        console.log('🔄 === LOGIN COM VALIDAÇÃO LOCAL ===');
        console.log('👤 Usuário:', credentials.username);
        console.log('🌐 URL:', connection.baseUrl);

        // VALIDAÇÃO LOCAL PRIMEIRO
        const isValidCredential = await this.validateCredentialsLocally(credentials);

        if (!isValidCredential) {
            console.log('❌ Credenciais inválidas (validação local)');
            throw new Error('❌ Usuário ou senha incorretos');
        }

        console.log('✅ Credenciais válidas (validação local)');

        // Determina tipo de auth
        this.authType = connection.protocol === 'HTTPS' ? AuthType.OAUTH2 : AuthType.BASIC;
        console.log('🔐 Tipo de auth:', this.authType);

        // TESTE DE CONECTIVIDADE COM SERVIDOR
        try {
            console.log('📡 Testando conectividade com servidor...');

            const authHeader = this.generateBasicAuth(credentials.username, credentials.password);
            const response = await this.axiosInstance.get(`${connection.baseUrl}/healthcheck`, {
                headers: {
                    'Authorization': `Basic ${authHeader}`,
                },
                timeout: 10000,
            });

            console.log('✅ Servidor respondeu:', response.status);
            console.log('📊 Data:', response.data);

            // Como o servidor sempre retorna 200, consideramos sucesso
            return this.handleUserSignIn({
                username: credentials.username,
                password: credentials.password,
                keepConnected: credentials.keepConnected || false,
                lastLogin: new Date().toISOString(),
                serverResponse: response.data,
            });

        } catch (serverError: any) {
            console.error('❌ Erro de conectividade:', serverError);

            // Se há erro de rede, tenta offline
            if (this.isNetworkError(serverError)) {
                console.log('🔄 Tentando login offline...');
                return this.signInOffline(credentials);
            } else {
                throw new Error('❌ Erro de conexão com o servidor');
            }
        }
    }

    /**
     * ========================================
     * VALIDAÇÃO LOCAL DE CREDENCIAIS
     * ========================================
     * Como servidor não valida, validamos aqui
     */
    private async validateCredentialsLocally(credentials: LoginCredentials): Promise<boolean> {
        console.log('🔍 Validando credenciais localmente...');

        // Verifica na lista de credenciais válidas
        const isValid = VALID_CREDENTIALS.some(validCred =>
            validCred.username.toLowerCase() === credentials.username.toLowerCase() &&
            validCred.password === credentials.password
        );

        if (isValid) {
            console.log('✅ Credencial encontrada na lista válida');
            return true;
        }
        const result = await this.validateAgainstStoredUsers(credentials)

        // Se não está na lista, verifica no storage (usuários que já fizeram login)
        return result;
    }

    /**
     * Valida contra usuários já salvos no storage
     */
    private async validateAgainstStoredUsers(credentials: LoginCredentials): Promise<boolean> {
        try {
            console.log('🔍 Verificando usuários no storage...');

            const users = await this.getStoredUsers();
            const cryptedPassword = sha256(credentials.password);

            const storedUser = users.find(u =>
                u.username.toLowerCase() === credentials.username.toLowerCase() &&
                u.cryptedPassword === cryptedPassword
            );

            if (storedUser) {
                console.log('✅ Credencial válida encontrada no storage');
                return true;
            }

            console.log('❌ Credencial não encontrada no storage');
            return false;
        } catch (error) {
            console.error('❌ Erro ao verificar storage:', error);
            return false;
        }
    }

    /**
     * ========================================
     * LOGIN OFFLINE
     * ========================================
     */
    private async signInOffline(credentials: LoginCredentials): Promise<AuthUser> {
        console.log('🔄 === LOGIN OFFLINE ===');

        const users = await this.getStoredUsers();
        const cryptedPassword = sha256(credentials.password);

        const user = users.find(u =>
            u.username.toLowerCase() === credentials.username.toLowerCase() &&
            u.cryptedPassword === cryptedPassword
        );

        if (user) {
            console.log('✅ Login offline bem-sucedido');

            user.lastLogin = new Date().toISOString();
            user.keepConnected = credentials.keepConnected || false;

            if (credentials.keepConnected) {
                user.password = credentials.password;
            }

            await this.saveUsers(users);

            if (user.keepConnected) {
                await this.keepUser(user);
            }

            this.currentUser = user;
            return user;
        }

        throw new Error('❌ Credenciais não encontradas para login offline');
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
     * VERIFICAÇÃO DE SEGURANÇA
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

            console.log('⚠️ Servidor responde sem auth (não seguro)');
            console.log('⚠️ Status:', response.status);

            // Como sabemos que este servidor não é seguro, retornamos false
            return false;
        } catch (error: any) {
            console.log('✅ Servidor protegido ou erro de conexão');
            return true;
        }
    }

    /**
     * ========================================
     * DETECÇÃO DE ERRO DE REDE
     * ========================================
     */
    private isNetworkError(error: any): boolean {
        return (
            error.code === 'ECONNABORTED' ||
            error.code === 'NETWORK_ERROR' ||
            error.message?.includes('Network Error') ||
            error.message?.includes('timeout')
        );
    }

    /**
     * ========================================
     * MÉTODOS BÁSICOS
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
     * CONFIGURAR CREDENCIAIS VÁLIDAS
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
}

export const authService = AuthService.getInstance();