// src/screens/debug/UltraDebugScreen.tsx
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

    const [credentials, setCredentials] = useState({
        username: 'admin',
        password: '123456',
    });

    const [wrongCredentials, setWrongCredentials] = useState({
        username: 'admin',
        password: 'SENHA_ERRADA_123',
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

    // 🚨 TESTE PRINCIPAL - Investigar o problema
    const investigateProblem = async () => {
        setIsRunning(true);
        clearLogs();

        addLog('info', '🔬 INICIANDO INVESTIGAÇÃO DO PROBLEMA');

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

            // 3. Verificar segurança do servidor
            addLog('info', '3️⃣ Verificando segurança do servidor...');

            try {
                const isSecure = await authService.checkSecurity();

                if (isSecure) {
                    addLog('success', 'Servidor SEGURO ✅ (Status 401)');
                } else {
                    addLog('warning', 'Servidor NÃO SEGURO ⚠️ (Ping funcionou)');
                    addLog('warning', 'Isso pode explicar por que senhas erradas passam!');
                }
            } catch (secError) {
                addLog('error', 'Erro ao verificar segurança', secError);
            }

            // 4. TESTE COM CREDENCIAIS ERRADAS (deve falhar)
            addLog('info', '4️⃣ 🚨 TESTANDO CREDENCIAIS ERRADAS (DEVE FALHAR)');
            addLog('warning', `Testando: ${wrongCredentials.username} / ${wrongCredentials.password}`);

            try {
                // Usar método ultra rigoroso (sem fallback)
                const resultWrong = await authService.signIn({
                    username: wrongCredentials.username,
                    password: wrongCredentials.password,
                    keepConnected: false,
                    //forceOffline: false, // Força servidor
                });

                // 🚨 SE CHEGOU AQUI, TEM PROBLEMA GRAVE!
                addLog('error', '🚨 PROBLEMA GRAVE! Credenciais erradas foram ACEITAS!', {
                    username: resultWrong.username,
                    authType: resultWrong.authType,
                });

                showError('🚨 PROBLEMA DETECTADO! Credenciais erradas passaram!');

                // Fazer logout imediato
                await authService.signOut();

                // Investigar por que passou
                addLog('error', '🔍 Investigando por que credenciais erradas passaram...');

                // Verificar se foi para storage offline
                const usersAfter = await authService.listStoredUsers();
                if (usersAfter.length > 0) {
                    addLog('error', '❌ Sistema criou usuário com credenciais erradas no storage!');
                } else {
                    addLog('info', 'Storage ainda está vazio');
                }

            } catch (wrongError: any) {
                // ISSO É O COMPORTAMENTO ESPERADO
                addLog('success', '✅ CORRETO! Credenciais erradas foram REJEITADAS', {
                    error: wrongError.message,
                });

                showSuccess('✅ Validação funcionando - credenciais erradas rejeitadas');
            }

            // 5. TESTE COM CREDENCIAIS CORRETAS (deve passar)
            addLog('info', '5️⃣ ✅ TESTANDO CREDENCIAIS CORRETAS (DEVE PASSAR)');
            addLog('info', `Testando: ${credentials.username} / ${credentials.password}`);

            try {
                const resultCorrect = await authService.signIn({
                    username: credentials.username,
                    password: credentials.password,
                    keepConnected: false,
                    //forceOffline: false,
                });

                addLog('success', '✅ CORRETO! Credenciais corretas foram ACEITAS', {
                    username: resultCorrect.username,
                    authType: resultCorrect.authType,
                });

                // Fazer logout
                await authService.signOut();
                addLog('info', 'Logout após teste');

            } catch (correctError: any) {
                addLog('error', '❌ PROBLEMA! Credenciais corretas foram REJEITADAS', {
                    error: correctError.message,
                });

                showError('❌ Credenciais corretas falharam!');
            }

            // 6. Verificar estado final
            addLog('info', '6️⃣ Verificando estado final...');

            const finalUsers = await authService.listStoredUsers();
            addLog('info', `Usuários no storage: ${finalUsers.length}`);

            const systemInfo = authService.getSystemInfo();
            addLog('info', 'Info do sistema', systemInfo);

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

    // 🧪 Teste direto no servidor (bypass authService)
    const testDirectServer = async () => {
        setIsRunning(true);
        addLog('info', '🧪 TESTE DIRETO NO SERVIDOR (BYPASS AUTHSERVICE)');

        try {
            httpService.updateBaseURL();
            const baseURL = httpService.getBaseURL();

            addLog('info', `URL base: ${baseURL}`);

            // Teste direto com axios
            const authHeader = btoa(`${wrongCredentials.username}:${wrongCredentials.password}`);

            addLog('info', 'Fazendo requisição direta com credenciais ERRADAS...');

            try {
                const response = await fetch(`${baseURL}/healthcheck`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Basic ${authHeader}`,
                        'Content-Type': 'application/json',
                    },
                    //timeout: 10000,
                });

                addLog('error', `🚨 SERVIDOR ACEITOU CREDENCIAIS ERRADAS! Status: ${response.status}`, {
                    status: response.status,
                    statusText: response.statusText,
                });

                const responseText = await response.text();
                addLog('error', 'Resposta do servidor', responseText);

                showError('🚨 Servidor não está validando credenciais!');

            } catch (directError: any) {
                addLog('success', '✅ Servidor rejeitou credenciais erradas (correto)', {
                    status: directError.status,
                    message: directError.message,
                });
            }

        } catch (error) {
            addLog('error', 'Erro no teste direto', error);
        } finally {
            setIsRunning(false);
        }
    };

    // 🗑️ Limpar tudo e recomeçar
    const resetEverything = async () => {
        Alert.alert(
            'Reset Completo',
            'Isso vai limpar TODOS os dados salvos. Tem certeza?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        addLog('warning', '🗑️ RESET COMPLETO INICIADO');

                        await authService.clearStorage();
                        addLog('success', 'Storage limpo');

                        clearLogs();
                        showSuccess('Reset completo realizado');
                    },
                },
            ]
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
                        🔬 Ultra Debug
                    </Text>
                </View>

                <ScrollView style={styles.content}>
                    {/* Status */}
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            🚨 INVESTIGAR PROBLEMA
                        </Text>

                        <Text style={[styles.problemText, { color: '#ef4444' }]}>
                            Problema: App está aceitando senhas erradas
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

                    {/* Credenciais de Teste */}
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            🔑 Credenciais de Teste
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
                                    placeholder="123456"
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
                                    placeholder="SENHA_ERRADA"
                                    secureTextEntry
                                />
                            </View>
                        </View>
                    </Card>

                    {/* Testes */}
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            🧪 Testes de Investigação
                        </Text>

                        <View style={styles.testButtons}>
                            <Button
                                title="🔬 INVESTIGAR PROBLEMA"
                                onPress={investigateProblem}
                                loading={isRunning}
                                style={styles.primaryButton}
                            />

                            <Button
                                title="🧪 Teste Direto Servidor"
                                variant="outline"
                                onPress={testDirectServer}
                                loading={isRunning}
                                style={styles.testButton}
                            />

                            <Button
                                title="🗑️ Reset Completo"
                                variant="outline"
                                onPress={resetEverything}
                                leftIcon={<Ionicons name="trash" size={18} color="#ef4444" />}
                                style={styles.testButton}
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
    problemText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 16,
        padding: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
    testButtons: {
        gap: 12,
    },
    primaryButton: {
        backgroundColor: '#ef4444',
    },
    testButton: {
        // Default styling
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