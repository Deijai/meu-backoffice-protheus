// app/(auth)/login.tsx - COM ÍCONE DE ENGRENAGEM NO HEADER - CORRIGIDO
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ImageBackground, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeArea } from '../../src/components/layout/SafeArea';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { useBiometric } from '../../src/hooks/useBiometric';
import { authService } from '../../src/services/api/authService';
import { httpService } from '../../src/services/api/httpService';
import { useAuthStore } from '../../src/store/authStore';
import { useConfigStore } from '../../src/store/configStore';
import { useThemeStore } from '../../src/store/themeStore';
import { useToastStore } from '../../src/store/toastStore';
import { Colors } from '../../src/styles/colors';

export default function LoginScreen() {
    const { theme } = useThemeStore();
    const { login } = useAuthStore();
    const { canProceedToLogin } = useConfigStore();
    const { showSuccess, showError, showInfo, visible, message, type, hideToast } = useToastStore();
    const insets = useSafeAreaInsets();
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

    // Verificar se há usuário para auto login na montagem
    useEffect(() => {
        checkForAutoLogin();

        // Verificar se a configuração REST está OK
        if (!canProceedToLogin()) {
            showError('❌ Configuração REST não encontrada. Redirecionando...');
            setTimeout(() => {
                router.replace('/(auth)/setup?fromError=true');
            }, 2000);
        }
    }, []);

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

                // Se tem senha salva, oferecer login automático
                if (autoUser.keepConnected && autoUser.password) {
                    setTimeout(() => {
                        handleAutoLogin(autoUser);
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('Erro ao verificar auto login:', error);
        }
    };

    /**
     * Detecta se o erro é relacionado ao servidor REST e requer reconfiguração
     */
    const isServerRelatedError = (error: any): boolean => {
        // Verificar códigos de erro de rede/conectividade
        if (error.code) {
            const networkErrorCodes = [
                'ECONNREFUSED',  // Conexão recusada
                'ECONNABORTED',  // Timeout
                'ENOTFOUND',     // Servidor não encontrado
                'ENETUNREACH',   // Rede inacessível
                'ETIMEDOUT',     // Timeout de conexão
                'NETWORK_ERROR', // Erro de rede genérico
            ];

            if (networkErrorCodes.includes(error.code)) {
                console.log('🔧 Erro de rede detectado:', error.code);
                return true;
            }
        }

        // Verificar mensagens de erro relacionadas ao servidor
        const errorMessage = (error.message || '').toLowerCase();
        const serverErrorMessages = [
            'não foi possível conectar',
            'servidor não responde',
            'timeout na conexão',
            'conexão recusada',
            'servidor não encontrado',
            'erro de conexão',
            'network error',
            'failed to fetch',
            'servidor demorou',
            'não acessível',
        ];

        if (serverErrorMessages.some(msg => errorMessage.includes(msg))) {
            console.log('🔧 Mensagem de erro de servidor:', errorMessage);
            return true;
        }

        // Verificar se tem response com status de erro de servidor
        if (error.response) {
            const status = error.response.status;

            // Status codes que podem indicar problema de configuração
            const serverStatusCodes = [
                0,   // Sem conexão
                502, // Bad Gateway
                503, // Service Unavailable
                504, // Gateway Timeout
                // Note: 401 e 400 são erros de credenciais, não de servidor
            ];

            if (serverStatusCodes.includes(status)) {
                console.log('🔧 Status de erro de servidor:', status);
                return true;
            }
        }

        // Se erro não tem resposta e não é de credenciais, pode ser servidor
        if (!error.response && !errorMessage.includes('senha') && !errorMessage.includes('usuário')) {
            console.log('🔧 Erro sem resposta, possivelmente servidor');
            return true;
        }

        console.log('ℹ️ Erro não relacionado ao servidor REST');
        return false;
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        // Validar username
        if (!formData.username.trim()) {
            errors.username = 'Nome de usuário é obrigatório';
        }

        // Validar password  
        if (!formData.password.trim()) {
            errors.password = 'Senha é obrigatória';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleLogin = async () => {
        console.log('🔄 === INICIANDO PROCESSO DE LOGIN ===');

        if (!validateForm()) {
            showError('❌ Por favor, corrija os erros no formulário');
            return;
        }

        if (!canProceedToLogin()) {
            showError('❌ Configuração REST não encontrada');
            router.replace('/(auth)/setup?fromError=true');
            return;
        }

        setIsLoading(true);

        try {
            console.log('👤 Tentando login com:', formData.username);

            // Atualizar URL base do httpService
            httpService.updateBaseURL();

            // 1. Verificar segurança do servidor primeiro
            showInfo('🔒 Verificando segurança do servidor...');
            const isSecure = await authService.checkSecurity();

            if (!isSecure) {
                console.log('❌ Servidor não seguro');
                showError('❌ Servidor não está seguro. Verifique as configurações.');
                return;
            }

            console.log('✅ Servidor seguro confirmado');
            showInfo('✅ Servidor seguro. Autenticando...');

            // 2. Realizar o login
            const authUser = await authService.signIn({
                username: formData.username,
                password: formData.password,
                keepConnected: options.savePassword,
            });

            console.log('✅ Login OAuth2 bem-sucedido:', authUser.username);

            // 3. Converter AuthUser para User do store
            const storeUser = {
                id: authUser.username,
                username: authUser.username,
                name: authUser.username,
                email: '',
            };

            // 4. Salvar no store
            login(storeUser);

            // 5. Configurar biometria se solicitado
            if (options.enableBiometric && biometricAvailable && isEnrolled) {
                try {
                    showInfo('🔒 Configurando biometria...');
                    const biometricSuccess = await authenticate();
                    if (biometricSuccess) {
                        showSuccess('✅ Biometria configurada com sucesso!');
                        console.log('✅ Biometria configurada');
                    } else {
                        console.log('⚠️ Usuário cancelou biometria');
                        // Não mostra erro, só aviso
                    }
                } catch (biometricError) {
                    console.warn('⚠️ Erro ao configurar biometria:', biometricError);
                    // Não bloqueia o login por erro de biometria
                }
            }

            // 6. Sucesso final
            showSuccess('🎉 Login realizado com sucesso!');
            console.log('🎉 Login completamente finalizado');

            // Aguardar para mostrar sucesso
            setTimeout(() => {
                router.navigate('/(app)/branch-selection');
            }, 1500);

        } catch (error: any) {
            console.error('❌ ERRO NO LOGIN:', error);

            // Verificar se é erro de servidor REST que requer reconfiguração
            const isServerError = isServerRelatedError(error);

            if (isServerError) {
                console.log('🔧 Erro de servidor detectado - Redirecionando para configuração REST');
                showError('❌ Problema de conexão com servidor. Redirecionando para configuração...');

                // Aguardar um pouco para mostrar o erro
                setTimeout(() => {
                    router.replace('/(auth)/setup?fromError=true');
                }, 2000);

                return; // Sair da função
            }

            // Tratar outros tipos de erro com mensagens específicas
            let errorMessage = 'Erro na autenticação';

            if (error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            // Remover emoji duplicado se já existe
            if (!errorMessage.startsWith('❌')) {
                errorMessage = `❌ ${errorMessage}`;
            }

            console.log('📤 Mostrando erro para usuário:', errorMessage);
            showError(errorMessage);

        } finally {
            setIsLoading(false);
            console.log('🏁 Processo de login finalizado');
        }
    };

    const handleAutoLogin = async (user: any) => {
        if (!user || !user.password) {
            console.log('❌ Dados insuficientes para auto login');
            return;
        }

        console.log('🔄 === INICIANDO AUTO LOGIN ===');
        setIsLoading(true);
        showInfo('🔄 Fazendo login automático...');

        try {
            // Usar os dados salvos para login
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
            showSuccess('✅ Login automático realizado!');
            console.log('✅ Auto login bem-sucedido');

            setTimeout(() => {
                router.navigate('/(app)/branch-selection');
            }, 1000);

        } catch (error: any) {
            console.error('❌ Erro no auto login:', error);

            // Verificar se é erro de servidor REST
            const isServerError = isServerRelatedError(error);

            if (isServerError) {
                console.log('🔧 Erro de servidor no auto login - Redirecionando para configuração REST');
                showError('❌ Problema de conexão detectado. Redirecionando para configuração...');

                setTimeout(() => {
                    router.replace('/(auth)/setup?fromError=true');
                }, 2000);

                return;
            }

            let errorMessage = error.message || 'Erro no login automático';
            if (!errorMessage.startsWith('❌')) {
                errorMessage = `❌ ${errorMessage}`;
            }

            showError(`${errorMessage}. Faça login manualmente.`);
            setShowAutoLoginOptions(false);
            setAutoLoginUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBiometricLogin = async () => {
        if (!biometricAvailable || !isEnrolled) {
            showError('❌ Autenticação biométrica não disponível');
            return;
        }

        if (!autoLoginUser) {
            showError('❌ Nenhum usuário salvo para autenticação biométrica');
            return;
        }

        try {
            showInfo(`🔒 Autentique-se com ${getBiometricTypeName()}...`);
            const biometricSuccess = await authenticate();

            if (biometricSuccess) {
                await handleAutoLogin(autoLoginUser);
            } else {
                showError('❌ Falha na autenticação biométrica');
            }
        } catch (error) {
            console.error('❌ Erro na biometria:', error);

            // Se erro for de servidor, redirecionar para setup
            if (isServerRelatedError(error)) {
                showError('❌ Problema de conexão. Redirecionando para configuração...');
                setTimeout(() => {
                    router.replace('/(auth)/setup?fromError=true');
                }, 2000);
            } else {
                showError('❌ Erro na autenticação biométrica');
            }
        }
    };

    const updateFormData = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Limpar erro do campo quando usuário digitar
        if (validationErrors[field]) {
            setValidationErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const isFormValid = () => {
        return formData.username.trim() && formData.password.trim();
    };

    return (
        <SafeArea>
            <ImageBackground
                source={require('../../assets/images/background.png')}
                style={[styles.backgroundImage]}
                resizeMode="cover"
            >
                {/* Overlay para melhor legibilidade */}
                <View style={[
                    styles.overlay,
                    {
                        backgroundColor: 'transparent'
                    }
                ]} />

                <View style={[styles.container, { backgroundColor: 'transparent' }]}>
                    {/* Loading Overlay */}
                    {isLoading && (
                        <LoadingSpinner
                            overlay
                            text="Autenticando..."
                            transparent
                        />
                    )}

                    {/* ⚙️ ÍCONE DE CONFIGURAÇÕES NO HEADER */}
                    <TouchableOpacity
                        onPress={() => router.push('/(auth)/setup')}
                        style={[
                            styles.settingsButton,
                            {
                                top: insets.top + 16,
                                backgroundColor: theme.colors.background === '#ffffff' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(45, 55, 72, 0.9)'
                            }
                        ]}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="settings-outline" size={20} color={theme.colors.text} />
                    </TouchableOpacity>

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
                                Meu Backoffice
                            </Text>
                            <Text style={[styles.appSubtitle, { color: theme.colors.textSecondary }]}>
                                Protheus
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
                                            🔐 Login salvo
                                        </Text>
                                    </View>
                                </View>

                                {biometricAvailable && isEnrolled && (
                                    <Button
                                        title={`Entrar com ${getBiometricTypeName()}`}
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
                                placeholder="Nome de usuário"
                                leftIcon="person-outline"
                                autoCapitalize="none"
                                autoCorrect={false}
                                error={validationErrors.username}
                                style={styles.input}
                            />

                            <Input
                                value={formData.password}
                                onChangeText={(value) => updateFormData('password', value)}
                                placeholder="Senha"
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
                                        Manter conectado
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
                                            Habilitar {getBiometricTypeName()}
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
                                title="Entrar"
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
                                        Debug Mode
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                                Meu Backoffice Protheus v1.0.0
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </ImageBackground>
        </SafeArea>
    );
}

const styles = StyleSheet.create({
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
    // ⚙️ ESTILO DO ÍCONE DE CONFIGURAÇÕES
    settingsButton: {
        position: 'absolute',
        right: 24,
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
    content: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
        minHeight: '100%',
    },

    // Header/Logo Section
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

    // Auto Login Card
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

    // Form Section
    formSection: {
        marginBottom: 24,
        gap: 16,
    },
    input: {
        backgroundColor: 'transparent',
    },

    // Options Section
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

    // Login Section
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

    // Debug Section
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

    // Footer
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