// src/hooks/useTranslation.ts
import { changeLanguage } from 'i18next';
import { useTranslation as useI18nextTranslation } from 'react-i18next';
import { useI18nStore } from '../store/i18nStore';
import {
    InterpolationValues,
    Language,
    LanguageCode,
    TranslationPath
} from '../types/i18n';

// Hook principal para traduções
export const useTranslation = () => {
    const { t: i18nT, i18n } = useI18nextTranslation();
    const {
        currentLanguage,
        setLanguage,
        getSupportedLanguages,
        getLanguageByCode,
        isChanging,
        isInitialized
    } = useI18nStore();

    // Função de tradução tipada
    const t = (
        key: TranslationPath,
        options?: InterpolationValues
    ): string => {
        try {
            return i18nT(key, options) as string;
        } catch (error) {
            console.warn(`🌐 Erro na tradução da chave: ${key}`, error);
            return key; // Retorna a chave como fallback
        }
    };

    // Função para alterar idioma
    const setCurrentLanguage = async (language: LanguageCode): Promise<void> => {
        try {
            // Atualizar no store (persiste no AsyncStorage)
            await setLanguage(language);

            // Atualizar no i18next
            await changeLanguage(language);
        } catch (error) {
            console.error('❌ Erro ao alterar idioma:', error);
            throw error;
        }
    };

    // Obter informações do idioma atual
    const getCurrentLanguageInfo = (): Language | undefined => {
        return getLanguageByCode(currentLanguage);
    };

    // Verificar se está em um idioma específico
    const isLanguage = (language: LanguageCode): boolean => {
        return currentLanguage === language;
    };

    // Formatação específica para biometria
    const getBiometricText = (biometricType: string): string => {
        // Mapear tipos de biometria para chaves de tradução
        const biometricMap: Record<string, string> = {
            'face': 'biometric.faceId',
            'fingerprint': 'biometric.fingerprint',
            'touch': 'biometric.touchId',
        };

        const key = biometricMap[biometricType.toLowerCase()] || 'biometric.fingerprint';
        return t(key as TranslationPath);
    };

    return {
        // Função de tradução
        t,

        // Informações de idioma
        currentLanguage,
        getCurrentLanguageInfo,
        isLanguage,

        // Idiomas disponíveis
        supportedLanguages: getSupportedLanguages(),

        // Controle de idioma
        setLanguage: setCurrentLanguage,
        isChangingLanguage: isChanging,
        isI18nInitialized: isInitialized,

        // Utilitários
        getBiometricText,

        // Acesso direto ao i18next (se necessário)
        i18n,
    };
};

// Hook específico para validações (retorna funções de validação traduzidas)
export const useValidationMessages = () => {
    const { t } = useTranslation();

    return {
        required: (field: string) => t('validation.required', { field }),
        emailInvalid: () => t('validation.emailInvalid'),
        passwordMinLength: (min: number) => t('validation.passwordMinLength', { min }),
        usernameRequired: () => t('validation.usernameRequired'),
        passwordRequired: () => t('validation.passwordRequired'),
        networkError: () => t('validation.networkError'),
        serverError: () => t('validation.serverError'),
        invalidCredentials: () => t('validation.invalidCredentials'),
        sessionExpired: () => t('validation.sessionExpired'),
        configNotFound: () => t('validation.configNotFound'),
        biometricNotAvailable: () => t('validation.biometricNotAvailable'),
        biometricFailed: () => t('validation.biometricFailed'),
    };
};

// Hook específico para mensagens de toast
export const useToastMessages = () => {
    const { t } = useTranslation();

    return {
        loginSuccess: () => t('toast.loginSuccess'),
        loginError: (message: string) => t('toast.loginError', { message }),
        connectionSuccess: () => t('toast.connectionSuccess'),
        connectionError: (message: string) => t('toast.connectionError', { message }),
        configurationError: () => t('toast.configurationError'),
        sessionExpired: () => t('toast.sessionExpired'),
        redirectingToSetup: () => t('toast.redirectingToSetup'),
        biometricConfigured: () => t('toast.biometricConfigured'),
        checkingSecurity: () => t('toast.checkingSecurity'),
        serverSecure: () => t('toast.serverSecure'),
    };
};

// Hook para textos de autenticação
export const useAuthTexts = () => {
    const { t, getBiometricText } = useTranslation();

    return {
        login: {
            title: () => t('auth.login.title'),
            subtitle: () => t('auth.login.subtitle'),
            username: () => t('auth.login.username'),
            password: () => t('auth.login.password'),
            usernamePlaceholder: () => t('auth.login.usernamePlaceholder'),
            passwordPlaceholder: () => t('auth.login.passwordPlaceholder'),
            loginButton: () => t('auth.login.loginButton'),
            keepConnected: () => t('auth.login.keepConnected'),
            enableBiometric: (biometricType: string) =>
                t('auth.login.enableBiometric', { biometricType: getBiometricText(biometricType) }),
            loginWith: (biometricType: string) =>
                t('auth.login.loginWith', { biometricType: getBiometricText(biometricType) }),
            savedLogin: () => t('auth.login.autoLoginCard.savedLogin'),
            enterWith: (biometricType: string) =>
                t('auth.login.autoLoginCard.enterWith', { biometricType: getBiometricText(biometricType) }),
            debugMode: () => t('auth.login.debugMode'),
            appVersion: (version: string) => t('auth.login.appVersion', { version }),
        },
    };
};