// app/(auth)/login.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeArea } from '../../src/components/layout/SafeArea';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Toast } from '../../src/components/ui/Toast';
import { useBiometric } from '../../src/hooks/useBiometric';
import { useTheme } from '../../src/hooks/useTheme';
import { authService } from '../../src/services/api/authService';
import { httpService } from '../../src/services/api/httpService';
import { useAuthStore } from '../../src/store/authStore';
import { useConfigStore } from '../../src/store/configStore';
import { useToastStore } from '../../src/store/toastStore';
import { Colors } from '../../src/styles/colors';
import { validation } from '../../src/utils/validation';

export default function LoginScreen() {
    const { theme } = useTheme();
    const { login } = useAuthStore();
    const { canProceedToLogin } = useConfigStore();
    const { showSuccess, showError, visible, message, type, hideToast } = useToastStore();
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
            showError('Configuração REST não encontrada. Redirecionando...');
            setTimeout(() => {
                router.replace('/(auth)/setup');
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
                    enableBiometric: false, // Será definido após verificar biometria
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

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        // Validar username
        const usernameValidation = validation.username(formData.username);
        if (!usernameValidation.valid) {
            errors.username = usernameValidation.errors[0];
        }

        // Validar password
        const passwordValidation = validation.password(formData.password);
        if (!passwordValidation.valid) {
            errors.password = passwordValidation.errors[0];
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleLogin = async () => {
        if (!validateForm()) {
            showError('Por favor, corrija os erros no formulário');
            return;
        }

        if (!canProceedToLogin()) {
            showError('Configuração REST não encontrada');
            return;
        }

        setIsLoading(true);

        try {
            // Atualizar URL base do httpService
            httpService.updateBaseURL();

            // Verificar segurança do servidor primeiro
            showSuccess('🔒 Verificando segurança do servidor...');
            const isSecure = await authService.checkSecurity();

            if (!isSecure) {
                showError('❌ Servidor não está seguro. Verifique as configurações.');
                return;
            }

            showSuccess('✅ Servidor seguro. Autenticando...');

            // Realizar o login
            const authUser = await authService.signIn({
                username: formData.username,
                password: formData.password,
                keepConnected: options.savePassword,
            });

            // Converter AuthUser para User do store
            const storeUser = {
                id: authUser.username,
                username: authUser.username,
                name: authUser.username,
                email: '', // Pode ser obtido do servidor posteriormente
            };

            // Salvar no store
            login(storeUser);

            // Configurar biometria se solicitado
            if (options.enableBiometric && biometricAvailable && isEnrolled) {
                try {
                    const biometricSuccess = await authenticate();
                    if (biometricSuccess) {
                        showSuccess('✅ Biometria configurada com sucesso!');
                    }
                } catch (biometricError) {
                    console.warn('Erro ao configurar biometria:', biometricError);
                    showError('⚠️ Não foi possível configurar a biometria');
                }
            }

            showSuccess('🎉 Login realizado com sucesso!');

            // Aguardar um momento para o usuário ver o sucesso
            setTimeout(() => {
                router.replace('/(app)/branch-selection');
            }, 1500);

        } catch (error) {
            console.error('Erro no login:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro na autenticação';
            showError(`❌ ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAutoLogin = async (user: any) => {
        if (!user || !user.password) return;

        setIsLoading(true);
        showSuccess('🔄 Fazendo login automático...');

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

            setTimeout(() => {
                router.replace('/(app)/branch-selection');
            }, 1000);

        } catch (error) {
            console.error('Erro no auto login:', error);
            showError('❌ Erro no login automático. Faça login manualmente.');
            setShowAutoLoginOptions(false);
            setAutoLoginUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBiometricLogin = async () => {
        if (!biometricAvailable || !isEnrolled) {
            Alert.alert('Biometria Indisponível', 'Autenticação biométrica não está configurada neste dispositivo.');
            return;
        }

        if (!autoLoginUser) {
            Alert.alert('Erro', 'Nenhum usuário salvo para autenticação biométrica.');
            return;
        }

        try {
            const biometricSuccess = await authenticate();

            if (biometricSuccess) {
                await handleAutoLogin(autoLoginUser);
            } else {
                showError('❌ Falha na autenticação biométrica');
            }
        } catch (error) {
            console.error('Erro na biometria:', error);
            showError('❌ Erro na autenticação biométrica');
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
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                {/* Loading Overlay */}
                {isLoading && (
                    <LoadingSpinner
                        overlay
                        text="Autenticando..."
                        transparent
                    />
                )}

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
                    >
                        <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
                    </TouchableOpacity>

                    <View style={[styles.iconContainer, { backgroundColor: Colors.primary }]}>
                        <Ionicons name="person-outline" size={24} color="#ffffff" />
                    </View>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        Bem-vindo de volta
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                        Faça login no Meu Backoffice Protheus
                    </Text>

                    {/* Auto Login Card */}
                    {showAutoLoginOptions && autoLoginUser && (
                        <Card variant="elevated" style={[styles.autoLoginCard, { backgroundColor: `${Colors.primary}15` }]}>
                            <View style={styles.autoLoginContent}>
                                <View style={[styles.autoLoginIcon, { backgroundColor: Colors.primary }]}>
                                    <Ionicons name="person" size={20} color="#ffffff" />
                                </View>
                                <View style={styles.autoLoginInfo}>
                                    <Text style={[styles.autoLoginTitle, { color: theme.colors.text }]}>
                                        Login Rápido
                                    </Text>
                                    <Text style={[styles.autoLoginSubtitle, { color: theme.colors.textSecondary }]}>
                                        {autoLoginUser.username}
                                    </Text>
                                </View>
                            </View>

                            {biometricAvailable && isEnrolled && (
                                <Button
                                    title={`Usar ${getBiometricTypeName()}`}
                                    variant="outline"
                                    size="sm"
                                    onPress={handleBiometricLogin}
                                    leftIcon={<Ionicons name="finger-print" size={16} color={Colors.primary} />}
                                    style={styles.biometricButton}
                                />
                            )}
                        </Card>
                    )}

                    {/* Login Form */}
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Credenciais de Acesso
                        </Text>

                        <Input
                            label="Nome de usuário"
                            value={formData.username}
                            onChangeText={(value) => updateFormData('username', value)}
                            placeholder="Digite seu usuário"
                            leftIcon="person-outline"
                            autoCapitalize="none"
                            autoCorrect={false}
                            error={validationErrors.username}
                            required
                        />

                        <Input
                            label="Senha"
                            value={formData.password}
                            onChangeText={(value) => updateFormData('password', value)}
                            placeholder="Digite sua senha"
                            leftIcon="lock-closed-outline"
                            secureTextEntry
                            error={validationErrors.password}
                            required
                        />
                    </Card>

                    {/* Login Options */}
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Opções de Segurança
                        </Text>

                        <View style={styles.optionItem}>
                            <View style={styles.optionLeft}>
                                <Ionicons name="save-outline" size={20} color={Colors.primary} />
                                <View>
                                    <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                                        Salvar credenciais
                                    </Text>
                                    <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                                        Manter logado neste dispositivo
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={options.savePassword}
                                onValueChange={(value) => setOptions(prev => ({ ...prev, savePassword: value }))}
                                trackColor={{ false: theme.colors.border, true: Colors.primary }}
                                thumbColor="#ffffff"
                            />
                        </View>

                        {biometricAvailable && isEnrolled && (
                            <View style={styles.optionItem}>
                                <View style={styles.optionLeft}>
                                    <Ionicons name="finger-print-outline" size={20} color={Colors.primary} />
                                    <View>
                                        <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                                            {getBiometricTypeName()}
                                        </Text>
                                        <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                                            Login rápido e seguro
                                        </Text>
                                    </View>
                                </View>
                                <Switch
                                    value={options.enableBiometric}
                                    onValueChange={(value) => setOptions(prev => ({ ...prev, enableBiometric: value }))}
                                    trackColor={{ false: theme.colors.border, true: Colors.primary }}
                                    thumbColor="#ffffff"
                                />
                            </View>
                        )}
                    </Card>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <Button
                            title="Entrar"
                            onPress={handleLogin}
                            disabled={!isFormValid() || isLoading}
                            leftIcon={<Ionicons name="log-in-outline" size={20} color="#ffffff" />}
                            style={styles.loginButton}
                        />
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            onPress={() => {
                                Alert.alert(
                                    'Esqueceu sua senha?',
                                    'Entre em contato com o administrador do sistema para recuperar sua senha.',
                                    [{ text: 'OK' }]
                                );
                            }}
                        >
                            <Text style={[styles.linkText, { color: Colors.primary }]}>
                                Esqueceu sua senha?
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/(auth)/setup')}
                        >
                            <Text style={[styles.linkText, { color: Colors.primary }]}>
                                Configurar servidor
                            </Text>
                        </TouchableOpacity>

                        {__DEV__ && (
                            <Button
                                title="🔬 Ultra Debug"
                                variant="ghost"
                                onPress={() => router.push('/(auth)/ultra-debug')}
                                style={{ marginTop: 20 }}
                            />
                        )}



                        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                            Meu Backoffice Protheus v1.0.0
                        </Text>
                    </View>
                </ScrollView>

                {/* Toast */}
                <Toast
                    visible={visible}
                    message={message}
                    type={type}
                    onHide={hideToast}
                />
            </View>




        </SafeArea>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    autoLoginCard: {
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
    },
    autoLoginContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    autoLoginIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    autoLoginInfo: {
        flex: 1,
    },
    autoLoginTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    autoLoginSubtitle: {
        fontSize: 14,
    },
    biometricButton: {
        alignSelf: 'flex-start',
    },
    section: {
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
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
        marginBottom: 2,
    },
    optionDescription: {
        fontSize: 13,
        lineHeight: 18,
    },
    actions: {
        marginBottom: 24,
    },
    loginButton: {
        height: 56,
    },
    footer: {
        alignItems: 'center',
        gap: 16,
        paddingVertical: 24,
    },
    linkText: {
        fontSize: 16,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    footerText: {
        fontSize: 14,
        textAlign: 'center',
    },
});