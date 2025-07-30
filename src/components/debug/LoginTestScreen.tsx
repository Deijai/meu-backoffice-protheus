// src/screens/debug/LoginTestScreen.tsx - VERSÃO MELHORADA
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { authService } from '../../services/api/authService';
import { httpService } from '../../services/api/httpService';
import { useConfigStore } from '../../store/configStore';
import { useThemeStore } from '../../store/themeStore';
import { useToastStore } from '../../store/toastStore';
import { Colors } from '../../styles/colors';

interface TestResult {
    step: string;
    success: boolean;
    message: string;
    data?: any;
    timestamp: string;
    level: 'info' | 'success' | 'warning' | 'error';
}

export default function LoginTestScreen() {
    const { theme } = useThemeStore();
    const { connection } = useConfigStore();
    const { showSuccess, showError, showWarning, visible, message, type, hideToast } = useToastStore();

    const [credentials, setCredentials] = useState({
        username: 'admin',
        password: '123456',
    });

    const [wrongCredentials, setWrongCredentials] = useState({
        username: 'admin',
        password: 'senha-errada-123',
    });

    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const addResult = (
        step: string,
        success: boolean,
        message: string,
        data?: any,
        level: TestResult['level'] = success ? 'success' : 'error'
    ) => {
        const result: TestResult = {
            step,
            success,
            message,
            data,
            timestamp: new Date().toLocaleTimeString(),
            level,
        };

        setTestResults(prev => [...prev, result]);

        const emoji = level === 'success' ? '✅' : level === 'warning' ? '⚠️' : level === 'error' ? '❌' : 'ℹ️';
        console.log(`${emoji} ${step}: ${message}`, data);
    };

    const clearResults = () => {
        setTestResults([]);
        console.clear();
        console.log('🧪 === DEBUG LOGIN SYSTEM INICIADO ===');
    };

    // TESTE PRINCIPAL - Validação rigorosa
    const runValidationTest = async () => {
        setIsRunning(true);
        clearResults();

        addResult('Início', true, 'Iniciando teste de validação rigorosa', null, 'info');

        try {
            // 1. Verificar configuração
            if (!connection.baseUrl) {
                addResult('Config', false, 'URL base não configurada - Configure em Setup', connection);
                showError('❌ Configure o servidor REST primeiro');
                return;
            }

            addResult('Config', true, `URL configurada: ${connection.baseUrl}`, {
                protocol: connection.protocol,
                address: connection.address,
                port: connection.port,
                endpoint: connection.endpoint,
            });

            // 2. Atualizar httpService
            httpService.updateBaseURL();
            addResult('HttpService', true, `HttpService configurado`, {
                baseURL: httpService.getBaseURL(),
            });

            // 3. Teste de segurança
            addResult('Security', true, 'Testando segurança do servidor...', null, 'info');

            try {
                const isSecure = await authService.checkSecurity();

                if (isSecure) {
                    addResult('Security', true, 'Servidor SEGURO ✅ (Status 401 retornado)', { secure: true });
                } else {
                    addResult('Security', false, 'Servidor NÃO SEGURO ❌ (Ping funcionou)', { secure: false });
                    showError('❌ Servidor não está protegido!');
                    return;
                }
            } catch (secError) {
                addResult('Security', false, 'Erro ao verificar segurança', secError);
                return;
            }

            // 4. TESTE COM CREDENCIAIS CORRETAS
            addResult('LoginCorreto', true, 'Testando com credenciais CORRETAS...', credentials, 'info');

            try {
                const authUser = await authService.signIn({
                    username: credentials.username,
                    password: credentials.password,
                    keepConnected: false,
                });

                addResult('LoginCorreto', true, 'Login CORRETO funcionou ✅', {
                    username: authUser.username,
                    authType: authUser.authType,
                    lastLogin: authUser.lastLogin,
                }, 'success');

                // Logout imediato para não afetar testes
                await authService.signOut();
                addResult('LogoutTeste', true, 'Logout após teste', null, 'info');

            } catch (loginError: any) {
                addResult('LoginCorreto', false, 'Login CORRETO falhou (erro no servidor)', {
                    error: loginError.message,
                    status: loginError.response?.status,
                    data: loginError.response?.data,
                });

                // Não continuar se nem credenciais corretas funcionam
                showError('❌ Credenciais corretas falharam - verifique servidor');
                return;
            }

            // 5. TESTE COM CREDENCIAIS ERRADAS
            addResult('LoginErrado', true, 'Testando com credenciais ERRADAS...', wrongCredentials, 'warning');

            try {
                const authUserWrong = await authService.signIn({
                    username: wrongCredentials.username,
                    password: wrongCredentials.password,
                    keepConnected: false,
                });

                // Se chegou aqui, tem problema! Login errado passou
                addResult('LoginErrado', false, '🚨 PROBLEMA! Login ERRADO passou - sistema não está validando credenciais!', {
                    username: authUserWrong.username,
                    authType: authUserWrong.authType,
                }, 'error');

                showError('🚨 PROBLEMA DETECTADO! Credenciais erradas foram aceitas!');

                // Fazer logout
                await authService.signOut();

            } catch (wrongLoginError: any) {
                // Isso é o comportamento esperado
                addResult('LoginErrado', true, 'Login ERRADO foi rejeitado ✅ (comportamento correto)', {
                    error: wrongLoginError.message,
                    status: wrongLoginError.response?.status,
                }, 'success');

                showSuccess('✅ Validação funcionando - credenciais erradas foram rejeitadas');
            }

            // 6. Teste de storage
            const storedUsers = await authService['getStoredUsers']();
            addResult('Storage', true, `${storedUsers.length} usuário(s) no storage`, {
                users: storedUsers.map(u => ({ username: u.username, keepConnected: u.keepConnected })),
            });

            // 7. Teste de auto login
            const autoUser = await authService.checkAutoLogin();
            if (autoUser) {
                addResult('AutoLogin', true, 'Auto login disponível', {
                    username: autoUser.username,
                    keepConnected: autoUser.keepConnected,
                    hasPassword: !!autoUser.password,
                });
            } else {
                addResult('AutoLogin', true, 'Nenhum auto login configurado', null, 'info');
            }

        } catch (error) {
            addResult('Erro Geral', false, 'Erro durante teste de validação', error);
        } finally {
            setIsRunning(false);
            addResult('Fim', true, 'Teste de validação finalizado', null, 'info');
        }
    };

    // TESTE RÁPIDO - Apenas ping
    const testPingOnly = async () => {
        setIsRunning(true);
        addResult('PingOnly', true, 'Testando apenas segurança do servidor...', null, 'info');

        try {
            const isSecure = await authService.checkSecurity();

            if (isSecure) {
                showSuccess('✅ Servidor seguro! (Retornou 401)');
                addResult('PingOnly', true, 'Servidor seguro - Status 401', { secure: true });
            } else {
                showError('❌ Servidor NÃO seguro! (Ping funcionou)');
                addResult('PingOnly', false, 'Servidor não seguro - Ping retornou 200', { secure: false });
            }
        } catch (error) {
            showError('❌ Erro no teste de segurança');
            addResult('PingOnly', false, 'Erro no teste de segurança', error);
        } finally {
            setIsRunning(false);
        }
    };

    // TESTE DE CREDENCIAIS ESPECÍFICO
    const testSpecificCredentials = async (creds: any, label: string) => {
        setIsRunning(true);
        addResult(`Test${label}`, true, `Testando ${label.toLowerCase()}...`, creds, 'info');

        try {
            httpService.updateBaseURL();

            const authUser = await authService.signIn({
                username: creds.username,
                password: creds.password,
                keepConnected: false,
            });

            showSuccess(`✅ ${label} funcionou`);
            addResult(`Test${label}`, true, `${label} aceito pelo servidor`, {
                username: authUser.username,
                authType: authUser.authType,
            });

            // Logout imediato
            await authService.signOut();

        } catch (error: any) {
            const isExpectedError = error.message?.includes('incorretos') || error.response?.status === 401;

            if (label === 'Credenciais Erradas' && isExpectedError) {
                showSuccess(`✅ ${label} rejeitadas corretamente`);
                addResult(`Test${label}`, true, `${label} rejeitadas (correto)`, {
                    error: error.message,
                    status: error.response?.status,
                });
            } else {
                showError(`❌ Erro em ${label}`);
                addResult(`Test${label}`, false, `Erro em ${label}`, {
                    error: error.message,
                    status: error.response?.status,
                });
            }
        } finally {
            setIsRunning(false);
        }
    };

    const ResultItem = ({ result }: { result: TestResult }) => {
        const getIconAndColor = () => {
            switch (result.level) {
                case 'success':
                    return { icon: 'checkmark-circle', color: '#22c55e' };
                case 'warning':
                    return { icon: 'warning', color: '#f59e0b' };
                case 'error':
                    return { icon: 'close-circle', color: '#ef4444' };
                default:
                    return { icon: 'information-circle', color: '#3b82f6' };
            }
        };

        const { icon, color } = getIconAndColor();

        return (
            <View style={[styles.resultItem, { borderColor: theme.colors.border, borderLeftColor: color }]}>
                <View style={styles.resultHeader}>
                    <Ionicons name={icon as any} size={18} color={color} />
                    <Text style={[styles.resultStep, { color: theme.colors.text }]}>
                        {result.step}
                    </Text>
                    <Text style={[styles.resultTime, { color: theme.colors.textSecondary }]}>
                        {result.timestamp}
                    </Text>
                </View>

                <Text style={[styles.resultMessage, { color: theme.colors.textSecondary }]}>
                    {result.message}
                </Text>

                {result.data && (
                    <TouchableOpacity
                        style={styles.resultData}
                        onPress={() => Alert.alert('Dados do Teste', JSON.stringify(result.data, null, 2))}
                    >
                        <Text style={[styles.resultDataText, { color: Colors.primary }]}>
                            Ver dados →
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeArea>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
                    >
                        <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
                    </TouchableOpacity>

                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                        🔬 Debug Validação
                    </Text>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Status da Configuração */}
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            📡 Status Atual
                        </Text>

                        <View style={styles.statusGrid}>
                            <View style={styles.statusItem}>
                                <Text style={[styles.statusLabel, { color: theme.colors.textSecondary }]}>
                                    Servidor:
                                </Text>
                                <Text style={[styles.statusValue, { color: theme.colors.text }]}>
                                    {connection.baseUrl || 'Não configurado'}
                                </Text>
                            </View>

                            <View style={styles.statusItem}>
                                <Text style={[styles.statusLabel, { color: theme.colors.textSecondary }]}>
                                    Status:
                                </Text>
                                <Text style={[
                                    styles.statusValue,
                                    { color: connection.isConnected ? '#22c55e' : '#ef4444' }
                                ]}>
                                    {connection.isConnected ? '✅ Conectado' : '❌ Desconectado'}
                                </Text>
                            </View>
                        </View>
                    </Card>

                    {/* Credenciais de Teste */}
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            🔑 Credenciais de Teste
                        </Text>

                        <View style={styles.credentialsRow}>
                            <View style={styles.credentialsCol}>
                                <Text style={[styles.credentialsLabel, { color: '#22c55e' }]}>
                                    ✅ Credenciais Corretas
                                </Text>
                                <Input
                                    label="Usuário"
                                    value={credentials.username}
                                    onChangeText={(value) => setCredentials(prev => ({ ...prev, username: value }))}
                                //size="sm"
                                />
                                <Input
                                    label="Senha"
                                    value={credentials.password}
                                    onChangeText={(value) => setCredentials(prev => ({ ...prev, password: value }))}
                                    secureTextEntry
                                //size="sm"
                                />
                            </View>

                            <View style={styles.credentialsCol}>
                                <Text style={[styles.credentialsLabel, { color: '#ef4444' }]}>
                                    ❌ Credenciais Erradas
                                </Text>
                                <Input
                                    label="Usuário"
                                    value={wrongCredentials.username}
                                    onChangeText={(value) => setWrongCredentials(prev => ({ ...prev, username: value }))}
                                //size="sm"
                                />
                                <Input
                                    label="Senha"
                                    value={wrongCredentials.password}
                                    onChangeText={(value) => setWrongCredentials(prev => ({ ...prev, password: value }))}
                                    secureTextEntry
                                //size="sm"
                                />
                            </View>
                        </View>
                    </Card>

                    {/* Testes */}
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            🧪 Testes de Validação
                        </Text>

                        <View style={styles.buttonsGrid}>
                            <Button
                                title="🔬 Teste Completo"
                                onPress={runValidationTest}
                                loading={isRunning}
                                style={styles.testButton}
                            />

                            <Button
                                title="📡 Ping"
                                variant="outline"
                                onPress={testPingOnly}
                                loading={isRunning}
                                style={styles.testButton}
                            />

                            <Button
                                title="✅ Creds Corretas"
                                variant="outline"
                                onPress={() => testSpecificCredentials(credentials, 'Credenciais Corretas')}
                                loading={isRunning}
                                style={styles.testButton}
                            />

                            <Button
                                title="❌ Creds Erradas"
                                variant="outline"
                                onPress={() => testSpecificCredentials(wrongCredentials, 'Credenciais Erradas')}
                                loading={isRunning}
                                style={styles.testButton}
                            />
                        </View>

                        <Button
                            title="🗑️ Limpar"
                            variant="ghost"
                            onPress={clearResults}
                            leftIcon={<Ionicons name="trash" size={18} color={theme.colors.textSecondary} />}
                        />
                    </Card>

                    {/* Resultados */}
                    {testResults.length > 0 && (
                        <Card variant="outlined" style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                📊 Resultados ({testResults.length})
                            </Text>

                            <ScrollView style={styles.resultsList} nestedScrollEnabled>
                                {testResults.map((result, index) => (
                                    <ResultItem key={index} result={result} />
                                ))}
                            </ScrollView>
                        </Card>
                    )}

                    {/* Ações Rápidas */}
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            ⚡ Navegação
                        </Text>

                        <View style={styles.quickActions}>
                            <Button
                                title="Setup"
                                variant="outline"
                                onPress={() => router.push('/(auth)/setup')}
                                leftIcon={<Ionicons name="settings" size={18} color={Colors.primary} />}
                                style={styles.quickButton}
                            />

                            <Button
                                title="Login"
                                variant="outline"
                                onPress={() => router.push('/(auth)/login')}
                                leftIcon={<Ionicons name="person" size={18} color={Colors.primary} />}
                                style={styles.quickButton}
                            />
                        </View>
                    </Card>
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
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    section: {
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    statusGrid: {
        gap: 8,
    },
    statusItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    statusLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    statusValue: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    credentialsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    credentialsCol: {
        flex: 1,
    },
    credentialsLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    buttonsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    testButton: {
        flex: 1,
        minWidth: '48%',
    },
    quickActions: {
        flexDirection: 'row',
        gap: 8,
    },
    quickButton: {
        flex: 1,
    },
    resultsList: {
        maxHeight: 400,
    },
    resultItem: {
        borderWidth: 1,
        borderRadius: 8,
        borderLeftWidth: 4,
        padding: 12,
        marginBottom: 8,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    resultStep: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
    },
    resultTime: {
        fontSize: 12,
    },
    resultMessage: {
        fontSize: 13,
        lineHeight: 18,
        marginLeft: 26,
        marginBottom: 4,
    },
    resultData: {
        marginLeft: 26,
    },
    resultDataText: {
        fontSize: 12,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
});