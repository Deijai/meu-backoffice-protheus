// src/store/dashboardConfigStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { DocumentType } from '../types/approvals';
import { getDocumentTypesForModule, hasDocumentsForApproval } from '../types/approvals';
import { useAuthStore } from './authStore';

interface DashboardConfigState {
    // Configuração de cards habilitados para o módulo atual
    enabledCards: DocumentType[];

    // Estados de carregamento
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;

    // Ações
    loadConfig: () => Promise<void>;
    toggleCard: (cardType: DocumentType) => Promise<void>;
    resetToDefault: () => Promise<void>;

    // Getters
    isCardEnabled: (cardType: DocumentType) => boolean;
    getAvailableCards: () => DocumentType[];
    getCurrentModuleCode: () => string | null;
}

const STORAGE_KEY = '@dashboard_config';

export const useDashboardConfigStore = create<DashboardConfigState>((set, get) => ({
    enabledCards: [],
    isLoading: false,
    error: null,
    isInitialized: false,

    getCurrentModuleCode: () => {
        const authStore = useAuthStore.getState();
        return authStore.selectedModule?.code || null;
    },

    getAvailableCards: () => {
        const moduleCode = get().getCurrentModuleCode();
        if (!moduleCode) return [];

        return getDocumentTypesForModule(moduleCode);
    },

    loadConfig: async () => {
        const state = get();

        // Evita recarregar se já foi inicializado
        if (state.isInitialized) {
            return;
        }

        set({ isLoading: true, error: null });

        try {
            const moduleCode = state.getCurrentModuleCode();

            if (!moduleCode) {
                console.warn('Nenhum módulo selecionado');
                set({
                    enabledCards: [],
                    isLoading: false,
                    isInitialized: true
                });
                return;
            }

            // Verifica se o módulo tem documentos para aprovação
            if (!hasDocumentsForApproval(moduleCode)) {
                console.log(`Módulo ${moduleCode} não tem documentos de aprovação`);
                set({
                    enabledCards: [],
                    isLoading: false,
                    isInitialized: true
                });
                return;
            }

            // Carrega configuração salva
            const storageKey = `${STORAGE_KEY}_${moduleCode}`;
            const stored = await AsyncStorage.getItem(storageKey);

            if (stored) {
                const savedConfig = JSON.parse(stored);
                const availableCards = getDocumentTypesForModule(moduleCode);

                // Filtra apenas cards válidos para o módulo atual
                const validCards = savedConfig.enabledCards?.filter((card: DocumentType) =>
                    availableCards.includes(card)
                ) || [];

                set({
                    enabledCards: validCards,
                    isLoading: false,
                    isInitialized: true
                });
            } else {
                // Primeira execução - ativa todos os cards por padrão
                const defaultCards = getDocumentTypesForModule(moduleCode);
                const config = { enabledCards: defaultCards };

                await AsyncStorage.setItem(storageKey, JSON.stringify(config));
                set({
                    enabledCards: defaultCards,
                    isLoading: false,
                    isInitialized: true
                });
            }
        } catch (error) {
            console.error('Erro ao carregar configuração do dashboard:', error);
            set({
                error: 'Falha ao carregar configuração do dashboard',
                isLoading: false,
                isInitialized: true
            });
        }
    },

    toggleCard: async (cardType: DocumentType) => {
        const { enabledCards, getCurrentModuleCode } = get();
        const moduleCode = getCurrentModuleCode();

        if (!moduleCode) {
            console.error('Nenhum módulo selecionado');
            return;
        }

        const availableCards = getDocumentTypesForModule(moduleCode);

        // Verifica se o card é válido para o módulo atual
        if (!availableCards.includes(cardType)) {
            console.error(`Card ${cardType} não é válido para o módulo ${moduleCode}`);
            return;
        }

        const newEnabledCards = enabledCards.includes(cardType)
            ? enabledCards.filter(type => type !== cardType)
            : [...enabledCards, cardType];

        try {
            const storageKey = `${STORAGE_KEY}_${moduleCode}`;
            const config = { enabledCards: newEnabledCards };

            await AsyncStorage.setItem(storageKey, JSON.stringify(config));
            set({ enabledCards: newEnabledCards });
        } catch (error) {
            console.error('Erro ao salvar configuração do card:', error);
            set({ error: 'Falha ao salvar configuração do card' });
        }
    },

    resetToDefault: async () => {
        const moduleCode = get().getCurrentModuleCode();

        if (!moduleCode) {
            console.error('Nenhum módulo selecionado');
            return;
        }

        const defaultCards = getDocumentTypesForModule(moduleCode);

        try {
            const storageKey = `${STORAGE_KEY}_${moduleCode}`;
            const config = { enabledCards: defaultCards };

            await AsyncStorage.setItem(storageKey, JSON.stringify(config));
            set({ enabledCards: defaultCards });
        } catch (error) {
            console.error('Erro ao resetar configuração:', error);
            set({ error: 'Falha ao resetar configuração' });
        }
    },

    // Getters
    isCardEnabled: (cardType: DocumentType) => {
        const { enabledCards } = get();
        return enabledCards.includes(cardType);
    }
}));