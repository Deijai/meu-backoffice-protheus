// src/store/i18nStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { changeI18nLanguage, initI18n, isI18nReady } from '../i18n';
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
    isI18nextReady: boolean;

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
    isI18nextReady: false,

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

            // Inicializar i18next com o idioma detectado
            await initI18n(targetLanguage);

            set({
                currentLanguage: targetLanguage,
                isInitialized: true,
                isI18nextReady: true,
            });

            console.log(`✅ Sistema de idiomas inicializado: ${targetLanguage}`);
        } catch (error) {
            console.error('❌ Erro ao inicializar idiomas:', error);

            // Fallback para idioma padrão
            try {
                await initI18n(DEFAULT_LANGUAGE);
                set({
                    currentLanguage: DEFAULT_LANGUAGE,
                    isInitialized: true,
                    isI18nextReady: true,
                });
            } catch (fallbackError) {
                console.error('❌ Erro crítico ao inicializar i18next:', fallbackError);
                set({
                    currentLanguage: DEFAULT_LANGUAGE,
                    isInitialized: true,
                    isI18nextReady: false,
                });
            }
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

            // Verificar se i18next está pronto
            if (!isI18nReady()) {
                console.warn('⚠️ i18next não está inicializado, tentando inicializar...');
                await initI18n(language);
            } else {
                // Alterar idioma no i18next
                await changeI18nLanguage(language);
            }

            // Salvar no AsyncStorage
            await AsyncStorage.setItem(STORAGE_KEY, language);

            // Atualizar estado
            set({
                currentLanguage: language,
                isChanging: false,
                isI18nextReady: true,
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