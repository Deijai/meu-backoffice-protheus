// src/components/debug/UltraDebugScreen.tsx - VERSÃO MELHORADA
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { authService, AuthService } from '../../services/api/authService';
import { useConfigStore } from '../../store/configStore';
import { useThemeStore } from '../../store/themeStore';
import { useToastStore } from '../../store/toastStore';
import { Colors } from '../../styles/colors';

interface DebugLog {
    timestamp: string;
    level: 'info' | 'success' | 'warning' | 'error';
    message: string;
    data?: any;
}

export default function UltraDebugScreen() {
    const { theme } = useThemeStore();
    const { connection } = useConfigStore();
    const { showSuccess, showError, visible, message, type, hideToast } = useToastStore();

    // ✅ SUAS CREDENCIAIS CORRETAS
    const [credentials, setCredentials] = useState({
        username: 'admin',
        password: '1234', // ← SUA SENHA CORRETA
    });

    const [wrongCredentials, setWrongCredentials] = useState({
        username: 'admin',
        password: 'senha_totalmente_errada',
    });

    const [logs, setLogs] = useState<DebugLog[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const addLog = (level: DebugLog['level'], message: string, data?: any) => {
        const log: DebugLog = {
            timestamp: new Date().toLocaleTimeString(),
            level,
            message,
            data,
        };

        setLogs(prev => [...prev, log]);

        const emoji = level === 'success' ? '✅' : level === 'warning' ? '⚠️' : level === 'error' ? '❌' : 'ℹ️';
        console.log(`${emoji} [DEBUG] ${message}`, data);
    };

    const clearLogs = () => {
        setLogs([]);
        console.clear();
        console.log('🔬 === ULTRA DEBUG MODE ATIVADO ===');
    };

    /**
     * ✅ TESTE PRINCIPAL MELHORADO
     */
    const investigateProblem = async () => {
        setIsRunning(true);
        clearLogs();

        addLog('info', '🔬 INVESTIGAÇÃO COMPLETA INICIADA');

        try {
            // 1. Verificar configuração
            addLog('info', '1️⃣ Verificando configuração...');

            if (!connection.baseUrl) {
                addLog('error', 'URL base não configurada');
                showError('Configure o servidor primeiro');
                return;
            }

            addLog('success', `URL configurada: ${connection.baseUrl}`, {
                protocol: connection.protocol,
                address: connection.address,
                port: connection.port,
                endpoint: connection.endpoint,
                fullUrl: connection.baseUrl,
            });

            // 2. Limpar storage para teste limpo
            addLog('info', '2️⃣ Limpando storage para teste limpo...');
            await authService.clearStorage();
            addLog('success', 'Storage limpo');

            // 3. Verificar credenciais válidas no sistema
            addLog('info', '3️⃣ Verificando credenciais válidas...');
            const validCreds = AuthService.getValidCredentials().map(c => c.username);
            addLog('info', 'Credenciais válidas no sistema', validCreds);

            // 4. Verificar segurança do servidor
            addLog('info', '4️⃣ Verificando segurança do servidor...');

            try {
                const isSecure = await authService.checkSecurity();

                if (isSecure) {
                    addLog('success', 'Servidor SEGURO ✅ (Valida credenciais adequadamente)');
                } else {
                    addLog('warning', 'Servidor NÃO SEGURO ⚠️ (Não valida credenciais ou sempre retorna 200)');
                    addLog('warning', 'Sistema usará apenas validação local');
                }
            } catch (secError) {
                addLog('error', 'Erro ao verificar segurança', secError);
            }

            // 5. TESTE NOVO: Verificar credenciais usando método de teste
            addLog('info', '5️⃣ 🧪 TESTANDO CREDENCIAIS COM NOVO MÉTODO');

            // Teste credenciais corretas
            addLog('info', `Testando credenciais CORRETAS: ${credentials.username}/${credentials.password}`);
            try {
                const testResult = await authService.testCredentialsOnly({
                    username: credentials.username,
                    password: credentials.password,
                });

                addLog('success', 'Resultado do teste de credenciais corretas', testResult);

                if (testResult.localValid) {
                    addLog('success', '✅ Credenciais CORRETAS são válidas localmente');
                } else {
                    addLog('error', '❌ Credenciais CORRETAS são inválidas localmente (problema!)');
                }

                if (testResult.serverAvailable) {
                    addLog('success', '✅ Servidor está disponível');

                    if (testResult.serverAuthWorked) {
                        addLog('success', '✅ Servidor ACEITOU as credenciais corretas');
                    } else {
                        addLog('error', '❌ Servidor REJEITOU as credenciais corretas (problema!)');
                    }
                } else {
                    addLog('warning', '⚠️ Servidor não está disponível (mas login local funciona)');
                }
            } catch (testError) {
                addLog('error', 'Erro no teste de credenciais corretas', testError);
            }

            // Teste credenciais erradas
            addLog('info', `Testando credenciais ERRADAS: ${wrongCredentials.username}/${wrongCredentials.password}`);
            try {
                const testResult = await authService.testCredentialsOnly({
                    username: wrongCredentials.username,
                    password: wrongCredentials.password,
                });

                addLog('info', 'Resultado do teste de credenciais erradas', testResult);

                if (!testResult.localValid) {
                    addLog('success', '✅ Credenciais ERRADAS são rejeitadas localmente (correto)');
                } else {
                    addLog('error', '❌ Credenciais ERRADAS são aceitas localmente (problema!)');
                }

                if (testResult.serverAvailable) {
                    if (!testResult.serverAuthWorked) {
                        addLog('success', '✅ Servidor REJEITOU as credenciais erradas (correto)');
                    } else {
                        addLog('error', '❌ Servidor ACEITOU as credenciais erradas (problema!)');
                    }
                } else {
                    addLog('info', 'ℹ️ Servidor não disponível para testar credenciais erradas');
                }
            } catch (testError) {
                addLog('success', 'Credenciais erradas rejeitadas com erro (esperado)', testError);
            }

            // 6. TESTE COMPLETO DE LOGIN
            addLog('info', '6️⃣ 🚨 TESTE COMPLETO DE LOGIN');

            // Login com credenciais erradas (deve falhar)
            addLog('warning', 'Testando LOGIN COMPLETO com credenciais ERRADAS...');
            try {
                await authService.signIn({
                    username: wrongCredentials.username,
                    password: wrongCredentials.password,
                    keepConnected: false,
                });

                addLog('error', '🚨 PROBLEMA GRAVE! Login errado passou!');
                showError('🚨 PROBLEMA DETECTADO! Login errado passou!');

                // Fazer logout imediato
                await authService.signOut();

            } catch (wrongError: any) {
                addLog('success', '✅ Login com credenciais erradas foi rejeitado (correto)', {
                    error: wrongError.message,
                });
            }

            // Login com credenciais corretas (deve passar)
            addLog('info', 'Testando LOGIN COMPLETO com credenciais CORRETAS...');
            try {
                const authUser = await authService.signIn({
                    username: credentials.username,
                    password: credentials.password,
                    keepConnected: false,
                });

                addLog('success', '✅ Login com credenciais corretas funcionou!', {
                    username: authUser.username,
                    authType: authUser.authType,
                });

                // Fazer logout
                await authService.signOut();
                addLog('info', 'Logout após teste');

            } catch (correctError: any) {
                addLog('error', '❌ Login com credenciais corretas falhou!', {
                    error: correctError.message,
                });
            }

            // 7. Verificar estado final
            addLog('info', '7️⃣ Estado final do sistema...');
            const finalUsers = await authService.listStoredUsers();
            const finalSystemInfo = authService.getSystemInfo();

            addLog('info', `Usuários no storage: ${finalUsers.length}`);
            addLog('info', 'Info final do sistema', finalSystemInfo);

            showSuccess('✅ Investigação completa finalizada!');

        } catch (error: any) {
            addLog('error', 'Erro durante investigação', {
                message: error.message,
                stack: error.stack,
            });
        } finally {
            setIsRunning(false);
            addLog('info', '🏁 INVESTIGAÇÃO FINALIZADA');
        }
    };

    /**
     * ✅ TESTE RÁPIDO DE CREDENCIAIS (VERSÃO IONIC)
     */
    const quickTestCredentials = async (creds: any, label: string) => {
        setIsRunning(true);
        addLog('info', `🧪 TESTE RÁPIDO: ${label}...`);

        try {
            const result = await authService.testCredentialsOnly({
                username: creds.username,
                password: creds.password,
            });

            addLog('success', `Resultado ${label}`, result);

            // Avaliar resultado local
            if (label.includes('CORRETAS')) {
                if (result.localValid) {
                    showSuccess(`✅ ${label} válidas localmente`);
                } else {
                    showError(`❌ ${label} inválidas localmente`);
                }
            } else {
                if (!result.localValid) {
                    showSuccess(`✅ ${label} rejeitadas localmente (correto)`);
                } else {
                    showError(`❌ ${label} aceitas localmente (problema!)`);
                }
            }

            // Informações sobre o servidor
            if (result.serverAvailable) {
                if (label.includes('CORRETAS')) {
                    if (result.serverAuthWorked) {
                        addLog('success', 'Servidor aceitou credenciais corretas ✅');
                    } else {
                        addLog('error', 'Servidor rejeitou credenciais corretas ❌');
                    }
                } else {
                    if (!result.serverAuthWorked) {
                        addLog('success', 'Servidor rejeitou credenciais erradas ✅');
                    } else {
                        addLog('error', 'Servidor aceitou credenciais erradas ❌');
                    }
                }
            } else {
                addLog('warning', 'Servidor não está disponível');
            }

        } catch (error: any) {
            addLog('error', `Erro em ${label}`, error);
            if (label.includes('ERRADAS')) {
                showSuccess(`✅ ${label} rejeitadas com erro (esperado)`);
            } else {
                showError(`❌ Erro inesperado em ${label}`);
            }
        } finally {
            setIsRunning(false);
        }
    };

    /**
     * ✅ ADICIONAR CREDENCIAL PERSONALIZADA
     */
    const addCustomCredential = () => {
        Alert.prompt(
            'Adicionar Credencial',
            'Digite no formato: usuario:senha',
            (input) => {
                if (input && input.includes(':')) {
                    const [username, password] = input.split(':');
                    AuthService.addValidCredential(username.trim(), password.trim());
                    addLog('success', `Credencial adicionada: ${username}`);
                    showSuccess(`✅ Credencial ${username} adicionada!`);
                } else {
                    showError('❌ Formato inválido. Use: usuario:senha');
                }
            },
            'plain-text',
            'admin:1234'
        );
    };

    /**
     * ✅ MOSTRAR TODAS AS CREDENCIAIS VÁLIDAS
     */
    const showValidCredentials = () => {
        const validCreds = AuthService.getValidCredentials();
        const credsList = validCreds.map(c => `${c.username}:${c.password}`).join('\n');

        Alert.alert(
            'Credenciais Válidas no Sistema',
            credsList || 'Nenhuma credencial configurada',
            [{ text: 'OK' }]
        );
    };

    const LogItem = ({ log }: { log: DebugLog }) => {
        const getIconAndColor = () => {
            switch (log.level) {
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
            <View style={[styles.logItem, { borderLeftColor: color }]}>
                <View style={styles.logHeader}>
                    <Ionicons name={icon as any} size={16} color={color} />
                    <Text style={[styles.logTime, { color: theme.colors.textSecondary }]}>
                        {log.timestamp}
                    </Text>
                </View>

                <Text style={[styles.logMessage, { color: theme.colors.text }]}>
                    {log.message}
                </Text>

                {log.data && (
                    <TouchableOpacity
                        onPress={() => Alert.alert('Dados', JSON.stringify(log.data, null, 2))}
                        style={styles.logData}
                    >
                        <Text style={[styles.logDataText, { color: Colors.primary }]}>
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
                        🔬 Ultra Debug v2
                    </Text>
                </View>

                <ScrollView style={styles.content}>
                    {/* Status */}
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            ✅ PROBLEMA IDENTIFICADO E CORRIGIDO
                        </Text>

                        <Text style={[styles.fixedText, { color: '#22c55e' }]}>
                            Servidor não valida credenciais adequadamente!
                        </Text>

                        <Text style={[styles.explanationText, { color: theme.colors.textSecondary }]}>
                            Seu servidor Protheus aceita qualquer credencial no endpoint /healthcheck.
                            A autenticação agora usa validação local confiável primeiro.
                        </Text>

                        <View style={styles.statusRow}>
                            <View style={styles.statusItem}>
                                <Text style={[styles.statusLabel, { color: theme.colors.textSecondary }]}>
                                    Servidor:
                                </Text>
                                <Text style={[styles.statusValue, { color: theme.colors.text }]}>
                                    {connection.baseUrl || 'Não configurado'}
                                </Text>
                            </View>
                        </View>
                    </Card>

                    {/* Credenciais de Teste CORRETAS */}
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            🔑 Credenciais de Teste (CORRIGIDAS)
                        </Text>

                        <View style={styles.credsRow}>
                            <View style={styles.credsCol}>
                                <Text style={[styles.credsLabel, { color: '#22c55e' }]}>
                                    ✅ CORRETAS
                                </Text>
                                <Input
                                    value={credentials.username}
                                    onChangeText={(value: string) => setCredentials(prev => ({ ...prev, username: value }))}
                                    placeholder="admin"
                                />
                                <Input
                                    value={credentials.password}
                                    onChangeText={(value: string) => setCredentials(prev => ({ ...prev, password: value }))}
                                    placeholder="1234"
                                    secureTextEntry
                                />
                            </View>

                            <View style={styles.credsCol}>
                                <Text style={[styles.credsLabel, { color: '#ef4444' }]}>
                                    ❌ ERRADAS
                                </Text>
                                <Input
                                    value={wrongCredentials.username}
                                    onChangeText={(value: string) => setWrongCredentials(prev => ({ ...prev, username: value }))}
                                    placeholder="admin"
                                />
                                <Input
                                    value={wrongCredentials.password}
                                    onChangeText={(value: string) => setWrongCredentials(prev => ({ ...prev, password: value }))}
                                    placeholder="senha_errada"
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        <View style={styles.credsActions}>
                            <Button
                                title="📋 Ver Credenciais Válidas"
                                variant="outline"
                                size="sm"
                                onPress={showValidCredentials}
                            />
                            <Button
                                title="➕ Adicionar Credencial"
                                variant="outline"
                                size="sm"
                                onPress={addCustomCredential}
                            />
                        </View>
                    </Card>

                    {/* Testes Melhorados */}
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            🧪 Testes de Validação (Melhorados)
                        </Text>

                        <View style={styles.testButtons}>
                            <Button
                                title="🔬 INVESTIGAÇÃO COMPLETA"
                                onPress={investigateProblem}
                                loading={isRunning}
                                style={styles.primaryButton}
                            />

                            <View style={styles.testRow}>
                                <Button
                                    title="✅ Teste Corretas"
                                    variant="outline"
                                    onPress={() => quickTestCredentials(credentials, 'Credenciais CORRETAS')}
                                    loading={isRunning}
                                    style={styles.testButton}
                                />

                                <Button
                                    title="❌ Teste Erradas"
                                    variant="outline"
                                    onPress={() => quickTestCredentials(wrongCredentials, 'Credenciais ERRADAS')}
                                    loading={isRunning}
                                    style={styles.testButton}
                                />
                            </View>

                            <Button
                                title="🗑️ Reset Completo"
                                variant="outline"
                                onPress={async () => {
                                    await authService.clearStorage();
                                    clearLogs();
                                    showSuccess('Reset completo realizado');
                                }}
                                leftIcon={<Ionicons name="trash" size={18} color="#ef4444" />}
                            />

                            <Button
                                title="🧹 Limpar Logs"
                                variant="ghost"
                                onPress={clearLogs}
                                leftIcon={<Ionicons name="refresh" size={18} color={theme.colors.textSecondary} />}
                            />
                        </View>
                    </Card>

                    {/* Logs */}
                    {logs.length > 0 && (
                        <Card variant="outlined" style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                📋 Debug Log ({logs.length})
                            </Text>

                            <ScrollView style={styles.logsList} nestedScrollEnabled>
                                {logs.map((log, index) => (
                                    <LogItem key={index} log={log} />
                                ))}
                            </ScrollView>
                        </Card>
                    )}
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
    fixedText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 8,
        padding: 8,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderRadius: 6,
    },
    explanationText: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 16,
        padding: 12,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 6,
    },
    statusRow: {
        gap: 8,
    },
    statusItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
    credsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    credsCol: {
        flex: 1,
    },
    credsLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    credsActions: {
        flexDirection: 'row',
        gap: 8,
    },
    testButtons: {
        gap: 12,
    },
    primaryButton: {
        backgroundColor: '#22c55e',
    },
    testRow: {
        flexDirection: 'row',
        gap: 8,
    },
    testButton: {
        flex: 1,
    },
    logsList: {
        maxHeight: 400,
    },
    logItem: {
        borderLeftWidth: 3,
        paddingLeft: 12,
        paddingVertical: 8,
        marginBottom: 8,
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 4,
    },
    logHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    logTime: {
        fontSize: 12,
        fontFamily: 'monospace',
    },
    logMessage: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 4,
    },
    logData: {
        paddingTop: 4,
    },
    logDataText: {
        fontSize: 12,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
});