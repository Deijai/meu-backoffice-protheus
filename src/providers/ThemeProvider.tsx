import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { lightTheme, Theme } from '../styles/theme';

interface ThemeContextType {
    theme: Theme;
    isDark: boolean;
    toggleTheme: () => void;
    setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [isInitialized, setIsInitialized] = useState(false);

    const {
        isDark,
        theme,
        toggleTheme,
        setTheme,
    } = useThemeStore();

    useEffect(() => {
        // Inicializar tema baseado no sistema se for a primeira vez
        if (!isInitialized) {
            const shouldUseDarkTheme = systemColorScheme === 'dark';
            if (isDark !== shouldUseDarkTheme) {
                setTheme(shouldUseDarkTheme);
            }
            setIsInitialized(true);
        }
    }, [systemColorScheme, isDark, setTheme, isInitialized]);

    // Garantir que sempre temos um tema válido
    const safeTheme = theme || lightTheme;
    const safeIsDark = isDark ?? false;

    const contextValue: ThemeContextType = {
        theme: safeTheme,
        isDark: safeIsDark,
        toggleTheme,
        setTheme,
    };

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        // Fallback caso o contexto não esteja disponível
        return {
            theme: lightTheme,
            isDark: false,
            toggleTheme: () => { },
            setTheme: () => { },
        };
    }
    return context;
};