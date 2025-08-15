// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { LanguageCode } from '../types/i18n';
import { resources } from './resources';

// Verificar se estamos em ambiente de desenvolvimento
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

// Configuração do i18next
const initI18n = async (initialLanguage: LanguageCode = 'pt') => {
    if (i18n.isInitialized) {
        console.log('🌐 i18next já estava inicializado');
        return i18n;
    }

    await i18n
        .use(initReactI18next) // Conecta com react-i18next
        .init({
            // Recursos de tradução
            resources,

            // Idioma inicial
            lng: initialLanguage,

            // Idioma de fallback
            fallbackLng: 'pt',

            // Namespace padrão
            defaultNS: 'translation',

            // Configurações de debug (apenas em desenvolvimento)
            debug: isDev,

            // Configurações de interpolação
            interpolation: {
                escapeValue: false, // React já faz escape
            },

            // Configurações React
            react: {
                useSuspense: false, // Importante para React Native
            },

            // Configurações de carregamento
            load: 'languageOnly', // Carregar apenas o idioma, não região

            // Separadores
            keySeparator: '.', // Separador para chaves aninhadas
            nsSeparator: ':', // Separador para namespaces

            // Configurações para missing keys
            saveMissing: isDev, // Salvar chaves perdidas apenas em dev
            missingKeyHandler: (lng, ns, key) => {
                if (isDev) {
                    console.warn(`🌐 Chave de tradução perdida: [${lng}] ${key}`);
                }
            },
        });

    console.log(`✅ i18next inicializado com idioma: ${initialLanguage}`);
    return i18n;
};

// Função para alterar idioma
export const changeI18nLanguage = async (language: LanguageCode) => {
    try {
        await i18n.changeLanguage(language);
        console.log(`🌐 Idioma do i18next alterado para: ${language}`);
    } catch (error) {
        console.error('❌ Erro ao alterar idioma do i18next:', error);
        throw error;
    }
};

// Verificar se i18next está inicializado
export const isI18nReady = () => i18n.isInitialized;

// Obter idioma atual do i18next
export const getCurrentI18nLanguage = (): LanguageCode => {
    return (i18n.language || 'pt') as LanguageCode;
};

export { initI18n };
export default i18n;