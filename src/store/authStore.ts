// src/store/authStore.ts - PERSISTÊNCIA CORRIGIDA
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { asyncStorageService } from '../services/storage/asyncStorage';
import { AppBranch } from '../types/protheus';

interface User {
    id: string;
    username: string;
    email?: string;
    name?: string;
}

interface Branch {
    id: string;
    code: string;
    name: string;
    location: string;
    description?: string;
}

interface Module {
    id: string;
    code: string;
    name: string;
    icon: string;
    description: string;
    color?: string;
}

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    selectedBranch: Branch | null;
    selectedModule: Module | null;
    biometricEnabled: boolean;

    // Actions
    login: (user: User) => void;
    logout: () => void;
    setBranch: (branch: AppBranch | Branch) => void;
    setModule: (module: Module) => void;
    setBiometricEnabled: (enabled: boolean) => void;

    // *** NOVOS MÉTODOS PARA GARANTIR PERSISTÊNCIA ***
    saveBranchToStorage: (branch: Branch) => Promise<void>;
    saveModuleToStorage: (module: Module) => Promise<void>;
    loadFromStorage: () => Promise<void>;
    clearAuthStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            user: null,
            selectedBranch: null,
            selectedModule: null,
            biometricEnabled: false,

            login: (user: User) => {
                console.log('🔐 Login no store:', user.username);
                set({ isAuthenticated: true, user });
            },

            logout: () => {
                console.log('🚪 Logout do store');
                set({
                    isAuthenticated: false,
                    user: null,
                    selectedBranch: null,
                    selectedModule: null,
                });

                // Também limpar do AsyncStorage diretamente
                get().clearAuthStorage().catch(console.error);
            },

            setBranch: (branch: AppBranch | Branch) => {
                console.log('🏢 Salvando filial no store:', branch.name);

                const branchData: Branch = {
                    id: branch.id,
                    code: branch.code,
                    name: branch.name,
                    location: branch.location,
                    description: branch.description,
                };

                set({ selectedBranch: branchData });

                // *** SALVAR TAMBÉM NO ASYNCSTORAGE DIRETAMENTE ***
                get().saveBranchToStorage(branchData).catch(console.error);
            },

            setModule: (module: Module) => {
                console.log('🔧 Salvando módulo no store:', module.name);
                set({ selectedModule: module });

                // *** SALVAR TAMBÉM NO ASYNCSTORAGE DIRETAMENTE ***
                get().saveModuleToStorage(module).catch(console.error);
            },

            setBiometricEnabled: (enabled: boolean) => {
                console.log('🔒 Configurando biometria:', enabled);
                set({ biometricEnabled: enabled });
            },

            // *** NOVOS MÉTODOS DE PERSISTÊNCIA ***
            saveBranchToStorage: async (branch: Branch) => {
                try {
                    console.log('💾 Salvando filial no AsyncStorage:', branch.name);
                    await asyncStorageService.setItem('selected_branch', branch);
                    console.log('✅ Filial salva no AsyncStorage');
                } catch (error) {
                    console.error('❌ Erro ao salvar filial no AsyncStorage:', error);
                }
            },

            saveModuleToStorage: async (module: Module) => {
                try {
                    console.log('💾 Salvando módulo no AsyncStorage:', module.name);
                    await asyncStorageService.setItem('selected_module', module);
                    console.log('✅ Módulo salvo no AsyncStorage');
                } catch (error) {
                    console.error('❌ Erro ao salvar módulo no AsyncStorage:', error);
                }
            },

            loadFromStorage: async () => {
                try {
                    console.log('📂 Carregando dados adicionais do AsyncStorage...');

                    // Carregar filial
                    const savedBranch = await asyncStorageService.getItem<Branch>('selected_branch');
                    if (savedBranch) {
                        console.log('📂 Filial carregada do AsyncStorage:', savedBranch.name);
                        set({ selectedBranch: savedBranch });
                    }

                    // Carregar módulo
                    const savedModule = await asyncStorageService.getItem<Module>('selected_module');
                    if (savedModule) {
                        console.log('📂 Módulo carregado do AsyncStorage:', savedModule.name);
                        set({ selectedModule: savedModule });
                    }

                    console.log('✅ Dados adicionais carregados');
                } catch (error) {
                    console.error('❌ Erro ao carregar dados do AsyncStorage:', error);
                }
            },

            clearAuthStorage: async () => {
                try {
                    console.log('🗑️ Limpando dados do AsyncStorage...');
                    await asyncStorageService.multiRemove([
                        'selected_branch',
                        'selected_module',
                        'auth-storage' // Key do persist do Zustand
                    ]);
                    console.log('✅ Dados limpos do AsyncStorage');
                } catch (error) {
                    console.error('❌ Erro ao limpar AsyncStorage:', error);
                }
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),

            // *** CONFIGURAÇÃO MELHORADA DO PERSIST ***
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated,
                user: state.user,
                selectedBranch: state.selectedBranch,
                selectedModule: state.selectedModule,
                biometricEnabled: state.biometricEnabled,
            }),

            onRehydrateStorage: () => (state) => {
                if (state) {
                    console.log('💧 Dados reidratados do Zustand persist:', {
                        isAuthenticated: state.isAuthenticated,
                        user: state.user?.username,
                        branch: state.selectedBranch?.name,
                        module: state.selectedModule?.name,
                    });

                    // Carregar dados adicionais do AsyncStorage
                    state.loadFromStorage().catch(console.error);
                }
            },
        }
    )
);