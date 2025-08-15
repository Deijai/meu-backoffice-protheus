// src/store/i18nStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { Language, LanguageCode } from '../types/i18n';

// Idiomas suportados
export const SUPPORTED_LANGUAGES: Language[] = [
    {
        code: 'pt',
        name: 'Português',
        nativeName: 'Português (Brasil)',
        flag: '🇧🇷',
    },
    {
        code: 'en',
        name: 'English',
        nativeName: 'English (US)',
        flag: '🇺🇸',
    },
    {
        code: 'es',
        name: 'Español',
        nativeName: 'Español',
        flag: '🇪🇸',
    },
];

interface I18nState {
    // Estado
    currentLanguage: LanguageCode;
    isInitialized: boolean;
    isChanging: boolean;

    // Ações
    initializeLanguage: () => Promise<void>;
    setLanguage: (language: LanguageCode) => Promise<void>;
    getCurrentLanguage: () => LanguageCode;
    getSupportedLanguages: () => Language[];
    getLanguageByCode: (code: LanguageCode) => Language | undefined;
    detectDeviceLanguage: () => LanguageCode;
}

const STORAGE_KEY = '@meu-protheus:language';
const DEFAULT_LANGUAGE: LanguageCode = 'pt';

export const useI18nStore = create<I18nState>((set, get) => ({
    // Estado inicial
    currentLanguage: DEFAULT_LANGUAGE,
    isInitialized: false,
    isChanging: false,

    // Inicializar o idioma da aplicação
    initializeLanguage: async () => {
        try {
            console.log('🌐 Inicializando sistema de idiomas...');

            // Tentar carregar idioma salvo
            const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);

            let targetLanguage: LanguageCode;

            if (savedLanguage && SUPPORTED_LANGUAGES.some(lang => lang.code === savedLanguage)) {
                // Usar idioma salvo se válido
                targetLanguage = savedLanguage as LanguageCode;
                console.log(`🌐 Idioma salvo encontrado: ${targetLanguage}`);
            } else {
                // Detectar idioma do dispositivo
                targetLanguage = get().detectDeviceLanguage();
                console.log(`🌐 Usando idioma do dispositivo: ${targetLanguage}`);

                // Salvar a detecção automática
                await AsyncStorage.setItem(STORAGE_KEY, targetLanguage);
            }

            set({
                currentLanguage: targetLanguage,
                isInitialized: true,
            });

            console.log(`✅ Sistema de idiomas inicializado: ${targetLanguage}`);
        } catch (error) {
            console.error('❌ Erro ao inicializar idiomas:', error);

            // Fallback para idioma padrão
            set({
                currentLanguage: DEFAULT_LANGUAGE,
                isInitialized: true,
            });
        }
    },

    // Alterar idioma
    setLanguage: async (language: LanguageCode) => {
        const currentLanguage = get().currentLanguage;

        if (currentLanguage === language) {
            console.log(`🌐 Idioma já está definido como: ${language}`);
            return;
        }

        try {
            set({ isChanging: true });
            console.log(`🌐 Alterando idioma de ${currentLanguage} para ${language}...`);

            // Validar se o idioma é suportado
            const isSupported = SUPPORTED_LANGUAGES.some(lang => lang.code === language);
            if (!isSupported) {
                throw new Error(`Idioma não suportado: ${language}`);
            }

            // Salvar no AsyncStorage
            await AsyncStorage.setItem(STORAGE_KEY, language);

            // Atualizar estado
            set({
                currentLanguage: language,
                isChanging: false,
            });

            console.log(`✅ Idioma alterado para: ${language}`);
        } catch (error) {
            console.error('❌ Erro ao alterar idioma:', error);
            set({ isChanging: false });
            throw error;
        }
    },

    // Obter idioma atual
    getCurrentLanguage: () => {
        return get().currentLanguage;
    },

    // Obter lista de idiomas suportados
    getSupportedLanguages: () => {
        return SUPPORTED_LANGUAGES;
    },

    // Obter idioma por código
    getLanguageByCode: (code: LanguageCode) => {
        return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
    },

    // Detectar idioma do dispositivo
    detectDeviceLanguage: () => {
        try {
            const deviceLocales = getLocales();
            const deviceLanguage = deviceLocales[0]?.languageCode;

            console.log(`🌐 Idioma do dispositivo detectado: ${deviceLanguage}`);

            // Verificar se o idioma do dispositivo é suportado
            const supportedCodes = SUPPORTED_LANGUAGES.map(lang => lang.code);

            if (deviceLanguage && supportedCodes.includes(deviceLanguage as LanguageCode)) {
                return deviceLanguage as LanguageCode;
            }

            // Fallback para idioma padrão
            console.log(`🌐 Idioma do dispositivo não suportado, usando padrão: ${DEFAULT_LANGUAGE}`);
            return DEFAULT_LANGUAGE;
        } catch (error) {
            console.error('❌ Erro ao detectar idioma do dispositivo:', error);
            return DEFAULT_LANGUAGE;
        }
    },
}));