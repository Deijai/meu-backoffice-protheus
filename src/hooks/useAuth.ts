import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
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
    const { authenticate, isAvailable: biometricAvailable } = useBiometric();
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async (credentials: LoginCredentials): Promise<boolean> => {
        setIsLoggingIn(true);
        setLoading(true);
        setError(null);

        try {
            // Simular chamada de API - substituir por implementação real
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Mock user - substituir por dados reais da API
            const mockUser: User = {
                id: '1',
                username: credentials.username,
                name: 'Usuário Teste',
                email: 'usuario@teste.com',
            };

            // Simular validação de credenciais
            if (credentials.username === 'admin' && credentials.password === '123456') {
                login(mockUser);
                setError(null);
                return true;
            } else {
                setError('Usuário ou senha inválidos');
                return false;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro na autenticação';
            setError(errorMessage);
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