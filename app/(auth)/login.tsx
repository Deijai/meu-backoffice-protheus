import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeArea } from '../../src/components/layout/SafeArea';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { useAuth } from '../../src/hooks/useAuth';
import { useBiometric } from '../../src/hooks/useBiometric';
import { useTheme } from '../../src/hooks/useTheme';
import { useAppStore } from '../../src/store/appStore';
import { Colors } from '../../src/styles/colors';

export default function LoginScreen() {
    const { theme } = useTheme();
    const { login, biometricLogin, enableBiometric, biometricEnabled, biometricAvailable, isLoggingIn } = useAuth();
    const { getBiometricTypeName } = useBiometric();
    const { error } = useAppStore();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const [options, setOptions] = useState({
        savePassword: false,
        enableBiometric: biometricEnabled,
    });

    const [validations, setValidations] = useState({
        hasMinLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasSpecialChar: false,
        hasNumber: false,
    });

    useEffect(() => {
        setOptions(prev => ({ ...prev, enableBiometric: biometricEnabled }));
    }, [biometricEnabled]);

    useEffect(() => {
        const password = formData.password;
        setValidations({
            hasMinLength: password.length >= 6,
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
            hasNumber: /\d/.test(password),
        });
    }, [formData.password]);

    const handleLogin = async () => {
        if (!formData.username.trim()) {
            Alert.alert('Erro', 'Por favor, digite seu nome de usuário.');
            return;
        }

        if (!formData.password.trim()) {
            Alert.alert('Erro', 'Por favor, digite sua senha.');
            return;
        }

        const success = await login(formData);

        if (success) {
            if (options.enableBiometric && !biometricEnabled && biometricAvailable) {
                const biometricSuccess = await enableBiometric();
                if (!biometricSuccess) {
                    Alert.alert(
                        'Aviso',
                        'Não foi possível ativar a autenticação biométrica. Você pode ativá-la posteriormente nas configurações.'
                    );
                }
            }

            router.replace('/(app)/branch-selection');
        }
    };

    const handleBiometricLogin = async () => {
        const success = await biometricLogin();

        if (success) {
            router.replace('/(app)/branch-selection');
        } else {
            Alert.alert('Erro', 'Falha na autenticação biométrica.');
        }
    };

    const updateFormData = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const ValidationItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
        <View style={styles.validationItem}>
            <Ionicons
                name={isValid ? "checkmark-circle" : "ellipse-outline"}
                size={16}
                color={isValid ? "#38a169" : theme.colors.border}
            />
            <Text style={[
                styles.validationText,
                {
                    color: isValid ? "#38a169" : theme.colors.textSecondary,
                    fontWeight: isValid ? '500' : '400'
                }
            ]}>
                {text}
            </Text>
        </View>
    );

    const isFormValid = formData.username.trim() && formData.password.trim();

    return (
        <SafeArea>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                {/* Header */}
                <View style={styles.header}>
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
                        //required
                        />

                        <Input
                            label="Senha"
                            value={formData.password}
                            onChangeText={(value) => updateFormData('password', value)}
                            placeholder="Digite sua senha"
                            leftIcon="lock-closed-outline"
                            secureTextEntry
                        //required
                        />

                        {/* Password Validations */}
                        {formData.password.length > 0 && (
                            <Card variant="outlined" style={styles.validationsCard}>
                                <Text style={[styles.validationsTitle, { color: theme.colors.text }]}>
                                    Requisitos da senha:
                                </Text>
                                <View style={styles.validationsList}>
                                    <ValidationItem
                                        isValid={validations.hasMinLength}
                                        text="Conter no mínimo 6 caracteres"
                                    />
                                    <ValidationItem
                                        isValid={validations.hasUpperCase}
                                        text="Conter uma letra maiúscula"
                                    />
                                    <ValidationItem
                                        isValid={validations.hasLowerCase}
                                        text="Conter uma letra minúscula"
                                    />
                                    <ValidationItem
                                        isValid={validations.hasSpecialChar}
                                        text="Conter um caractere especial"
                                    />
                                    <ValidationItem
                                        isValid={validations.hasNumber}
                                        text="Conter um número"
                                    />
                                </View>
                            </Card>
                        )}
                    </Card>

                    {/* Login Options */}
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Opções de Login
                        </Text>

                        <View style={styles.optionItem}>
                            <View style={styles.optionLeft}>
                                <Ionicons name="save-outline" size={20} color={Colors.primary} />
                                <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                                    Salvar senha
                                </Text>
                            </View>
                            <Switch
                                value={options.savePassword}
                                onValueChange={(value) => setOptions(prev => ({ ...prev, savePassword: value }))}
                                trackColor={{ false: theme.colors.border, true: Colors.primary }}
                                thumbColor="#ffffff"
                            />
                        </View>

                        {biometricAvailable && (
                            <View style={styles.optionItem}>
                                <View style={styles.optionLeft}>
                                    <Ionicons name="finger-print-outline" size={20} color={Colors.primary} />
                                    <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                                        Ativar {getBiometricTypeName()}
                                    </Text>
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

                    {/* Error Display */}
                    {error && (
                        <Card variant="outlined" style={[styles.errorCard, { borderColor: '#ef4444' }]}>
                            <View style={styles.errorContent}>
                                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                                <Text style={[styles.errorText, { color: '#ef4444' }]}>
                                    {error}
                                </Text>
                            </View>
                        </Card>
                    )}

                    {/* Actions */}
                    <View style={styles.actions}>
                        <Button
                            title="Entrar"
                            onPress={handleLogin}
                            loading={isLoggingIn}
                            disabled={!isFormValid}
                            leftIcon={<Ionicons name="log-in-outline" size={20} color="#ffffff" />}
                            style={styles.loginButton}
                        />

                        {biometricEnabled && biometricAvailable && (
                            <>
                                <View style={styles.divider}>
                                    <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
                                    <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>
                                        ou
                                    </Text>
                                    <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
                                </View>

                                <Button
                                    title={`Entrar com ${getBiometricTypeName()}`}
                                    variant="outline"
                                    onPress={handleBiometricLogin}
                                    leftIcon={
                                        <Ionicons
                                            name="finger-print-outline"
                                            size={20}
                                            color={Colors.primary}
                                        />
                                    }
                                />
                            </>
                        )}
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity>
                            <Text style={[styles.linkText, { color: Colors.primary }]}>
                                Esqueceu sua senha?
                            </Text>
                        </TouchableOpacity>

                        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                            Meu Backoffice Protheus v1.0.0 - TOTVS
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </SafeArea>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
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
    section: {
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    validationsCard: {
        padding: 12,
        marginTop: 16,
        backgroundColor: 'transparent',
    },
    validationsTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    validationsList: {
        gap: 8,
    },
    validationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    validationText: {
        fontSize: 14,
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
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    errorCard: {
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    errorContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    errorText: {
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    actions: {
        gap: 16,
        marginBottom: 24,
    },
    loginButton: {
        height: 56,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        fontSize: 14,
    },
    footer: {
        alignItems: 'center',
        gap: 16,
        paddingVertical: 24,
    },
    linkText: {
        fontSize: 16,
        fontWeight: '600',
    },
    footerText: {
        fontSize: 14,
        textAlign: 'center',
    },
});