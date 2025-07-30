// src/store/configStore.ts - VERSÃO OAUTH2 PROTHEUS
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
    testConnection: () => Promise<{ success: boolean; error?: string; data?: any }>;
    setFirstLaunch: (isFirst: boolean) => void;
    setOnboardingCompleted: (completed: boolean) => void;
    resetConfig: () => void;
    canProceedToLogin: () => boolean;
}

const defaultConnection: ConnectionConfig = {
    protocol: 'HTTP',
    address: '',
    port: '17114', // Porta padrão do Protheus
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

            testConnection: async (): Promise<{ success: boolean; error?: string; data?: any }> => {
                const { connection } = get();

                console.log('🔄 Iniciando teste de conexão OAuth2...');
                console.log('📡 Config:', {
                    protocol: connection.protocol,
                    address: connection.address,
                    port: connection.port,
                    endpoint: connection.endpoint,
                });

                set({ isTestingConnection: true });

                try {
                    const result = await restValidator.testConnectionWithFallback({
                        protocol: connection.protocol,
                        address: connection.address,
                        port: connection.port,
                        endpoint: connection.endpoint,
                    });

                    console.log('📊 Resultado do teste:', result);

                    if (result.success) {
                        console.log('✅ Teste de conexão bem-sucedido');
                        console.log('🔗 URL final:', result.url);

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

                        return {
                            success: true,
                            data: {
                                url: result.url,
                                status: result.statusCode,
                                serverData: result.data,
                            }
                        };
                    } else {
                        console.log('❌ Teste de conexão falhou:', result.error);

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
                            error: result.error || 'Falha na conexão OAuth2'
                        };
                    }
                } catch (error) {
                    console.error('❌ Erro durante teste de conexão:', error);

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
                        error: error instanceof Error ? error.message : 'Erro desconhecido na conexão'
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
                console.log('🔄 Resetando configuração...');
                set({
                    connection: defaultConnection,
                    isFirstLaunch: true,
                    onboardingCompleted: false,
                });
            },

            canProceedToLogin: () => {
                const { connection } = get();
                const canProceed = connection.isValid && connection.isConnected && !!connection.baseUrl;

                console.log('🔍 Verificando se pode prosseguir para login:', {
                    isValid: connection.isValid,
                    isConnected: connection.isConnected,
                    hasBaseUrl: !!connection.baseUrl,
                    canProceed,
                });

                return canProceed;
            },
        }),
        {
            name: 'config-storage-oauth2',
            storage: createJSONStorage(() => AsyncStorage),
            // Só persiste se a conexão foi validada com sucesso
            partialize: (state) => ({
                connection: state.connection.isValid ? state.connection : {
                    ...defaultConnection,
                    protocol: state.connection.protocol,
                    address: state.connection.address,
                    port: state.connection.port,
                    endpoint: state.connection.endpoint,
                },
                isFirstLaunch: state.isFirstLaunch,
                onboardingCompleted: state.onboardingCompleted,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    console.log('💾 Configuração carregada do storage:', {
                        address: state.connection?.address,
                        isValid: state.connection?.isValid,
                        isConnected: state.connection?.isConnected,
                        baseUrl: state.connection?.baseUrl,
                    });
                }
            },
        }
    )
);