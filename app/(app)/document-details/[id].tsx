// app/(app)/document-details/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeArea } from '../../../src/components/layout/SafeArea';
import { approvalsService } from '../../../src/services/api/approvalsService';
import { useThemeStore } from '../../../src/store/themeStore';
import type { Document } from '../../../src/types/approvals';
import {
    DOCUMENT_STATUS_LABELS,
    DOCUMENT_TYPES,
    formatCurrency,
    formatDate,
    getDocumentTypeIcon,
    getStatusColor
} from '../../../src/types/approvals';

interface InfoRowProps {
    label: string;
    value: string;
    icon?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, icon }) => {
    const { theme } = useThemeStore();

    return (
        <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
                {icon && (
                    <Ionicons
                        name={icon as any}
                        size={16}
                        color={theme.colors.textSecondary}
                        style={styles.infoIcon}
                    />
                )}
                <Text style={[styles.labelText, { color: theme.colors.textSecondary }]}>
                    {label}
                </Text>
            </View>
            <Text style={[styles.valueText, { color: theme.colors.text }]} selectable>
                {value}
            </Text>
        </View>
    );
};

export default function DocumentDetailsScreen() {
    const { theme } = useThemeStore();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [document, setDocument] = useState<Document | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadDocumentDetails();
        }
    }, [id]);

    const loadDocumentDetails = async () => {
        if (!id) return;

        setIsLoading(true);
        setError(null);

        try {
            const scrId = parseInt(id);
            const docDetails = await approvalsService.getDocumentDetails(scrId);
            setDocument(docDetails);
        } catch (error) {
            console.error('Erro ao carregar detalhes:', error);
            setError('Falha ao carregar detalhes do documento');
        }

        setIsLoading(false);
    };

    const handleApprove = async () => {
        if (!document) return;

        Alert.alert(
            'Confirmar Aprovação',
            `Deseja aprovar o documento ${document.documentNumber}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Aprovar',
                    style: 'default',
                    onPress: async () => {
                        setIsActionLoading(true);
                        try {
                            await approvalsService.approveDocuments([document.scrId]);
                            Alert.alert(
                                'Sucesso',
                                'Documento aprovado com sucesso!',
                                [{ text: 'OK', onPress: () => router.back() }]
                            );
                        } catch (error) {
                            Alert.alert('Erro', 'Falha ao aprovar documento');
                        }
                        setIsActionLoading(false);
                    }
                }
            ]
        );
    };

    const handleReject = async () => {
        if (!document) return;

        Alert.prompt(
            'Confirmar Reprovação',
            `Deseja reprovar o documento ${document.documentNumber}?\nMotivo (opcional):`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Reprovar',
                    style: 'destructive',
                    onPress: async (reason) => {
                        setIsActionLoading(true);
                        try {
                            await approvalsService.rejectDocuments([document.scrId], reason);
                            Alert.alert(
                                'Sucesso',
                                'Documento reprovado com sucesso!',
                                [{ text: 'OK', onPress: () => router.back() }]
                            );
                        } catch (error) {
                            Alert.alert('Erro', 'Falha ao reprovar documento');
                        }
                        setIsActionLoading(false);
                    }
                }
            ],
            'plain-text'
        );
    };

    const renderPurchaseOrderInfo = () => {
        if (!document?.purchaseOrder?.[0]) return null;

        const order = document.purchaseOrder[0];

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informações da Compra</Text>
                <View style={styles.sectionContent}>
                    <InfoRow
                        label="Fornecedor"
                        value={order.supplyerName}
                        icon="business"
                    />
                    <InfoRow
                        label="Comprador"
                        value={order.purchaserName}
                        icon="person"
                    />
                    <InfoRow
                        label="Condição de Pagamento"
                        value={order.paymentTermDescription}
                        icon="card"
                    />
                    <InfoRow
                        label="Data do Pedido"
                        value={formatDate(order.date)}
                        icon="calendar"
                    />
                    {order.itemDescriptionCostCenter && (
                        <InfoRow
                            label="Centro de Custo"
                            value={order.itemDescriptionCostCenter}
                            icon="business-outline"
                        />
                    )}
                </View>
            </View>
        );
    };

    const renderPurchaseRequestInfo = () => {
        if (!document?.purchaseRequest?.[0]) return null;

        const request = document.purchaseRequest[0];

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informações da Solicitação</Text>
                <View style={styles.sectionContent}>
                    <InfoRow
                        label="Solicitante"
                        value={request.requesterName}
                        icon="person"
                    />
                    <InfoRow
                        label="Centro de Custo"
                        value={request.CostCenter}
                        icon="business-outline"
                    />
                    <InfoRow
                        label="Data da Solicitação"
                        value={formatDate(request.date)}
                        icon="calendar"
                    />
                </View>
            </View>
        );
    };

    const styles = createStyles(theme);

    if (isLoading) {
        return (
            <SafeArea style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                        Carregando detalhes...
                    </Text>
                </View>
            </SafeArea>
        );
    }

    if (error || !document) {
        return (
            <SafeArea style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons
                        name="alert-circle-outline"
                        size={64}
                        color={theme.colors.error}
                    />
                    <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
                        Erro ao carregar documento
                    </Text>
                    <Text style={[styles.errorMessage, { color: theme.colors.textSecondary }]}>
                        {error || 'Documento não encontrado'}
                    </Text>
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                        onPress={loadDocumentDetails}
                    >
                        <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                    </TouchableOpacity>
                </View>
            </SafeArea>
        );
    }

    const statusColor = getStatusColor(document.documentStatus);
    const documentIcon = getDocumentTypeIcon(document.documentType);
    const canManage = approvalsService.canManageDocument(document);

    return (
        <SafeArea style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Detalhes</Text>

                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Card principal */}
                <View style={styles.mainCard}>
                    {/* Status banner */}
                    <View style={[styles.statusBanner, { backgroundColor: statusColor }]}>
                        <Text style={styles.statusText}>
                            {DOCUMENT_STATUS_LABELS[document.documentStatus]}
                        </Text>
                    </View>

                    {/* Título do documento */}
                    <View style={styles.documentHeader}>
                        <View style={styles.documentTitleRow}>
                            <Ionicons
                                name={documentIcon as any}
                                size={28}
                                color={theme.colors.primary}
                            />
                            <View style={styles.documentTitleText}>
                                <Text style={styles.documentType}>
                                    {DOCUMENT_TYPES[document.documentType]}
                                </Text>
                                <Text style={styles.documentNumber}>
                                    {document.documentNumber}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Valor */}
                    <View style={styles.valueSection}>
                        <Text style={styles.valueLabel}>Valor Total</Text>
                        <Text style={styles.valueAmount}>
                            {formatCurrency(document.documentTotal, document.documentSymbol)}
                        </Text>
                        {document.documentExchangeValue > 0 &&
                            document.documentExchangeValue !== document.documentTotal && (
                                <Text style={styles.exchangeValue}>
                                    Valor convertido: {formatCurrency(document.documentExchangeValue, document.documentStrongSymbol)}
                                </Text>
                            )}
                    </View>
                </View>

                {/* Informações gerais */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informações Gerais</Text>
                    <View style={styles.sectionContent}>
                        <InfoRow
                            label="Filial"
                            value={document.documentBranch.trim()}
                            icon="business"
                        />
                        <InfoRow
                            label="Usuário"
                            value={document.documentUserName}
                            icon="person"
                        />
                        <InfoRow
                            label="Grupo de Aprovação"
                            value={document.documentGroupAprov}
                            icon="people"
                        />
                        {document.documentItemGroup && (
                            <InfoRow
                                label="Grupo de Item"
                                value={document.documentItemGroup}
                                icon="layers"
                            />
                        )}
                        <InfoRow
                            label="Data de Criação"
                            value={formatDate(document.documentCreated)}
                            icon="calendar"
                        />
                        <InfoRow
                            label="ID do Sistema"
                            value={document.scrId.toString()}
                            icon="key"
                        />
                    </View>
                </View>

                {/* Informações específicas */}
                {renderPurchaseOrderInfo()}
                {renderPurchaseRequestInfo()}

                {/* Informações financeiras */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informações Financeiras</Text>
                    <View style={styles.sectionContent}>
                        <InfoRow
                            label="Moeda"
                            value={`${document.documentSymbol} (${document.documentCurrency})`}
                            icon="card"
                        />
                        {document.documentExchangeRate > 0 && document.documentExchangeRate !== 1 && (
                            <InfoRow
                                label="Taxa de Câmbio"
                                value={document.documentExchangeRate.toString()}
                                icon="swap-horizontal"
                            />
                        )}
                        <InfoRow
                            label="Símbolo Principal"
                            value={document.documentStrongSymbol}
                            icon="cash"
                        />
                    </View>
                </View>

                {/* Espaço adicional no final */}
                <View style={styles.bottomSpace} />
            </ScrollView>

            {/* Ações (apenas para documentos pendentes) */}
            {canManage && (
                <View style={styles.actionContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={handleReject}
                        disabled={isActionLoading}
                    >
                        {isActionLoading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <>
                                <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                                <Text style={styles.actionButtonText}>Reprovar</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={handleApprove}
                        disabled={isActionLoading}
                    >
                        {isActionLoading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                <Text style={styles.actionButtonText}>Aprovar</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </SafeArea>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },

    backButton: {
        padding: 8,
        marginLeft: -8,
    },

    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        flex: 1,
        textAlign: 'center',
    },

    headerSpacer: {
        width: 40,
    },

    content: {
        flex: 1,
    },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },

    loadingText: {
        fontSize: 16,
        fontWeight: '500',
    },

    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        gap: 16,
    },

    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
    },

    errorMessage: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
    },

    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        marginTop: 8,
    },

    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },

    mainCard: {
        backgroundColor: theme.colors.surface,
        margin: 20,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },

    statusBanner: {
        paddingVertical: 12,
        alignItems: 'center',
    },

    statusText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    documentHeader: {
        padding: 20,
        paddingBottom: 16,
    },

    documentTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    documentTitleText: {
        marginLeft: 16,
        flex: 1,
    },

    documentType: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 4,
    },

    documentNumber: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.primary,
    },

    valueSection: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: 16,
    },

    valueLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontWeight: '500',
        marginBottom: 8,
    },

    valueAmount: {
        fontSize: 28,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 4,
    },

    exchangeValue: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
    },

    section: {
        backgroundColor: theme.colors.surface,
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        padding: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },

    sectionContent: {
        padding: 20,
        paddingTop: 16,
    },

    infoRow: {
        marginBottom: 16,
    },

    infoLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },

    infoIcon: {
        marginRight: 8,
    },

    labelText: {
        fontSize: 14,
        fontWeight: '500',
    },

    valueText: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 22,
    },

    bottomSpace: {
        height: 100,
    },

    actionContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 32,
        gap: 12,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },

    actionButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },

    approveButton: {
        backgroundColor: '#28a745',
    },

    rejectButton: {
        backgroundColor: '#dc3545',
    },

    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});