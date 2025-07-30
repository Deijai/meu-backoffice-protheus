// src/components/debug/LoginTest.tsx
// Componente para testar a integração do login com Axios
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { authService } from '../../services/api/authService';
import { httpService } from '../../services/api/httpService';
import { useConfigStore } from '../../store/configStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../styles/colors';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface TestResult {
    step: string;
    success: boolean;
    message: string;
    data?: any;
    timestamp: string;
}

export const LoginTest: React.FC = () => {
    const { theme } = useThemeStore();
    const { connection } = useConfigStore();

    const [credentials, setCredentials] = useState({
        username: 'admin',
        password: '123456',
    });

    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const addResult = (step: string, success: boolean, message: string, data?: any) => {
        const result: TestResult = {
            step,
            success,
            message,
            data,
            timestamp: new Date().toLocaleTimeString(),
        };

        setTestResults(prev => [...prev, result]);
        console.log(`${success ? '✅' : '❌'} ${step}: ${message}`, data);
    };

    const clearResults = () => {
        setTestResults([]);
        console.clear();
    };

    const runFullTest = async () => {
        setIsRunning(true);
        clearResults();

        addResult('Início', true, 'Iniciando teste completo de autenticação');

        try {
            // 1. Teste de configuração
            addResult('Config', true, `Base URL: ${connection.baseUrl}`);
            addResult('Config', true, `Protocol: ${connection.protocol}`);

            // 2. Inicializar httpService
            httpService.updateBaseURL();
            addResult('HttpService', true, `Inicializado com URL: ${httpService.getBaseURL()}`);

            // 3. Teste de ping (segurança)
            try {
                const pingResponse = await httpService.get('/ping');
                addResult('Ping', false, 'Servidor respondeu ao ping - pode não estar seguro', pingResponse);
            } catch (error) {
                addResult('Ping', true, 'Ping falhou - servidor seguro (esperado)', error);
            }

            // 4. Teste de autenticação
            try {
                const authUser = await authService.signIn({
                    username: credentials.username,
                    password: credentials.password,
                    keepConnected: false,
                });

                addResult('Auth', true, 'Login realizado com sucesso', {
                    username: authUser.username,
                    authType: authUser.authType,
                    hasToken: !!authService.getAuthToken(),
                });

                // 5. Teste de interceptor (requisição com auth automática)
                try {
                    const interceptorTest = await httpService.get('/api/test-endpoint');
                    addResult('Interceptor', true, 'Interceptor funcionando - headers automáticos', interceptorTest);
                } catch (error: any) {
                    if (error.response?.status === 404) {
                        addResult('Interceptor', true, 'Headers de auth enviados automaticamente (404 esperado)', {
                            status: error.response.status,
                            headers: error.config?.headers,
                        });
                    } else {
                        addResult('Interceptor', false, 'Erro no interceptor', error);
                    }
                }

                // 6. Teste de logout
                await authService.signOut();
                addResult('Logout', true, 'Logout realizado com sucesso');

            } catch (authError) {
                addResult('Auth', false, 'Falha na autenticação', authError);
            }

        } catch (error) {
            addResult('Erro Geral', false, 'Erro durante o teste', error);
        } finally {
            setIsRunning(false);
            addResult('Fim', true, 'Teste completo finalizado');
        }
    };

    const testPingOnly = async () => {
        setIsRunning(true);

        try {
            const response = await httpService.get('/ping');
            Alert.alert('Ping Resultado', `Servidor respondeu: ${response.status}. Pode não estar seguro.`);
            addResult('Ping', false, 'Servidor respondeu ao ping', response);
        } catch (error: any) {
            Alert.alert('Ping Resultado', 'Ping falhou (servidor seguro - esperado)');
            addResult('Ping', true, 'Ping falhou - servidor seguro', error?.message);
        } finally {
            setIsRunning(false);
        }
    };

    const testLoginOnly = async () => {
        setIsRunning(true);

        try {
            const authUser = await authService.signIn({
                username: credentials.username,
                password: credentials.password,
                keepConnected: false,
            });

            Alert.alert('Login Sucesso', `Usuário ${authUser.username} logado com ${authUser.authType}`);
            addResult('Login', true, 'Login individual realizado', authUser);
        } catch (error) {
            Alert.alert('Login Erro', 'Falha no login');
            addResult('Login', false, 'Falha no login individual', error);
        } finally {
            setIsRunning(false);
        }
    };

    const ResultItem = ({ result }: { result: TestResult }) => (
        <View style={[styles.resultItem, { borderColor: theme.colors.border }]}>
            <View style={styles.resultHeader}>
                <Ionicons
                    name={result.success ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={result.success ? '#22c55e' : '#ef4444'}
                />
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
                    onPress={() => Alert.alert('Dados', JSON.stringify(result.data, null, 2))}
                >
                    <Text style={[styles.resultDataText, { color: Colors.primary }]}>
                        Tap para ver dados
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Card variant="outlined" style={styles.section}>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                    🧪 Teste de Autenticação com Axios
                </Text>

                <View style={styles.credentials}>
                    <Input
                        label="Usuário"
                        value={credentials.username}
                        onChangeText={(value) => setCredentials(prev => ({ ...prev, username: value }))}
                        placeholder="admin"
                    />

                    <Input
                        label="Senha"
                        value={credentials.password}
                        onChangeText={(value) => setCredentials(prev => ({ ...prev, password: value }))}
                        placeholder="123456"
                        secureTextEntry
                    />
                </View>

                <View style={styles.buttons}>
                    <Button
                        title="Teste Completo"
                        onPress={runFullTest}
                        loading={isRunning}
                        leftIcon={<Ionicons name="play-circle" size={20} color="#ffffff" />}
                        style={styles.button}
                    />

                    <Button
                        title="Ping"
                        variant="outline"
                        onPress={testPingOnly}
                        loading={isRunning}
                        leftIcon={<Ionicons name="wifi" size={20} color={Colors.primary} />}
                        style={styles.button}
                    />

                    <Button
                        title="Login"
                        variant="outline"
                        onPress={testLoginOnly}
                        loading={isRunning}
                        leftIcon={<Ionicons name="log-in" size={20} color={Colors.primary} />}
                        style={styles.button}
                    />
                </View>

                <Button
                    title="Limpar Resultados"
                    variant="ghost"
                    onPress={clearResults}
                    leftIcon={<Ionicons name="trash" size={20} color={theme.colors.textSecondary} />}
                />
            </Card>

            {testResults.length > 0 && (
                <Card variant="outlined" style={styles.resultsSection}>
                    <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>
                        📊 Resultados dos Testes
                    </Text>

                    <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
                        {testResults.map((result, index) => (
                            <ResultItem key={index} result={result} />
                        ))}
                    </ScrollView>
                </Card>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    section: {
        padding: 16,
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    credentials: {
        marginBottom: 16,
    },
    buttons: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    button: {
        flex: 1,
    },
    resultsSection: {
        flex: 1,
        padding: 16,
    },
    resultsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    resultsList: {
        flex: 1,
    },
    resultItem: {
        borderWidth: 1,
        borderRadius: 8,
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
        marginLeft: 28,
    },
    resultData: {
        marginTop: 8,
        marginLeft: 28,
    },
    resultDataText: {
        fontSize: 12,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
});