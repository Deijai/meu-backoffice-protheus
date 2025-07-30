import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { restValidator } from '../services/api/restValidator';

interface ConnectionConfig {
    protocol: 'HTTP' | 'HTTPS';
    address: string;
    port: string;
    endpoint: string;
    isValid: boolean;
    isConnected: boolean;
    lastConnectionTest?: Date;
    baseUrl?: string; // URL completa construída após sucesso
}

interface ConfigState {
    connection: ConnectionConfig;
    isFirstLaunch: boolean;
    onboardingCompleted: boolean;
    isTestingConnection: boolean;

    // Actions
    setConnection: (config: Partial<ConnectionConfig>) => void;
    testConnection: () => Promise<{ success: boolean; error?: string }>;
    setFirstLaunch: (isFirst: boolean) => void;
    setOnboardingCompleted: (completed: boolean) => void;
    resetConfig: () => void;
    canProceedToLogin: () => boolean;
}

const defaultConnection: ConnectionConfig = {
    protocol: 'HTTP',
    address: '',
    port: '',
    endpoint: 'rest',
    isValid: false,
    isConnected: false,
};

export const useConfigStore = create<ConfigState>()(
    persist(
        (set, get) => ({
            connection: defaultConnection,
            isFirstLaunch: true,
            onboardingCompleted: false,
            isTestingConnection: false,

            setConnection: (config: Partial<ConnectionConfig>) => {
                set((state) => ({
                    connection: {
                        ...state.connection,
                        ...config,
                        // Reset validation status when config changes
                        isValid: false,
                        isConnected: false,
                        baseUrl: undefined,
                    },
                }));
            },

            testConnection: async (): Promise<{ success: boolean; error?: string }> => {
                const { connection } = get();

                set({ isTestingConnection: true });

                try {
                    const result = await restValidator.testConnectionWithFallback({
                        protocol: connection.protocol,
                        address: connection.address,
                        port: connection.port,
                        endpoint: connection.endpoint,
                    });

                    if (result.success) {
                        // Só salva no storage se a conexão foi bem-sucedida
                        set((state) => ({
                            connection: {
                                ...state.connection,
                                isValid: true,
                                isConnected: true,
                                lastConnectionTest: new Date(),
                                baseUrl: result.url,
                            },
                            isTestingConnection: false,
                        }));

                        return { success: true };
                    } else {
                        // Não salva no storage se falhou
                        set((state) => ({
                            connection: {
                                ...state.connection,
                                isValid: false,
                                isConnected: false,
                            },
                            isTestingConnection: false,
                        }));

                        return {
                            success: false,
                            error: result.error || 'Falha na conexão'
                        };
                    }
                } catch (error) {
                    set((state) => ({
                        connection: {
                            ...state.connection,
                            isValid: false,
                            isConnected: false,
                        },
                        isTestingConnection: false,
                    }));

                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Erro desconhecido'
                    };
                }
            },

            setFirstLaunch: (isFirst: boolean) => {
                set({ isFirstLaunch: isFirst });
            },

            setOnboardingCompleted: (completed: boolean) => {
                set({ onboardingCompleted: completed });
            },

            resetConfig: () => {
                set({
                    connection: defaultConnection,
                    isFirstLaunch: true,
                    onboardingCompleted: false,
                });
            },

            canProceedToLogin: () => {
                const { connection } = get();
                return connection.isValid && connection.isConnected && !!connection.baseUrl;
            },
        }),
        {
            name: 'config-storage',
            storage: createJSONStorage(() => AsyncStorage),
            // Só persiste se a conexão foi validada com sucesso
            partialize: (state) => ({
                connection: state.connection.isValid ? state.connection : defaultConnection,
                isFirstLaunch: state.isFirstLaunch,
                onboardingCompleted: state.onboardingCompleted,
            }),
        }
    )
);