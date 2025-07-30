// src/hooks/useAuth.ts - VERSÃO CORRIGIDA
import { useEffect, useState } from 'react';
import { authService, AuthType } from '../services/api/authService';
import { httpService } from '../services/api/httpService';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { useConfigStore } from '../store/configStore';
import { useToastStore } from '../store/toastStore';
import type { LoginCredentials, User } from '../types/auth';
import { useBiometric } from './useBiometric';

interface UseAuthOptions {
    autoCheckLogin?: boolean;
    enableBiometric?: boolean;
}

interface LoginOptions {
    keepConnected?: boolean;
    enableBiometric?: boolean;
}

export const useAuth = (options: UseAuthOptions = {}) => {
    const {
        isAuthenticated,
        user,
        selectedBranch,
        selectedModule,
        biometricEnabled,
        login: storeLogin,
        logout: storeLogout,
        setBranch,
        setModule,
        setBiometricEnabled,
    } = useAuthStore();

    const { setLoading, setError, clearError } = useAppStore();
    const { showSuccess, showError, showWarning } = useToastStore();
    const {
        authenticate,
        isAvailable: biometricAvailable,
        isEnrolled: biometricEnrolled,
        getBiometricTypeName
    } = useBiometric();
    const { canProceedToLogin } = useConfigStore();

    // Estados locais
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isCheckingAutoLogin, setIsCheckingAutoLogin] = useState(false);
    const [autoLoginUser, setAutoLoginUser] = useState<any>(null);

    // Verificar auto login na montagem
    useEffect(() => {
        if (options.autoCheckLogin !== false && !isAuthenticated) {
            checkAutoLogin();
        }

        // Sempre atualizar URL base do httpService
        httpService.updateBaseURL();
    }, []);

    /**
     * Verifica se há usuário para auto login
     */
    const checkAutoLogin = async (): Promise<any> => {
        if (isAuthenticated) return null;

        setIsCheckingAutoLogin(true);

        try {
            const autoUser = await authService.checkAutoLogin();

            if (autoUser) {
                setAutoLoginUser(autoUser);
                console.log('✅ Usuário para auto login encontrado:', autoUser.username);
                return autoUser;
            }

            console.log('ℹ️ Nenhum usuário para auto login');
            return null;
        } catch (error) {
            console.error('❌ Erro ao verificar auto login:', error);
            return null;
        } finally {
            setIsCheckingAutoLogin(false);
        }
    };

    /**
     * CORRIGIDO: Realiza login com validação rigorosa
     */
    const login = async (
        credentials: LoginCredentials,
        loginOptions: LoginOptions = {}
    ): Promise<boolean> => {
        // Validação prévia
        if (!canProceedToLogin()) {
            const error = 'Configuração REST não encontrada. Configure a conexão primeiro.';
            setError(error);
            showError(`❌ ${error}`);
            return false;
        }

        if (!credentials.username?.trim()) {
            showError('❌ Nome de usuário é obrigatório');
            return false;
        }

        if (!credentials.password?.trim()) {
            showError('❌ Senha é obrigatória');
            return false;
        }

        setIsLoggingIn(true);
        setLoading(true);
        clearError();

        console.log('🔄 Iniciando processo de login...');
        console.log('👤 Usuário:', credentials.username);
        console.log('🔒 Manter conectado:', loginOptions.keepConnected);

        try {
            // Atualizar URL base
            httpService.updateBaseURL();

            // 1. Verificar segurança do servidor
            showSuccess('🔒 Verificando segurança do servidor...');
            const isSecure = await authService.checkSecurity();

            if (!isSecure) {
                const error = 'Servidor não está seguro. Configure autenticação no servidor.';
                setError(error);
                showError(`❌ ${error}`);
                console.error('❌ Servidor não seguro - ping funcionou');
                return false;
            }

            console.log('✅ Servidor seguro confirmado');

            // 2. Realizar o login no servidor
            showSuccess('🔐 Validando credenciais no servidor...');

            const authUser = await authService.signIn({
                username: credentials.username.trim(),
                password: credentials.password,
                keepConnected: loginOptions.keepConnected || false,
            });

            console.log('✅ Login no servidor bem-sucedido');
            console.log('🔐 Tipo:', authUser.authType);
            console.log('👤 Usuário:', authUser.username);

            // 3. Converter para formato do store
            const storeUser: User = {
                id: authUser.username,
                username: authUser.username,
                name: authUser.username, // Pode ser melhorado com dados do servidor
                email: '', // Pode ser obtido do servidor
            };

            // 4. Salvar no store
            storeLogin(storeUser);

            // 5. Configurar biometria se solicitado
            if (loginOptions.enableBiometric && biometricAvailable && biometricEnrolled) {
                try {
                    showSuccess('🔒 Configurando biometria...');
                    const biometricSuccess = await authenticate();

                    if (biometricSuccess) {
                        setBiometricEnabled(true);
                        showSuccess('✅ Biometria configurada com sucesso!');
                        console.log('✅ Biometria habilitada');
                    } else {
                        showWarning('⚠️ Biometria não configurada (pode configurar depois)');
                        console.warn('⚠️ Usuário cancelou configuração de biometria');
                    }
                } catch (biometricError) {
                    console.warn('⚠️ Erro ao configurar biometria:', biometricError);
                    showWarning('⚠️ Erro ao configurar biometria (pode tentar depois)');
                }
            }

            showSuccess('🎉 Login realizado com sucesso!');
            clearError();
            return true;

        } catch (error: any) {
            console.error('❌ Erro no login:', error);

            let errorMessage = 'Erro na autenticação';

            // Tratar diferentes tipos de erro
            if (error.message) {
                errorMessage = error.message;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 401) {
                errorMessage = 'Usuário ou senha incorretos';
            } else if (error.response?.status === 403) {
                errorMessage = 'Usuário sem permissão de acesso';
            } else if (error.code === 'NETWORK_ERROR') {
                errorMessage = 'Erro de conexão com o servidor';
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Timeout na conexão (servidor demorou para responder)';
            }

            setError(errorMessage);
            showError(`❌ ${errorMessage}`);
            return false;
        } finally {
            setIsLoggingIn(false);
            setLoading(false);
        }
    };

    /**
     * CORRIGIDO: Auto login mais rigoroso
     */
    const performAutoLogin = async (autoUser?: any): Promise<boolean> => {
        const userToLogin = autoUser || autoLoginUser;

        if (!userToLogin || !userToLogin.password) {
            console.warn('⚠️ Dados insuficientes para auto login');
            showError('❌ Dados de auto login não disponíveis');
            return false;
        }

        console.log('🔄 Executando auto login para:', userToLogin.username);
        showSuccess('🔄 Fazendo login automático...');

        // Usar as mesmas validações do login normal
        return await login({
            username: userToLogin.username,
            password: userToLogin.password,
        }, {
            keepConnected: true,
        });
    };

    /**
     * Login usando biometria
     */
    const biometricLogin = async (): Promise<boolean> => {
        if (!biometricEnabled || !biometricAvailable || !biometricEnrolled) {
            const error = 'Autenticação biométrica não disponível ou não configurada';
            showError(`❌ ${error}`);
            return false;
        }

        if (!autoLoginUser) {
            const error = 'Nenhum usuário salvo para autenticação biométrica';
            showError(`❌ ${error}`);
            return false;
        }

        try {
            console.log('🔄 Iniciando login biométrico...');
            showSuccess(`🔒 Autentique-se com ${getBiometricTypeName()}...`);

            const biometricSuccess = await authenticate();

            if (biometricSuccess) {
                console.log('✅ Biometria confirmada, executando auto login...');
                return await performAutoLogin(autoLoginUser);
            } else {
                showError('❌ Falha na autenticação biométrica');
                return false;
            }
        } catch (error) {
            console.error('❌ Erro na biometria:', error);
            showError('❌ Erro na autenticação biométrica');
            return false;
        }
    };

    /**
     * Habilita autenticação biométrica
     */
    const enableBiometric = async (): Promise<boolean> => {
        if (!biometricAvailable || !biometricEnrolled) {
            const error = 'Autenticação biométrica não disponível neste dispositivo';
            setError(error);
            showError(`❌ ${error}`);
            return false;
        }

        try {
            console.log('🔄 Configurando biometria...');
            const success = await authenticate();

            if (success) {
                setBiometricEnabled(true);
                showSuccess('✅ Autenticação biométrica habilitada!');
                console.log('✅ Biometria habilitada');
                return true;
            } else {
                showError('❌ Falha ao configurar autenticação biométrica');
                return false;
            }
        } catch (error) {
            const errorMessage = 'Erro ao configurar autenticação biométrica';
            console.error('❌', errorMessage, error);
            setError(errorMessage);
            showError(`❌ ${errorMessage}`);
            return false;
        }
    };

    /**
     * Desabilita autenticação biométrica
     */
    const disableBiometric = () => {
        setBiometricEnabled(false);
        showSuccess('✅ Autenticação biométrica desabilitada');
        console.log('ℹ️ Biometria desabilitada');
    };

    /**
     * Faz logout do usuário
     */
    const logout = async (): Promise<void> => {
        try {
            console.log('🔄 Fazendo logout...');

            // Logout no authService (limpa storage)
            await authService.signOut();

            // Logout no store (limpa estado)
            storeLogout();

            // Limpar estados locais
            setAutoLoginUser(null);
            clearError();

            showSuccess('👋 Logout realizado com sucesso');
            console.log('✅ Logout completo');
        } catch (error) {
            console.error('❌ Erro no logout:', error);
            // Mesmo com erro, força logout local
            storeLogout();
            setAutoLoginUser(null);
            clearError();
        }
    };

    /**
     * Refresh token (para OAUTH2)
     */
    const refreshToken = async (): Promise<boolean> => {
        try {
            const currentUser = await authService.getCurrentUser();

            if (currentUser?.authType === AuthType.OAUTH2) {
                console.log('🔄 Renovando token...');
                await authService.refreshToken();
                console.log('✅ Token renovado');
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Erro ao renovar token:', error);
            return false;
        }
    };

    /**
     * Verifica status da autenticação
     */
    const checkAuthStatus = async (): Promise<boolean> => {
        try {
            const currentUser = await authService.getCurrentUser();
            const hasValidAuth = !!currentUser && isAuthenticated;

            console.log('ℹ️ Status auth:', hasValidAuth ? '✅ Válido' : '❌ Inválido');
            return hasValidAuth;
        } catch (error) {
            console.error('❌ Erro ao verificar status auth:', error);
            return false;
        }
    };

    /**
     * NOVO: Testa credenciais sem fazer login completo
     */
    const testCredentials = async (credentials: LoginCredentials): Promise<boolean> => {
        if (!canProceedToLogin()) {
            return false;
        }

        try {
            console.log('🧪 Testando credenciais...');

            // Faz login de teste
            await authService.signIn({
                username: credentials.username,
                password: credentials.password,
                keepConnected: false, // Não salvar
            });

            // Se chegou aqui, credenciais são válidas
            console.log('✅ Credenciais válidas');

            // Fazer logout imediato para não afetar estado
            await authService.signOut();

            return true;
        } catch (error) {
            console.log('❌ Credenciais inválidas:', error);
            return false;
        }
    };

    return {
        // Estados
        isAuthenticated,
        user,
        selectedBranch,
        selectedModule,
        biometricEnabled,
        biometricAvailable,
        biometricEnrolled,
        isLoggingIn,
        isCheckingAutoLogin,
        autoLoginUser,
        getBiometricTypeName,

        // Ações principais
        login,
        logout,
        biometricLogin,
        performAutoLogin,

        // Configurações
        enableBiometric,
        disableBiometric,
        setBranch,
        setModule,

        // Utilitários
        checkAutoLogin,
        refreshToken,
        checkAuthStatus,
        testCredentials, // NOVO
        canProceedToLogin: canProceedToLogin(),
    };
};