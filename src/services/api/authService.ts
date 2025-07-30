// src/services/api/authService.ts
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

export interface PingResponse {
    status: number;
    message?: string;
}

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
     * Realiza login do usuário
     */
    async signIn(credentials: LoginCredentials): Promise<AuthUser> {
        const { connection } = useConfigStore.getState();

        if (!connection.baseUrl) {
            throw new Error('Configuração REST não encontrada');
        }

        // Determina o tipo de autenticação baseado no protocolo
        this.authType = connection.protocol === 'HTTPS' ? AuthType.OAUTH2 : AuthType.BASIC;

        if (this.authType === AuthType.OAUTH2) {
            return this.signInOAuth2(credentials);
        } else {
            return this.signInBasic(credentials);
        }
    }

    /**
     * Autenticação BASIC
     */
    private async signInBasic(credentials: LoginCredentials): Promise<AuthUser> {
        const { connection } = useConfigStore.getState();

        try {
            // Gera o header de autorização básica
            const authHeader = this.generateBasicAuth(credentials.username, credentials.password);

            // Faz a requisição para o healthcheck
            const response = await this.axiosInstance.get(`${connection.baseUrl}/healthcheck`, {
                headers: {
                    'Authorization': `Basic ${authHeader}`,
                },
            });

            // Processa o usuário autenticado
            return this.handleBasicUserSignIn({
                ...response.data,
                username: credentials.username,
                password: credentials.password,
                keepConnected: credentials.keepConnected || false,
                lastLogin: new Date().toISOString(),
            });

        } catch (error) {
            console.error('Erro no login BASIC:', error);
            // Tenta login offline se falhar
            return this.signInBasicOffline(credentials);
        }
    }

    /**
     * Autenticação OAUTH2
     */
    private async signInOAuth2(credentials: LoginCredentials): Promise<AuthUser> {
        const { connection } = useConfigStore.getState();

        const formData = new URLSearchParams();
        formData.append('grant_type', 'password');
        formData.append('username', credentials.username);
        formData.append('password', credentials.password);

        try {
            const response = await this.axiosInstance.post(
                `${connection.baseUrl}/api/oauth2/v1/token`,
                formData.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            return this.handleOAuth2UserSignIn({
                ...response.data,
                username: credentials.username,
                password: credentials.password,
                keepConnected: credentials.keepConnected || false,
                lastLogin: new Date().toISOString(),
            });

        } catch (error) {
            console.error('Erro no login OAUTH2:', error);
            // Tenta login offline se falhar
            return this.signInOAuth2Offline(credentials);
        }
    }

    /**
     * Processa usuário autenticado via BASIC
     */
    private async handleBasicUserSignIn(userData: any): Promise<AuthUser> {
        const users = await this.getStoredUsers();
        const cryptedPassword = sha256(userData.password);

        let user = users.find(u =>
            u.username === userData.username &&
            u.cryptedPassword === cryptedPassword
        );

        if (user) {
            // Atualiza usuário existente
            user.cryptedPassword = cryptedPassword;
            user.keepConnected = userData.keepConnected;
            user.lastLogin = userData.lastLogin;

            if (user.keepConnected) {
                user.password = userData.password;
            }
        } else {
            // Cria novo usuário
            user = {
                username: userData.username,
                cryptedPassword,
                keepConnected: userData.keepConnected,
                lastLogin: userData.lastLogin,
                authType: AuthType.BASIC,
            };

            if (user.keepConnected) {
                user.password = userData.password;
            }

            users.push(user);
        }

        // Salva no storage
        await this.saveUsers(users);

        // Define como usuário atual
        if (user.keepConnected) {
            await this.keepUser(user);
        }

        this.currentUser = user;
        return user;
    }

    /**
     * Processa usuário autenticado via OAUTH2
     */
    private async handleOAuth2UserSignIn(tokenData: any): Promise<AuthUser> {
        const users = await this.getStoredUsers();
        const cryptedPassword = sha256(tokenData.password);

        let user = users.find(u => u.username === tokenData.username);

        if (user) {
            // Atualiza usuário existente
            user.cryptedPassword = cryptedPassword;
            user.access_token = tokenData.access_token;
            user.refresh_token = tokenData.refresh_token;
            user.keepConnected = tokenData.keepConnected;
            user.lastLogin = tokenData.lastLogin;

            if (user.keepConnected) {
                user.password = tokenData.password;
            }
        } else {
            // Cria novo usuário
            user = {
                username: tokenData.username,
                cryptedPassword,
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                keepConnected: tokenData.keepConnected,
                lastLogin: tokenData.lastLogin,
                authType: AuthType.OAUTH2,
            };

            if (user.keepConnected) {
                user.password = tokenData.password;
            }

            users.push(user);
        }

        // Salva no storage
        await this.saveUsers(users);

        // Define como usuário atual
        if (user.keepConnected) {
            await this.keepUser(user);
        }

        this.currentUser = user;
        return user;
    }

    /**
     * Login offline para BASIC
     */
    private async signInBasicOffline(credentials: LoginCredentials): Promise<AuthUser> {
        const users = await this.getStoredUsers();
        const cryptedPassword = sha256(credentials.password);

        const user = users.find(u =>
            u.username === credentials.username &&
            u.cryptedPassword === cryptedPassword
        );

        if (user) {
            if (credentials.keepConnected) {
                user.password = credentials.password;
                await this.keepUser(user);
            }

            this.currentUser = user;
            return user;
        }

        throw new Error('Não foi possível fazer a autenticação desse usuário sem conexão com o Protheus');
    }

    /**
     * Login offline para OAUTH2
     */
    private async signInOAuth2Offline(credentials: LoginCredentials): Promise<AuthUser> {
        const users = await this.getStoredUsers();
        const cryptedPassword = sha256(credentials.password);

        const user = users.find(u =>
            u.username === credentials.username &&
            u.cryptedPassword === cryptedPassword
        );

        if (user) {
            if (credentials.keepConnected) {
                user.password = credentials.password;
                await this.keepUser(user);
            }

            this.currentUser = user;
            return user;
        }

        throw new Error('Não foi possível fazer a autenticação desse usuário sem conexão com o Protheus');
    }

    /**
     * Refresh token para OAUTH2
     */
    async refreshToken(): Promise<AuthUser> {
        if (this.authType !== AuthType.OAUTH2 || !this.currentUser?.refresh_token) {
            throw new Error('Refresh token não disponível');
        }

        const { connection } = useConfigStore.getState();
        const formData = new URLSearchParams();
        formData.append('grant_type', 'refresh_token');
        formData.append('refresh_token', this.currentUser.refresh_token);

        try {
            const response = await this.axiosInstance.post(
                `${connection.baseUrl}/api/oauth2/v1/token`,
                formData.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            const tokenData = response.data;

            // Atualiza o token
            this.currentUser.access_token = tokenData.access_token;
            if (tokenData.refresh_token) {
                this.currentUser.refresh_token = tokenData.refresh_token;
            }

            // Atualiza no storage
            const users = await this.getStoredUsers();
            const userIndex = users.findIndex(u => u.username === this.currentUser!.username);
            if (userIndex >= 0) {
                users[userIndex] = this.currentUser;
                await this.saveUsers(users);
            }

            console.log('✅ Token renovado com sucesso');
            return this.currentUser;

        } catch (error) {
            console.error('❌ Erro ao renovar token:', error);
            throw new Error('Falha ao renovar token de acesso');
        }
    }

    /**
     * Verifica segurança do servidor (ping)
     */
    async checkSecurity(): Promise<boolean> {
        const { connection } = useConfigStore.getState();

        try {
            await this.axiosInstance.get(`${connection.baseUrl}/ping`, {
                timeout: 10000,
            });

            // Se conseguiu fazer o ping, não é seguro
            return false;
        } catch (error) {
            // Se falhou no ping, é seguro (provavelmente 401)
            return true;
        }
    }

    /**
     * Logout do usuário
     */
    async signOut(): Promise<void> {
        this.currentUser = null;
        await asyncStorageService.removeItem('user');
        console.log('🚪 Logout realizado');
    }

    /**
     * Obtém usuário logado
     */
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

    /**
     * Verifica se há usuário com login automático
     */
    async checkAutoLogin(): Promise<AuthUser | null> {
        const users = await this.getStoredUsers();

        if (users.length === 0) return null;

        // Ordena por último login e pega o mais recente
        const sortedUsers = users.sort((a, b) =>
            new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime()
        );

        const lastUser = sortedUsers[0];

        // Verifica se tem dados para auto login
        if (lastUser.keepConnected && lastUser.password) {
            return lastUser;
        }

        return null;
    }

    /**
     * Gera header de autenticação básica
     */
    private generateBasicAuth(username: string, password: string): string {
        return btoa(`${username}:${password}`);
    }

    /**
     * Obtém token de autorização atual
     */
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

    /**
     * Obtém tipo de autenticação atual
     */
    getAuthType(): AuthType {
        return this.authType;
    }

    /**
     * Utilitários de storage
     */
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
}

export const authService = AuthService.getInstance();