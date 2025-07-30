import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useConnection } from '../../hooks/useConnection';
import { useThemeStore } from '../../store/themeStore';
import { validation } from '../../utils/validation';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

interface ConnectionFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export const ConnectionForm: React.FC<ConnectionFormProps> = ({
    onSuccess,
    onCancel,
}) => {
    const { theme } = useThemeStore();
    const { connection, updateConnection, testConnection, isTestingConnection } = useConnection();

    const [formData, setFormData] = useState({
        protocol: connection.protocol,
        address: connection.address,
        port: connection.port,
        environment: connection.environment,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showProtocolModal, setShowProtocolModal] = useState(false);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!validation.required(formData.address)) {
            newErrors.address = 'Endereço é obrigatório';
        } else if (!validation.ip(formData.address)) {
            newErrors.address = 'Endereço inválido';
        }

        if (!validation.required(formData.port)) {
            newErrors.port = 'Porta é obrigatória';
        } else if (!validation.port(formData.port)) {
            newErrors.port = 'Porta inválida (1-65535)';
        }

        if (!validation.required(formData.environment)) {
            newErrors.environment = 'Ambiente é obrigatório';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleTestConnection = async () => {
        if (!validateForm()) {
            return;
        }

        // Atualizar configuração com dados do formulário
        updateConnection(formData);

        const success = await testConnection();

        if (success) {
            Alert.alert(
                'Sucesso!',
                'Conexão estabelecida com sucesso.',
                [
                    {
                        text: 'OK',
                        onPress: onSuccess,
                    },
                ]
            );
        } else {
            Alert.alert(
                'Erro',
                'Não foi possível conectar com o servidor. Verifique as configurações.'
            );
        }
    };

    const handleSave = () => {
        if (!validateForm()) {
            return;
        }

        updateConnection(formData);

        Alert.alert(
            'Configurações Salvas',
            'As configurações de conexão foram salvas com sucesso.',
            [
                {
                    text: 'OK',
                    onPress: onSuccess,
                },
            ]
        );
    };

    const updateFormData = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Limpar erro do campo quando o usuário digitar
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <View style={styles.container}>
            <Card variant="elevated" style={styles.formCard}>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                    Configuração de Conexão
                </Text>

                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                    Configure a conexão com o servidor REST do Protheus
                </Text>

                <View style={styles.form}>
                    {/* Protocolo */}
                    <View style={styles.field}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>
                            Protocolo <Text style={styles.required}>*</Text>
                        </Text>
                        <Button
                            title={formData.protocol}
                            variant="outline"
                            onPress={() => setShowProtocolModal(true)}
                            style={styles.protocolButton}
                        />
                    </View>

                    {/* Endereço */}
                    <Input
                        label="Endereço"
                        value={formData.address}
                        onChangeText={(value) => updateFormData('address', value)}
                        placeholder="192.168.1.100"
                        error={errors.address}
                        required
                    />

                    {/* Porta */}
                    <Input
                        label="Porta"
                        value={formData.port}
                        onChangeText={(value) => updateFormData('port', value)}
                        placeholder="8080"
                        keyboardType="numeric"
                        error={errors.port}
                    />

                    {/* Ambiente */}
                    <Input
                        label="Ambiente"
                        value={formData.environment}
                        onChangeText={(value) => updateFormData('environment', value)}
                        placeholder="rest"
                        error={errors.environment}
                        required
                    />

                    {/* URL Preview */}
                    <View style={styles.previewContainer}>
                        <Text style={[styles.previewLabel, { color: theme.colors.textSecondary }]}>
                            URL de Conexão:
                        </Text>
                        <Text style={[styles.previewUrl, { color: theme.colors.text }]}>
                            {`${formData.protocol.toLowerCase()}://${formData.address}:${formData.port}/${formData.environment}`}
                        </Text>
                    </View>
                </View>

                <View style={styles.actions}>
                    <Button
                        title="Testar Conexão"
                        variant="outline"
                        onPress={handleTestConnection}
                        loading={isTestingConnection}
                        disabled={!formData.address || !formData.environment}
                        style={styles.actionButton}
                    />

                    <Button
                        title="Salvar"
                        onPress={handleSave}
                        disabled={!formData.address || !formData.environment}
                        style={styles.actionButton}
                    />
                </View>

                {onCancel && (
                    <Button
                        title="Cancelar"
                        variant="ghost"
                        onPress={onCancel}
                    />
                )}
            </Card>

            {/* Modal de Seleção de Protocolo */}
            <Modal
                visible={showProtocolModal}
                onClose={() => setShowProtocolModal(false)}
                title="Selecionar Protocolo"
                size="sm"
            >
                <View style={styles.protocolOptions}>
                    {(['HTTP', 'HTTPS'] as const).map((protocol) => (
                        <Button
                            key={protocol}
                            title={protocol}
                            variant={formData.protocol === protocol ? 'primary' : 'outline'}
                            onPress={() => {
                                updateFormData('protocol', protocol);
                                setShowProtocolModal(false);
                            }}
                            style={styles.protocolOption}
                        />
                    ))}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    formCard: {
        margin: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    form: {
        gap: 16,
    },
    field: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    required: {
        color: '#e53e3e',
    },
    protocolButton: {
        justifyContent: 'flex-start',
    },
    previewContainer: {
        padding: 12,
        backgroundColor: 'rgba(12, 154, 190, 0.1)',
        borderRadius: 8,
        marginTop: 8,
    },
    previewLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    previewUrl: {
        fontSize: 14,
        fontWeight: '500',
        fontFamily: 'monospace',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
        marginBottom: 16,
    },
    actionButton: {
        flex: 1,
    },
    protocolOptions: {
        gap: 12,
    },
    protocolOption: {
        marginBottom: 8,
    },
});