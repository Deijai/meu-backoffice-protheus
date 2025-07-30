import { useEffect, useState } from 'react';
import { authService } from '../services/api/authService';
import { httpService } from '../services/api/httpService';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { useConfigStore } from '../store/configStore';
import { useToastStore } from '../store/toastStore';
import type { LoginCredentials, User } from '../types/auth';
import { useBiometric } from './useBiometric';

export const useAuth = () => {
    const {
        isAuthenticated,
        user,
        selectedBranch,
        selectedModule,
        biometricEnabled,
        login,
        logout,
        setBranch,
        setModule,
        setBiometricEnabled,
    } = useAuthStore();

    const { setLoading, setError } = useAppStore();
    const { showSuccess, showError } = useToastStore();
    const { authenticate, isAvailable: biometricAvailable } = useBiometric();
    const { canProceedToLogin } = useConfigStore();
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    useEffect(() => {
        httpService.updateBaseURL();
    }, []);

    const handleLogin = async (credentials: LoginCredentials): Promise<boolean> => {
        if (!canProceedToLogin()) {
            setError('Configuração REST não encontrada. Configure a conexão primeiro.');
            return false;
        }

        setIsLoggingIn(true);
        setLoading(true);
        setError(null);

        try {
            // Verifica segurança do servidor
            const isSecure = await authService.checkSecurity();
            if (!isSecure) {
                setError('Servidor não está seguro. Verifique as configurações.');
                showError('❌ Servidor não está seguro');
                return false;
            }

            // Realiza o login
            const authUser = await authService.signIn(credentials);

            // Converte AuthUser para User do store
            const storeUser: User = {
                id: authUser.username,
                username: authUser.username,
                name: authUser.username, // Pode ser melhorado com dados do servidor
            };

            login(storeUser);
            showSuccess('✅ Login realizado com sucesso!');
            setError(null);
            return true;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro na autenticação';
            setError(errorMessage);
            showError(`❌ ${errorMessage}`);
            return false;
        } finally {
            setIsLoggingIn(false);
            setLoading(false);
        }
    };

    const handleBiometricLogin = async (): Promise<boolean> => {
        if (!biometricEnabled || !biometricAvailable) {
            return false;
        }

        try {
            const success = await authenticate();

            if (success && user) {
                // Usuário já autenticado previamente, apenas validar biometria
                return true;
            }

            return false;
        } catch (error) {
            console.error('Erro na autenticação biométrica:', error);
            return false;
        }
    };

    const handleLogout = () => {
        logout();
        setError(null);
    };

    const enableBiometric = async (): Promise<boolean> => {
        if (!biometricAvailable) {
            setError('Autenticação biométrica não disponível');
            return false;
        }

        try {
            const success = await authenticate();

            if (success) {
                setBiometricEnabled(true);
                return true;
            }

            return false;
        } catch (error) {
            setError('Erro ao configurar autenticação biométrica');
            return false;
        }
    };

    return {
        isAuthenticated,
        user,
        selectedBranch,
        selectedModule,
        biometricEnabled,
        biometricAvailable,
        isLoggingIn,

        // Actions
        login: handleLogin,
        logout: handleLogout,
        biometricLogin: handleBiometricLogin,
        enableBiometric,
        setBranch,
        setModule,
    };
};