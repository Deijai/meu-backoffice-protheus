// src/components/debug/UltraDebugScreen.tsx - TOAST CORRIGIDO
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
import { restValidator } from '../../services/api/restValidator';
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
    const { showSuccess, showError, showWarning, visible, message, type, hideToast } = useToastStore();

    // Credenciais de teste OAuth2
    const [credentials, setCredentials] = useState({
        username: 'admin',
        password: '1234',
    });

    const [wrongCredentials, setWrongCredentials] = useState({
        username: 'admin',
        password: 'senha_errada_oauth2',
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
        console.log(`${emoji} [OAUTH2 DEBUG] ${message}`, data);
    };

    const clearLogs = () => {
        setLogs([]);
        console.clear();
        console.log('🔬 === OAUTH2 PROTHEUS DEBUG MODE ATIVADO ===');
    };

    /**
     * Teste completo OAuth2 Protheus - TOAST CORRIGIDO
     */
    const testCompleteOAuth2Flow = async () => {
        setIsRunning(true);
        clearLogs();

        addLog('info', '🔬 TESTE COMPLETO OAUTH2 PROTHEUS INICIADO');

        try {
            // 1. Verificar configuração
            addLog('info', '1️⃣ Verificando configuração OAuth2...');

            if (!connection.baseUrl) {
                addLog('error', 'URL base OAuth2 não configurada');
                showError('❌ Configure o servidor OAuth2 primeiro');
                return;
            }

            const oauthUrl = `${connection.baseUrl}/api/oauth2/v1/token?grant_type=password`;
            addLog('success', `URL OAuth2 configurada: ${oauthUrl}`, {
                baseUrl: connection.baseUrl,
                oauthEndpoint: oauthUrl,
                protocol: connection.protocol,
                address: connection.address,
                port: connection.port,
                endpoint: connection.endpoint,
            });

            // 2. Limpar storage para teste limpo
            addLog('info', '2️⃣ Limpando storage OAuth2...');
            await authService.clearStorage();
            addLog('success', 'Storage OAuth2 limpo');

            // 3. Testar conectividade básica do endpoint OAuth2
            addLog('info', '3️⃣ Testando conectividade OAuth2...');

            try {
                const connectivityResult = await restValidator.testConnection({
                    protocol: connection.protocol,
                    address: connection.address,
                    port: connection.port,
                    endpoint: connection.endpoint,
                });

                if (connectivityResult.success) {
                    addLog('success', 'Conectividade OAuth2 OK', {
                        url: connectivityResult.url,
                        status: connectivityResult.statusCode,
                        data: connectivityResult.data,
                    });
                } else {
                    addLog('error', 'Falha na conectividade OAuth2', {
                        error: connectivityResult.error,
                        url: connectivityResult.url,
                    });
                    showError('❌ Servidor OAuth2 não acessível');
                    return;
                }
            } catch (connectError) {
                addLog('error', 'Erro na conectividade OAuth2', connectError);
                return;
            }

            // 4. Verificar segurança OAuth2
            addLog('info', '4️⃣ Verificando segurança OAuth2...');

            try {
                const isSecure = await authService.checkSecurity();

                if (isSecure) {
                    addLog('success', 'Servidor OAuth2 SEGURO ✅ (Valida credenciais adequadamente)');
                } else {
                    addLog('warning', 'Servidor OAuth2 pode não estar validando credenciais adequadamente');
                }
            } catch (secError) {
                addLog('error', 'Erro ao verificar segurança OAuth2', secError);
            }

            // 5. TESTE CREDENCIAIS ERRADAS (deve falhar) - TOAST CORRIGIDO
            addLog('info', '5️⃣ 🧪 TESTANDO CREDENCIAIS ERRADAS OAuth2');
            addLog('warning', `Testando credenciais ERRADAS: ${wrongCredentials.username}/${wrongCredentials.password}`);

            try {
                const wrongResult = await authService.testCredentialsOnly({
                    username: wrongCredentials.username,
                    password: wrongCredentials.password,
                });

                if (wrongResult.success) {
                    // PROBLEMA DETECTADO - credenciais erradas foram aceitas
                    addLog('error', '🚨 PROBLEMA! OAuth2 aceitou credenciais ERRADAS!', wrongResult.data);
                    showError('🚨 PROBLEMA DETECTADO! Servidor OAuth2 aceitou credenciais erradas!');
                } else {
                    // COMPORTAMENTO CORRETO - credenciais erradas foram rejeitadas
                    addLog('success', '✅ OAuth2 rejeitou credenciais ERRADAS (correto)', {
                        error: wrongResult.error,
                    });
                    showSuccess('✅ Validação funcionando - credenciais erradas rejeitadas');
                }
            } catch (wrongError: any) {
                // COMPORTAMENTO CORRETO - erro ao tentar credenciais erradas
                addLog('success', '✅ OAuth2 rejeitou credenciais ERRADAS com erro (esperado)', {
                    error: wrongError.message,
                });
                showSuccess('✅ Validação funcionando - erro esperado para credenciais erradas');
            }

            // 6. TESTE CREDENCIAIS CORRETAS (deve passar) - TOAST CORRIGIDO
            addLog('info', '6️⃣ 🧪 TESTANDO CREDENCIAIS CORRETAS OAuth2');
            addLog('info', `Testando credenciais CORRETAS: ${credentials.username}/${credentials.password}`);

            try {
                const correctResult = await authService.testCredentialsOnly({
                    username: credentials.username,
                    password: credentials.password,
                });

                if (correctResult.success) {
                    // COMPORTAMENTO CORRETO - credenciais corretas foram aceitas
                    addLog('success', '✅ OAuth2 aceitou credenciais CORRETAS!', correctResult.data);
                    showSuccess('✅ Credenciais corretas funcionando!');

                    // Validar token recebido
                    if (correctResult.data?.access_token) {
                        addLog('success', '🔑 Token OAuth2 recebido', {
                            token_type: correctResult.data.token_type,
                            expires_in: correctResult.data.expires_in,
                            access_token_length: correctResult.data.access_token.length,
                            has_refresh_token: !!correctResult.data.refresh_token,
                        });
                    } else {
                        addLog('warning', '⚠️ Token OAuth2 não encontrado na resposta');
                    }
                } else {
                    // PROBLEMA DETECTADO - credenciais corretas foram rejeitadas
                    addLog('error', '❌ OAuth2 rejeitou credenciais CORRETAS (problema!)', {
                        error: correctResult.error,
                    });
                    showError('❌ PROBLEMA! Credenciais corretas foram rejeitadas');
                }
            } catch (correctError: any) {
                // PROBLEMA DETECTADO - erro inesperado com credenciais corretas
                addLog('error', '❌ Erro inesperado com credenciais CORRETAS', {
                    error: correctError.message,
                });
                showError('❌ Erro inesperado com credenciais corretas');
            }

            // 7. TESTE LOGIN COMPLETO OAuth2 - TOAST CORRIGIDO
            addLog('info', '7️⃣ 🚨 TESTE LOGIN COMPLETO OAuth2');

            // Login com credenciais erradas (deve falhar)
            addLog('warning', 'Testando LOGIN COMPLETO OAuth2 com credenciais ERRADAS...');
            try {
                await authService.signIn({
                    username: wrongCredentials.username,
                    password: wrongCredentials.password,
                    keepConnected: false,
                });

                // Se chegou aqui, é um problema - login errado passou
                addLog('error', '🚨 PROBLEMA GRAVE! Login OAuth2 errado passou!');
                showError('🚨 PROBLEMA DETECTADO! Login OAuth2 errado passou!');

                // Fazer logout imediato
                await authService.signOut();

            } catch (wrongLoginError: any) {
                // Comportamento correto - login errado foi rejeitado
                addLog('success', '✅ Login OAuth2 com credenciais erradas foi rejeitado (correto)', {
                    error: wrongLoginError.message,
                });
                showSuccess('✅ Login com credenciais erradas rejeitado corretamente');
            }

            // Login com credenciais corretas (deve passar)
            addLog('info', 'Testando LOGIN COMPLETO OAuth2 com credenciais CORRETAS...');
            try {
                const authUser = await authService.signIn({
                    username: credentials.username,
                    password: credentials.password,
                    keepConnected: false,
                });

                // Comportamento correto - login correto passou
                addLog('success', '✅ Login OAuth2 com credenciais corretas funcionou!', {
                    username: authUser.username,
                    authType: authUser.authType,
                    token_type: authUser.token_type,
                    expires_in: authUser.expires_in,
                    tokenExpiresAt: authUser.tokenExpiresAt,
                    hasRefreshToken: !!authUser.refresh_token,
                });
                showSuccess('✅ Login com credenciais corretas funcionou!');

                // Fazer logout
                await authService.signOut();
                addLog('info', 'Logout OAuth2 após teste');

            } catch (correctLoginError: any) {
                // Problema - login correto falhou
                addLog('error', '❌ Login OAuth2 com credenciais corretas falhou!', {
                    error: correctLoginError.message,
                });
                showError('❌ PROBLEMA! Login com credenciais corretas falhou');
            }

            // 8. Verificar estado final
            addLog('info', '8️⃣ Estado final do sistema OAuth2...');
            const finalUsers = await authService.listStoredUsers();
            const finalSystemInfo = authService.getSystemInfo();

            addLog('info', `Usuários OAuth2 no storage: ${finalUsers.length}`);
            addLog('info', 'Info final do sistema OAuth2', finalSystemInfo);

            showSuccess('✅ Investigação OAuth2 completa finalizada!');

        } catch (error: any) {
            addLog('error', 'Erro durante investigação OAuth2', {
                message: error.message,
                stack: error.stack,
            });
            showError('❌ Erro durante investigação OAuth2');
        } finally {
            setIsRunning(false);
            addLog('info', '🏁 INVESTIGAÇÃO OAUTH2 FINALIZADA');
        }
    };

    /**
     * Teste rápido de conectividade OAuth2
     */
    const quickConnectivityTest = async () => {
        setIsRunning(true);
        addLog('info', '🔌 TESTE RÁPIDO DE CONECTIVIDADE OAUTH2');

        try {
            const result = await restValidator.testConnection({
                protocol: connection.protocol,
                address: connection.address,
                port: connection.port,
                endpoint: connection.endpoint,
            });

            if (result.success) {
                showSuccess('✅ Servidor OAuth2 acessível!');
                addLog('success', 'Conectividade OAuth2 OK', {
                    url: result.url,
                    status: result.statusCode,
                    responseData: result.data,
                });
            } else {
                showError('❌ Servidor OAuth2 não acessível');
                addLog('error', 'Falha na conectividade OAuth2', {
                    error: result.error,
                    url: result.url,
                });
            }
        } catch (error) {
            showError('❌ Erro no teste de conectividade OAuth2');
            addLog('error', 'Erro na conectividade OAuth2', error);
        } finally {
            setIsRunning(false);
        }
    };

    /**
     * Teste específico de credenciais OAuth2 - TOAST CORRIGIDO
     */
    const testSpecificCredentials = async (creds: any, label: string) => {
        setIsRunning(true);
        addLog('info', `🧪 TESTE ESPECÍFICO OAUTH2: ${label}...`);

        try {
            const result = await authService.testCredentialsOnly({
                username: creds.username,
                password: creds.password,
            });

            addLog('info', `Resultado ${label} OAuth2`, result);

            if (label.includes('CORRETAS')) {
                // Testando credenciais CORRETAS
                if (result.success) {
                    // Comportamento correto - credenciais corretas aceitas
                    showSuccess(`✅ ${label} OAuth2 aceitas pelo servidor!`);
                    addLog('success', `${label} OAuth2 aceitas pelo servidor`, result.data);
                } else {
                    // Problema - credenciais corretas rejeitadas
                    showError(`❌ PROBLEMA! ${label} OAuth2 foram rejeitadas`);
                    addLog('error', `${label} OAuth2 rejeitadas (problema!)`, result);
                }
            } else {
                // Testando credenciais ERRADAS
                if (!result.success) {
                    // Comportamento correto - credenciais erradas rejeitadas
                    showSuccess(`✅ ${label} OAuth2 rejeitadas corretamente!`);
                    addLog('success', `${label} OAuth2 rejeitadas (comportamento correto)`, result);
                } else {
                    // Problema - credenciais erradas aceitas
                    showError(`❌ PROBLEMA! ${label} OAuth2 foram aceitas!`);
                    addLog('error', `${label} OAuth2 aceitas (problema!)`, result);
                }
            }

        } catch (error: any) {
            if (label.includes('ERRADAS')) {
                // Para credenciais erradas, erro é esperado
                showSuccess(`✅ ${label} OAuth2 rejeitadas com erro (esperado)`);
                addLog('success', `${label} OAuth2 rejeitadas com erro (esperado)`, error);
            } else {
                // Para credenciais corretas, erro é problema
                showError(`❌ Erro inesperado com ${label} OAuth2`);
                addLog('error', `Erro em ${label} OAuth2`, error);
            }
        } finally {
            setIsRunning(false);
        }
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
                        onPress={() => Alert.alert('Dados OAuth2', JSON.stringify(log.data, null, 2))}
                        style={styles.logData}
                    >
                        <Text style={[styles.logDataText, { color: Colors.primary }]}>
                            Ver dados OAuth2 →
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
                        🔬 Debug OAuth2 Protheus
                    </Text>
                </View>

                <ScrollView style={styles.content}>
                    {/* Status OAuth2 */}
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            🔐 Status OAuth2 Protheus
                        </Text>

                        <View style={styles.statusRow}>
                            <View style={styles.statusItem}>
                                <Text style={[styles.statusLabel, { color: theme.colors.textSecondary }]}>
                                    Servidor OAuth2:
                                </Text>
                                <Text style={[styles.statusValue, { color: theme.colors.text }]}>
                                    {connection.baseUrl || 'Não configurado'}
                                </Text>
                            </View>

                            <View style={styles.statusItem}>
                                <Text style={[styles.statusLabel, { color: theme.colors.textSecondary }]}>
                                    Endpoint OAuth2:
                                </Text>
                                <Text style={[styles.statusValue, { color: theme.colors.text }]}>
                                    {connection.baseUrl ? `${connection.baseUrl}/api/oauth2/v1/token` : 'N/A'}
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

                    {/* Credenciais OAuth2 */}
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            🔑 Credenciais OAuth2 de Teste
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
                    </Card>

                    {/* Testes OAuth2 */}
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            🧪 Testes OAuth2 Protheus
                        </Text>

                        <View style={styles.testButtons}>
                            <Button
                                title="🔬 TESTE COMPLETO OAUTH2"
                                onPress={testCompleteOAuth2Flow}
                                loading={isRunning}
                                style={styles.primaryButton}
                            />

                            <Button
                                title="🔌 Conectividade"
                                variant="outline"
                                onPress={quickConnectivityTest}
                                loading={isRunning}
                            />

                            <View style={styles.testRow}>
                                <Button
                                    title="✅ Teste Corretas"
                                    variant="outline"
                                    onPress={() => testSpecificCredentials(credentials, 'Credenciais CORRETAS')}
                                    loading={isRunning}
                                    style={styles.testButton}
                                />

                                <Button
                                    title="❌ Teste Erradas"
                                    variant="outline"
                                    onPress={() => testSpecificCredentials(wrongCredentials, 'Credenciais ERRADAS')}
                                    loading={isRunning}
                                    style={styles.testButton}
                                />
                            </View>

                            <Button
                                title="🗑️ Reset OAuth2"
                                variant="outline"
                                onPress={async () => {
                                    await authService.clearStorage();
                                    clearLogs();
                                    showSuccess('✅ Storage OAuth2 limpo');
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
                                📋 Debug Log OAuth2 ({logs.length})
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
    testButtons: {
        gap: 12,
    },
    primaryButton: {
        backgroundColor: '#3b82f6',
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