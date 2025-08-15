// src/store/dashboardConfigStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { DocumentType } from '../types/approvals';

interface DashboardConfigState {
    enabledCards: DocumentType[];
    isLoading: boolean;

    // Ações
    loadConfig: () => Promise<void>;
    setEnabledCards: (cards: DocumentType[]) => Promise<void>;
    toggleCard: (cardType: DocumentType) => Promise<void>;
    resetToDefault: () => Promise<void>;
    isCardEnabled: (cardType: DocumentType) => boolean;
}

// Configuração padrão - todos os cards habilitados
const DEFAULT_ENABLED_CARDS: DocumentType[] = ['PC', 'IP', 'AE', 'SC'];

// Chave para persistência no AsyncStorage
const STORAGE_KEY = '@dashboard_config';

export const useDashboardConfigStore = create<DashboardConfigState>((set, get) => ({
    enabledCards: DEFAULT_ENABLED_CARDS,
    isLoading: false,

    loadConfig: async () => {
        set({ isLoading: true });

        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);

            if (stored) {
                const config = JSON.parse(stored);
                set({
                    enabledCards: config.enabledCards || DEFAULT_ENABLED_CARDS,
                    isLoading: false
                });
            } else {
                // Primeira vez - salva configuração padrão
                await get().setEnabledCards(DEFAULT_ENABLED_CARDS);
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('Erro ao carregar configuração do dashboard:', error);
            set({
                enabledCards: DEFAULT_ENABLED_CARDS,
                isLoading: false
            });
        }
    },

    setEnabledCards: async (cards: DocumentType[]) => {
        try {
            const config = { enabledCards: cards };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
            set({ enabledCards: cards });
        } catch (error) {
            console.error('Erro ao salvar configuração do dashboard:', error);
        }
    },

    toggleCard: async (cardType: DocumentType) => {
        const state = get();
        const currentCards = state.enabledCards;

        const newCards = currentCards.includes(cardType)
            ? currentCards.filter(type => type !== cardType)
            : [...currentCards, cardType];

        await state.setEnabledCards(newCards);
    },

    resetToDefault: async () => {
        await get().setEnabledCards(DEFAULT_ENABLED_CARDS);
    },

    isCardEnabled: (cardType: DocumentType) => {
        return get().enabledCards.includes(cardType);
    }
}));