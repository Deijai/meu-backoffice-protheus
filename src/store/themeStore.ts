import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { darkTheme, lightTheme, Theme } from '../styles/theme';

interface ThemeState {
    isDark: boolean;
    theme: Theme;
    isInitialized: boolean;
    toggleTheme: () => void;
    setTheme: (isDark: boolean) => void;
    initializeTheme: (systemIsDark?: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            isDark: false,
            theme: lightTheme,
            isInitialized: false,

            toggleTheme: () => {
                const newIsDark = !get().isDark;
                set({
                    isDark: newIsDark,
                    theme: newIsDark ? darkTheme : lightTheme,
                });
            },

            setTheme: (isDark: boolean) => {
                set({
                    isDark,
                    theme: isDark ? darkTheme : lightTheme,
                    isInitialized: true,
                });
            },

            initializeTheme: (systemIsDark = false) => {
                const { isInitialized } = get();
                if (!isInitialized) {
                    set({
                        isDark: systemIsDark,
                        theme: systemIsDark ? darkTheme : lightTheme,
                        isInitialized: true,
                    });
                }
            },
        }),
        {
            name: 'theme-storage',
            storage: createJSONStorage(() => AsyncStorage),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Garantir que o tema seja aplicado após carregar do storage
                    state.theme = state.isDark ? darkTheme : lightTheme;
                    state.isInitialized = true;
                }
            },
        }
    )
);