import { create } from 'zustand';

interface AppState {
    isLoading: boolean;
    error: string | null;

    // Actions
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
    isLoading: false,
    error: null,

    setLoading: (loading: boolean) => {
        set({ isLoading: loading });
    },

    setError: (error: string | null) => {
        set({ error });
    },

    clearError: () => {
        set({ error: null });
    },
}));