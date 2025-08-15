// app/(auth)/login.tsx - COM SISTEMA DE TRADUÇÃO IMPLEMENTADO
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ImageBackground, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Componentes
import { SafeArea } from '../../src/components/layout/SafeArea';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { LanguageSelector } from '../../src/components/ui/LanguageSelector';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';

// Hooks
import { useBiometric } from '../../src/hooks/useBiometric';
import { useAuthTexts, useToastMessages, useTranslation, useValidationMessages } from '../../src/hooks/useTranslation';

// Services e Stores
import { authService } from '../../src/services/api/authService';
import { httpService } from '../../src/services/api/httpService';
import { useAuthStore } from '../../src/store/authStore';
import { useConfigStore } from '../../src/store/configStore';
import { useI18nStore } from '../../src/store/i18nStore';
import { useThemeStore } from '../../src/store/themeStore';
import { useToastStore } from '../../src/store/toastStore';

// Styles
import { Colors } from '../../src/styles/colors';

export default function LoginScreen() {
    const { theme } = useThemeStore();
    const { login } = useAuthStore();
    const { canProceedToLogin } = useConfigStore();
    const { showSuccess, showError, showInfo, visible, message, type, hideToast } = useToastStore();
    const { initializeLanguage, isInitialized: isI18nInitialized } = useI18nStore();
    const insets = useSafeAreaInsets();

    // Hooks de tradução
    const { t, currentLanguage, getBiometricText } = useTranslation();
    const validation = useValidationMessages();
    const toastMessages = useToastMessages();
    const authTexts = useAuthTexts();

    const {
        authenticate,
        isAvailable: biometricAvailable,
        getBiometricTypeName,
        isEnrolled
    } = useBiometric();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const [options, setOptions] = useState({
        savePassword: false,
        enableBiometric: false,
    });

    const [isLoading, setIsLoading] = useState(false);
    const [showAutoLoginOptions, setShowAutoLoginOptions] = useState(false);
    const [autoLoginUser, setAutoLoginUser] = useState<any>(null);

    // Inicializar sistema de idiomas e verificar auto login
    useEffect(() => {
        const initializeApp = async () => {
            // Inicializar sistema de idiomas primeiro
            if (!isI18nInitialized) {
                await initializeLanguage();
            }

            // Depois verificar auto login
            await checkForAutoLogin();

            // Verificar se a configuração REST está OK
            if (!canProceedToLogin()) {
                showError(toastMessages.configurationError());
                setTimeout(() => {
                    router.replace('/(auth)/setup?fromError=true');
                }, 2000);
            }
        };

        initializeApp();
    }, [isI18nInitialized]);

    const checkForAutoLogin = async () => {
        try {
            const autoUser = await authService.checkAutoLogin();

            if (autoUser) {
                setAutoLoginUser(autoUser);
                setFormData({
                    username: autoUser.username,
                    password: autoUser.password || '',
                });

                setOptions({
                    savePassword: autoUser.keepConnected,
                    enableBiometric: false,
                });

                setShowAutoLoginOptions(true);

                // Verificar se precisa de login manual
                if (autoUser.needsManualLogin) {
                    console.log('⚠️ Usuário precisa de login manual - refresh token expirado');
                    showInfo(toastMessages.sessionExpired());
                    return;
                }

                // Se tem senha salva e não precisa de login manual, tentar auto login
                if (autoUser.keepConnected && autoUser.password && !autoUser.needsManualLogin) {
                    console.log('🔄 Iniciando auto login automático...');
                    setTimeout(() => {
                        handleAutoLogin(autoUser);
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('Erro ao verificar auto login:', error);
        }
    };

    const handleAutoLogin = async (user: any) => {
        if (!user || !user.password) {
            console.log('❌ Dados insuficientes para auto login');
            showError(validation.invalidCredentials());
            return;
        }

        console.log('🔄 === INICIANDO AUTO LOGIN ===');
        setIsLoading(true);
        showInfo(t('common.authenticating'));

        try {
            const authUser = await authService.signIn({
                username: user.username,
                password: user.password,
                keepConnected: true,
            });

            const storeUser = {
                id: authUser.username,
                username: authUser.username,
                name: authUser.username,
                email: '',
            };

            login(storeUser);
            showSuccess(toastMessages.loginSuccess());
            console.log('✅ Auto login bem-sucedido');

            setTimeout(() => {
                router.navigate('/(app)/branch-selection');
            }, 1000);

        } catch (error: any) {
            console.error('❌ Erro no auto login:', error);

            const isServerError = isServerRelatedError(error);

            if (isServerError) {
                console.log('🔧 Erro de servidor no auto login - Redirecionando para configuração REST');
                showError(toastMessages.redirectingToSetup());

                setTimeout(() => {
                    router.replace('/(auth)/setup?fromError=true');
                }, 2000);

                return;
            }

            let errorMessage = error.message || t('validation.networkError');
            if (errorMessage.includes('Sessão expirada') || errorMessage.includes('invalid_grant')) {
                showError(toastMessages.sessionExpired());
                setShowAutoLoginOptions(true);
            } else {
                showError(toastMessages.loginError(errorMessage));
                setShowAutoLoginOptions(false);
                setAutoLoginUser(null);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const isServerRelatedError = (error: any): boolean => {
        if (error.code) {
            const networkErrorCodes = [
                'ECONNREFUSED', 'ECONNABORTED', 'ENOTFOUND',
                'ENETUNREACH', 'ETIMEDOUT', 'NETWORK_ERROR',
            ];

            if (networkErrorCodes.includes(error.code)) {
                console.log('🔧 Erro de rede detectado:', error.code);
                return true;
            }
        }

        const errorMessage = (error.message || '').toLowerCase();
        const serverErrorMessages = [
            'não foi possível conectar', 'servidor não responde', 'timeout na conexão',
            'conexão recusada', 'servidor não encontrado', 'erro de conexão',
            'network error', 'failed to fetch', 'servidor demorou', 'não acessível',
        ];

        if (serverErrorMessages.some(msg => errorMessage.includes(msg))) {
            console.log('🔧 Mensagem de erro de servidor:', errorMessage);
            return true;
        }

        if (error.response) {
            const status = error.response.status;
            const serverStatusCodes = [0, 502, 503, 504];

            if (serverStatusCodes.includes(status)) {
                console.log('🔧 Status de erro de servidor:', status);
                return true;
            }
        }

        if (!error.response && !errorMessage.includes('senha') && !errorMessage.includes('usuário')) {
            console.log('🔧 Erro sem resposta, possivelmente servidor');
            return true;
        }

        console.log('ℹ️ Erro não relacionado ao servidor REST');
        return false;
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.username.trim()) {
            errors.username = validation.usernameRequired();
        }

        if (!formData.password.trim()) {
            errors.password = validation.passwordRequired();
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleLogin = async () => {
        console.log('🔄 === INICIANDO PROCESSO DE LOGIN ===');

        if (!validateForm()) {
            showError(t('validation.required', { field: 'formulário' }));
            return;
        }

        if (!canProceedToLogin()) {
            showError(validation.configNotFound());
            router.replace('/(auth)/setup?fromError=true');
            return;
        }

        setIsLoading(true);

        try {
            console.log('👤 Tentando login com:', formData.username);

            httpService.updateBaseURL();

            showInfo(toastMessages.checkingSecurity());
            const isSecure = await authService.checkSecurity();

            if (!isSecure) {
                console.log('❌ Servidor não seguro');
                showError(validation.serverError());
                return;
            }

            console.log('✅ Servidor seguro confirmado');
            showInfo(toastMessages.serverSecure());

            const authUser = await authService.signIn({
                username: formData.username,
                password: formData.password,
                keepConnected: options.savePassword,
            });

            console.log('✅ Login OAuth2 bem-sucedido:', authUser.username);

            const storeUser = {
                id: authUser.username,
                username: authUser.username,
                name: authUser.username,
                email: '',
            };

            login(storeUser);

            if (options.enableBiometric && biometricAvailable && isEnrolled) {
                try {
                    showInfo(t('biometric.authenticate', { biometricType: getBiometricText(getBiometricTypeName()) }));
                    const biometricSuccess = await authenticate();
                    if (biometricSuccess) {
                        showSuccess(toastMessages.biometricConfigured());
                        console.log('✅ Biometria configurada');
                    } else {
                        console.log('⚠️ Usuário cancelou biometria');
                    }
                } catch (biometricError) {
                    console.warn('⚠️ Erro ao configurar biometria:', biometricError);
                }
            }

            showSuccess(toastMessages.loginSuccess());
            console.log('🎉 Login completamente finalizado');

            setTimeout(() => {
                router.navigate('/(app)/branch-selection');
            }, 1500);

        } catch (error: any) {
            console.error('❌ ERRO NO LOGIN:', error);

            const isServerError = isServerRelatedError(error);

            if (isServerError) {
                console.log('🔧 Erro de servidor detectado - Redirecionando para configuração REST');
                showError(toastMessages.redirectingToSetup());

                setTimeout(() => {
                    router.replace('/(auth)/setup?fromError=true');
                }, 2000);

                return;
            }

            let errorMessage = validation.networkError();

            if (error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            console.log('📤 Mostrando erro para usuário:', errorMessage);
            showError(toastMessages.loginError(errorMessage));

        } finally {
            setIsLoading(false);
            console.log('🏁 Processo de login finalizado');
        }
    };

    const handleBiometricLogin = async () => {
        if (!biometricAvailable || !isEnrolled) {
            showError(validation.biometricNotAvailable());
            return;
        }

        if (!autoLoginUser) {
            showError(validation.biometricNotAvailable());
            return;
        }

        try {
            const biometricType = getBiometricText(getBiometricTypeName());
            showInfo(t('biometric.authenticate', { biometricType }));
            const biometricSuccess = await authenticate();

            if (biometricSuccess) {
                await handleAutoLogin(autoLoginUser);
            } else {
                showError(validation.biometricFailed());
            }
        } catch (error) {
            console.error('❌ Erro na biometria:', error);

            if (isServerRelatedError(error)) {
                showError(toastMessages.redirectingToSetup());
                setTimeout(() => {
                    router.replace('/(auth)/setup?fromError=true');
                }, 2000);
            } else {
                showError(validation.biometricFailed());
            }
        }
    };

    const updateFormData = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (validationErrors[field]) {
            setValidationErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const isFormValid = () => {
        return formData.username.trim() && formData.password.trim();
    };

    // Aguardar inicialização do i18n
    if (!isI18nInitialized) {
        return (
            <SafeArea>
                <View style={styles.loadingContainer}>
                    <LoadingSpinner text="Carregando..." />
                </View>
            </SafeArea>
        );
    }

    return (
        <SafeArea>
            <ImageBackground
                source={require('../../assets/images/background.png')}
                style={[styles.backgroundImage]}
                resizeMode="cover"
            >
                <View style={[styles.overlay, { backgroundColor: 'transparent' }]} />

                <View style={[styles.container, { backgroundColor: 'transparent' }]}>
                    {isLoading && (
                        <LoadingSpinner
                            overlay
                            text={t('common.authenticating')}
                            transparent
                        />
                    )}

                    {/* Ícone de configurações */}
                    <TouchableOpacity
                        onPress={() => router.push('/(auth)/setup')}
                        style={[
                            styles.settingsButton,
                            {
                                top: insets.top + 16,
                                backgroundColor: theme.colors.background === '#ffffff'
                                    ? 'rgba(255, 255, 255, 0.9)'
                                    : 'rgba(45, 55, 72, 0.9)'
                            }
                        ]}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="settings-outline" size={20} color={theme.colors.text} />
                    </TouchableOpacity>

                    {/* Seletor de idioma */}
                    <View style={[styles.languageSelectorContainer, { top: insets.top + 16 }]}>
                        <LanguageSelector size="sm" />
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {/* Header/Logo */}
                        <View style={styles.header}>
                            <View style={[styles.logoContainer]}>
                                <Image
                                    source={require('../../assets/images/meu-protheus.png')}
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={[styles.appTitle, { color: theme.colors.text }]}>
                                {authTexts.login.title()}
                            </Text>
                            <Text style={[styles.appSubtitle, { color: theme.colors.textSecondary }]}>
                                {authTexts.login.subtitle()}
                            </Text>
                        </View>

                        {/* Auto Login Card */}
                        {showAutoLoginOptions && autoLoginUser && (
                            <View style={[
                                styles.autoLoginCard,
                                {
                                    backgroundColor: theme.colors.background === '#ffffff'
                                        ? 'rgba(255, 255, 255, 0.95)'
                                        : 'rgba(45, 55, 72, 0.95)'
                                }
                            ]}>
                                <View style={styles.autoLoginHeader}>
                                    <View style={[styles.autoLoginAvatar, { backgroundColor: Colors.primary }]}>
                                        <Text style={styles.autoLoginAvatarText}>
                                            {autoLoginUser.username.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.autoLoginInfo}>
                                        <Text style={[styles.autoLoginName, { color: theme.colors.text }]}>
                                            {autoLoginUser.username}
                                        </Text>
                                        <Text style={[styles.autoLoginStatus, { color: Colors.primary }]}>
                                            🔐 {authTexts.login.savedLogin()}
                                        </Text>
                                    </View>
                                </View>

                                {biometricAvailable && isEnrolled && (
                                    <Button
                                        title={authTexts.login.enterWith(getBiometricTypeName())}
                                        variant="outline"
                                        size="sm"
                                        onPress={handleBiometricLogin}
                                        leftIcon={<Ionicons name="finger-print" size={18} color={Colors.primary} />}
                                        style={styles.biometricButton}
                                    />
                                )}
                            </View>
                        )}

                        {/* Login Form */}
                        <View style={styles.formSection}>
                            <Input
                                value={formData.username}
                                onChangeText={(value) => updateFormData('username', value)}
                                placeholder={authTexts.login.usernamePlaceholder()}
                                leftIcon="person-outline"
                                autoCapitalize="none"
                                autoCorrect={false}
                                error={validationErrors.username}
                                style={styles.input}
                            />

                            <Input
                                value={formData.password}
                                onChangeText={(value) => updateFormData('password', value)}
                                placeholder={authTexts.login.passwordPlaceholder()}
                                leftIcon="lock-closed-outline"
                                secureTextEntry
                                error={validationErrors.password}
                                style={styles.input}
                            />
                        </View>

                        {/* Options */}
                        <View style={styles.optionsSection}>
                            <View style={styles.optionRow}>
                                <View style={styles.optionLeft}>
                                    <Ionicons name="save-outline" size={20} color={theme.colors.textSecondary} />
                                    <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                                        {authTexts.login.keepConnected()}
                                    </Text>
                                </View>
                                <Switch
                                    value={options.savePassword}
                                    onValueChange={(value) => setOptions(prev => ({ ...prev, savePassword: value }))}
                                    trackColor={{ false: theme.colors.border, true: `${Colors.primary}80` }}
                                    thumbColor={options.savePassword ? Colors.primary : theme.colors.surface}
                                />
                            </View>

                            {biometricAvailable && isEnrolled && (
                                <View style={styles.optionRow}>
                                    <View style={styles.optionLeft}>
                                        <Ionicons name="finger-print-outline" size={20} color={theme.colors.textSecondary} />
                                        <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                                            {authTexts.login.enableBiometric(getBiometricTypeName())}
                                        </Text>
                                    </View>
                                    <Switch
                                        value={options.enableBiometric}
                                        onValueChange={(value) => setOptions(prev => ({ ...prev, enableBiometric: value }))}
                                        trackColor={{ false: theme.colors.border, true: `${Colors.primary}80` }}
                                        thumbColor={options.enableBiometric ? Colors.primary : theme.colors.surface}
                                    />
                                </View>
                            )}
                        </View>

                        {/* Login Button */}
                        <View style={styles.loginSection}>
                            <Button
                                title={authTexts.login.loginButton()}
                                onPress={handleLogin}
                                disabled={!isFormValid() || isLoading}
                                style={styles.loginButton}
                            />
                        </View>

                        {/* Debug Button (only in dev) */}
                        {__DEV__ && (
                            <View style={styles.debugSection}>
                                <TouchableOpacity
                                    onPress={() => router.push('/(auth)/ultra-debug')}
                                    style={styles.debugButton}
                                >
                                    <Ionicons name="bug-outline" size={16} color={theme.colors.textSecondary} />
                                    <Text style={[styles.debugText, { color: theme.colors.textSecondary }]}>
                                        {authTexts.login.debugMode()}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                                {authTexts.login.appVersion('1.0.0')}
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </ImageBackground>
        </SafeArea>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
    },
    container: {
        flex: 1,
        zIndex: 2,
    },
    settingsButton: {
        position: 'absolute',
        right: 70, // Deixar espaço para o seletor de idioma
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    languageSelectorContainer: {
        position: 'absolute',
        right: 16,
        zIndex: 10,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
        minHeight: '100%',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoImage: {
        width: 60,
        height: 60,
    },
    appTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    appSubtitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    autoLoginCard: {
        padding: 20,
        marginBottom: 24,
        borderRadius: 16,
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    autoLoginHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    autoLoginAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    autoLoginAvatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    autoLoginInfo: {
        flex: 1,
    },
    autoLoginName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    autoLoginStatus: {
        fontSize: 14,
        fontWeight: '500',
    },
    biometricButton: {
        alignSelf: 'flex-start',
    },
    formSection: {
        marginBottom: 24,
        gap: 16,
    },
    input: {
        backgroundColor: 'transparent',
    },
    optionsSection: {
        marginBottom: 32,
        gap: 16,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    loginSection: {
        marginBottom: 24,
    },
    loginButton: {
        height: 56,
        borderRadius: 16,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    debugSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    debugButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    debugText: {
        fontSize: 14,
        fontWeight: '500',
    },
    footer: {
        alignItems: 'center',
        paddingTop: 24,
        paddingBottom: 32,
    },
    footerText: {
        fontSize: 13,
        textAlign: 'center',
        fontWeight: '500',
    },
});