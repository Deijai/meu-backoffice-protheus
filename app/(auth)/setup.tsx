import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeArea } from '../../src/components/layout/SafeArea';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { Modal } from '../../src/components/ui/Modal';
import { Toast } from '../../src/components/ui/Toast';
import { useRestValidation } from '../../src/hooks/useRestValidation';
import { useTheme } from '../../src/hooks/useTheme';
import { useToastStore } from '../../src/store/toastStore';
import { Colors } from '../../src/styles/colors';

export default function SetupScreen() {
    const { theme } = useTheme();
    const {
        connection,
        isTestingConnection,
        validationErrors,
        canProceedToLogin,
        updateConnectionConfig,
        validateAndTestConnection,
        getConnectionUrl,
        isFormValid,
    } = useRestValidation();

    const { visible, message, type, hideToast } = useToastStore();
    const [showProtocolModal, setShowProtocolModal] = useState(false);

    const handleTestConnection = async () => {
        const success = await validateAndTestConnection();

        if (success) {
            // Aguardar um pouco para o usuário ver o toast de sucesso
            setTimeout(() => {
                router.replace('/(auth)/login');
            }, 2000);
        }
    };

    const handleProtocolSelect = (protocol: 'HTTP' | 'HTTPS') => {
        updateConnectionConfig('protocol', protocol);
        setShowProtocolModal(false);
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

                    <View style={[styles.iconContainer, { backgroundColor: Colors.primary }]}>
                        <Ionicons name="server-outline" size={24} color="#ffffff" />
                    </View>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        Configuração do Servidor
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                        Configure a conexão com o Meu Backoffice Protheus
                    </Text>

                    {/* Connection Status */}
                    {connection.isConnected && connection.isValid && (
                        <Card variant="elevated" style={[styles.statusCard, { backgroundColor: '#d4edda' }]}>
                            <View style={styles.statusContent}>
                                <Ionicons name="checkmark-circle" size={24} color="#155724" />
                                <View style={styles.statusInfo}>
                                    <Text style={[styles.statusText, { color: '#155724' }]}>
                                        Conexão estabelecida com sucesso!
                                    </Text>
                                    <Text style={[styles.statusUrl, { color: '#155724' }]}>
                                        {connection.baseUrl}
                                    </Text>
                                </View>
                            </View>
                        </Card>
                    )}

                    {/* Setup Steps */}
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Passos da Configuração
                        </Text>

                        <View style={styles.stepsList}>
                            <View style={styles.stepItem}>
                                <View style={[
                                    styles.stepIcon,
                                    { backgroundColor: isFormValid() ? Colors.primary : theme.colors.border }
                                ]}>
                                    {isFormValid() ? (
                                        <Ionicons name="checkmark" size={16} color="#ffffff" />
                                    ) : (
                                        <Text style={[styles.stepNumber, { color: isFormValid() ? '#ffffff' : theme.colors.textSecondary }]}>1</Text>
                                    )}
                                </View>
                                <View style={styles.stepContent}>
                                    <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
                                        Configurar Servidor
                                    </Text>
                                    <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>
                                        Digite o endereço e configurações do servidor REST
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.stepItem}>
                                <View style={[
                                    styles.stepIcon,
                                    { backgroundColor: connection.isConnected ? '#38a169' : theme.colors.border }
                                ]}>
                                    {connection.isConnected ? (
                                        <Ionicons name="checkmark" size={16} color="#ffffff" />
                                    ) : (
                                        <Text style={[styles.stepNumber, { color: connection.isConnected ? '#ffffff' : theme.colors.textSecondary }]}>2</Text>
                                    )}
                                </View>
                                <View style={styles.stepContent}>
                                    <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
                                        Testar Conexão
                                    </Text>
                                    <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>
                                        Verificar se o servidor está respondendo (Status 401 = OK)
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.stepItem}>
                                <View style={[
                                    styles.stepIcon,
                                    { backgroundColor: canProceedToLogin ? '#805ad5' : theme.colors.border }
                                ]}>
                                    {canProceedToLogin ? (
                                        <Ionicons name="checkmark" size={16} color="#ffffff" />
                                    ) : (
                                        <Text style={[styles.stepNumber, { color: canProceedToLogin ? '#ffffff' : theme.colors.textSecondary }]}>3</Text>
                                    )}
                                </View>
                                <View style={styles.stepContent}>
                                    <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
                                        Finalizar
                                    </Text>
                                    <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>
                                        Configuração salva e pronta para uso
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </Card>

                    {/* Configuration Form */}
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Configurações de Conexão
                        </Text>

                        <View style={styles.configItem}>
                            <View style={styles.configHeader}>
                                <Ionicons name="shield-outline" size={20} color={Colors.primary} />
                                <Text style={[styles.configLabel, { color: theme.colors.text }]}>
                                    Protocolo
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowProtocolModal(true)}
                                style={[
                                    styles.protocolSelector,
                                    {
                                        borderColor: theme.colors.border,
                                        backgroundColor: theme.colors.surface
                                    }
                                ]}
                            >
                                <Text style={[styles.protocolText, { color: theme.colors.text }]}>
                                    {connection.protocol}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.configItem}>
                            <View style={styles.configHeader}>
                                <Ionicons name="globe-outline" size={20} color={Colors.primary} />
                                <Text style={[styles.configLabel, { color: theme.colors.text }]}>
                                    Endereço do Servidor *
                                </Text>
                            </View>
                            <Input
                                value={connection.address}
                                onChangeText={(value) => updateConnectionConfig('address', value)}
                                placeholder="192.168.1.100 ou servidor.empresa.com"
                                error={validationErrors.find(err => err.includes('Endereço'))}
                            />
                        </View>

                        <View style={styles.configRow}>
                            <View style={styles.configItemHalf}>
                                <View style={styles.configHeader}>
                                    <Ionicons name="settings-outline" size={20} color={Colors.primary} />
                                    <Text style={[styles.configLabel, { color: theme.colors.text }]}>
                                        Porta
                                    </Text>
                                </View>
                                <Input
                                    value={connection.port}
                                    onChangeText={(value) => updateConnectionConfig('port', value)}
                                    placeholder="17114 (opcional)"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.configItemHalf}>
                                <View style={styles.configHeader}>
                                    <Ionicons name="terminal-outline" size={20} color={Colors.primary} />
                                    <Text style={[styles.configLabel, { color: theme.colors.text }]}>
                                        Endpoint *
                                    </Text>
                                </View>
                                <Input
                                    value={connection.endpoint}
                                    onChangeText={(value) => updateConnectionConfig('endpoint', value)}
                                    placeholder="rest"
                                    error={validationErrors.find(err => err.includes('Endpoint'))}
                                />
                            </View>
                        </View>

                        {/* Connection Preview */}
                        <View style={[styles.previewCard, { backgroundColor: `${Colors.primary}15` }]}>
                            <View style={styles.previewHeader}>
                                <Ionicons name="link-outline" size={16} color={Colors.primary} />
                                <Text style={[styles.previewTitle, { color: Colors.primary }]}>
                                    URL de Conexão
                                </Text>
                            </View>
                            <Text style={[styles.previewUrl, { color: theme.colors.text }]}>
                                {getConnectionUrl()}
                            </Text>
                        </View>
                    </Card>

                    {/* Error Display */}
                    {validationErrors.length > 0 && (
                        <Card variant="outlined" style={[styles.errorCard, { borderColor: '#ef4444' }]}>
                            <View style={styles.errorContent}>
                                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                                <View style={styles.errorMessages}>
                                    {validationErrors.map((error, index) => (
                                        <Text key={index} style={[styles.errorText, { color: '#ef4444' }]}>
                                            • {error}
                                        </Text>
                                    ))}
                                </View>
                            </View>
                        </Card>
                    )}

                    {/* Actions */}
                    <View style={styles.actions}>
                        <Button
                            title={isTestingConnection ? "Testando Conexão..." : "Testar e Salvar Configuração"}
                            onPress={handleTestConnection}
                            loading={isTestingConnection}
                            disabled={!isFormValid() || isTestingConnection}
                            leftIcon={
                                isTestingConnection ? undefined : (
                                    <Ionicons name="flash-outline" size={20} color="#ffffff" />
                                )
                            }
                        />

                        {canProceedToLogin && (
                            <Button
                                title="Ir para Login"
                                variant="outline"
                                onPress={() => router.replace('/(auth)/login')}
                                leftIcon={<Ionicons name="arrow-forward" size={20} color={Colors.primary} />}
                            />
                        )}
                    </View>
                </ScrollView>

                {/* Protocol Modal */}
                <Modal
                    visible={showProtocolModal}
                    onClose={() => setShowProtocolModal(false)}
                    title="Selecionar Protocolo"
                >
                    <View style={styles.protocolOptions}>
                        <Text style={[styles.modalDescription, { color: theme.colors.textSecondary }]}>
                            Escolha o protocolo de comunicação
                        </Text>

                        {(['HTTP', 'HTTPS'] as const).map((protocol) => (
                            <TouchableOpacity
                                key={protocol}
                                onPress={() => handleProtocolSelect(protocol)}
                                style={[
                                    styles.protocolOption,
                                    {
                                        backgroundColor: connection.protocol === protocol
                                            ? `${Colors.primary}20`
                                            : theme.colors.surface,
                                        borderColor: connection.protocol === protocol
                                            ? Colors.primary
                                            : theme.colors.border,
                                    }
                                ]}
                            >
                                <View style={styles.protocolLeft}>
                                    <Ionicons
                                        name={protocol === 'HTTPS' ? 'shield-checkmark' : 'globe-outline'}
                                        size={20}
                                        color={connection.protocol === protocol ? Colors.primary : theme.colors.textSecondary}
                                    />
                                    <View>
                                        <Text style={[
                                            styles.protocolTitle,
                                            {
                                                color: theme.colors.text,
                                                fontWeight: connection.protocol === protocol ? '600' : '500'
                                            }
                                        ]}>
                                            {protocol}
                                        </Text>
                                        <Text style={[styles.protocolSubtitle, { color: theme.colors.textSecondary }]}>
                                            {protocol === 'HTTPS' ? 'Seguro (recomendado)' : 'Padrão'}
                                        </Text>
                                    </View>
                                </View>

                                <Ionicons
                                    name={connection.protocol === protocol ? "radio-button-on" : "radio-button-off"}
                                    size={20}
                                    color={connection.protocol === protocol ? Colors.primary : theme.colors.border}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </Modal>

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
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 22,
        marginBottom: 24,
    },
    statusCard: {
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#28a745',
    },
    statusContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statusInfo: {
        flex: 1,
    },
    statusText: {
        fontWeight: '600',
        fontSize: 16,
        marginBottom: 4,
    },
    statusUrl: {
        fontSize: 13,
        fontFamily: 'monospace',
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
    stepsList: {
        gap: 16,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    stepIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    stepContent: {
        flex: 1,
        paddingTop: 2,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    stepDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    configItem: {
        marginBottom: 16,
    },
    configHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    configLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    protocolSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    protocolText: {
        fontSize: 16,
    },
    configRow: {
        flexDirection: 'row',
        gap: 12,
    },
    configItemHalf: {
        flex: 1,
    },
    previewCard: {
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    previewTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    previewUrl: {
        fontSize: 13,
        fontFamily: 'monospace',
        fontWeight: '500',
    },
    errorCard: {
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    errorContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    errorMessages: {
        flex: 1,
    },
    errorText: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    actions: {
        paddingVertical: 24,
        gap: 12,
    },
    protocolOptions: {
        gap: 16,
    },
    modalDescription: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 16,
    },
    protocolOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
    },
    protocolLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    protocolTitle: {
        fontSize: 16,
        marginBottom: 2,
    },
    protocolSubtitle: {
        fontSize: 13,
    },
});