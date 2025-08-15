// src/types/i18n.ts
export interface TranslationResources {
    // ===== AUTH SCREENS =====
    auth: {
        login: {
            title: string;
            subtitle: string;
            username: string;
            password: string;
            usernamePlaceholder: string;
            passwordPlaceholder: string;
            loginButton: string;
            keepConnected: string;
            enableBiometric: string;
            loginWith: string;
            autoLoginCard: {
                savedLogin: string;
                enterWith: string;
            };
            debugMode: string;
            appVersion: string;
        };
        setup: {
            title: string;
            subtitle: string;
            protocol: string;
            address: string;
            port: string;
            endpoint: string;
            environment: string;
            testConnection: string;
            backToLogin: string;
            connectionSuccess: string;
            protocolSelection: string;
            optional: string;
            required: string;
        };
    };

    // ===== VALIDATION MESSAGES =====
    validation: {
        required: string;
        usernameRequired: string;
        passwordRequired: string;
        emailInvalid: string;
        passwordMinLength: string;
        networkError: string;
        serverError: string;
        invalidCredentials: string;
        sessionExpired: string;
        configNotFound: string;
        biometricNotAvailable: string;
        biometricFailed: string;
    };

    // ===== COMMON/SHARED =====
    common: {
        loading: string;
        authenticating: string;
        connecting: string;
        error: string;
        success: string;
        warning: string;
        info: string;
        cancel: string;
        confirm: string;
        retry: string;
        close: string;
        save: string;
        back: string;
        next: string;
        finish: string;
        yes: string;
        no: string;
        ok: string;
    };

    // ===== BIOMETRIC =====
    biometric: {
        faceId: string;
        touchId: string;
        fingerprint: string;
        authenticate: string;
        authenticationFailed: string;
        authenticationCancelled: string;
        notEnrolled: string;
        notAvailable: string;
        configureSuccess: string;
    };

    // ===== TOAST MESSAGES =====
    toast: {
        loginSuccess: string;
        loginError: string;
        connectionSuccess: string;
        connectionError: string;
        configurationError: string;
        sessionExpired: string;
        redirectingToSetup: string;
        biometricConfigured: string;
        checkingSecurity: string;
        serverSecure: string;
    };

    // ===== APP SCREENS (futuro) =====
    app: {
        branchSelection: {
            title: string;
            subtitle: string;
            selectBranch: string;
        };
        moduleSelection: {
            title: string;
            subtitle: string;
        };
    };
}

export type LanguageCode = 'pt' | 'en' | 'es';

export interface Language {
    code: LanguageCode;
    name: string;
    nativeName: string;
    flag: string;
    isRTL?: boolean;
}

export interface I18nConfig {
    defaultLanguage: LanguageCode;
    fallbackLanguage: LanguageCode;
    supportedLanguages: Language[];
    enableFallback: boolean;
    interpolation: {
        escapeValue: boolean;
    };
}

// Tipos para interpolação
export interface InterpolationValues {
    [key: string]: string | number | boolean;
}

// Tipos para tradução com parâmetros
export type TranslationKey = keyof TranslationResources |
    `${keyof TranslationResources}.${string}`;

export type NestedKeyOf<ObjectType extends object> = {
    [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationPath = NestedKeyOf<TranslationResources>;