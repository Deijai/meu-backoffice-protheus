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
    theme: any;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, icon, theme }) => {
    return (
        <View style={infoRowStyles.container}>
            <View style={infoRowStyles.labelContainer}>
                {icon && (
                    <Ionicons
                        name={icon as any}
                        size={16}
                        color={theme.colors.textSecondary}
                        style={infoRowStyles.icon}
                    />
                )}
                <Text style={[infoRowStyles.label, { color: theme.colors.textSecondary }]}>
                    {label}
                </Text>
            </View>
            <Text style={[infoRowStyles.value, { color: theme.colors.text }]} selectable>
                {value}
            </Text>
        </View>
    );
};

const infoRowStyles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    icon: {
        marginRight: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
    },
    value: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 22,
    },
});

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
            <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Informações da Compra
                </Text>
                <View style={styles.sectionContent}>
                    <InfoRow
                        label="Fornecedor"
                        value={order.supplyerName}
                        icon="business"
                        theme={theme}
                    />
                    <InfoRow
                        label="Comprador"
                        value={order.purchaserName}
                        icon="person"
                        theme={theme}
                    />
                    <InfoRow
                        label="Condição de Pagamento"
                        value={order.paymentTermDescription}
                        icon="card"
                        theme={theme}
                    />
                    <InfoRow
                        label="Data do Pedido"
                        value={formatDate(order.date)}
                        icon="calendar"
                        theme={theme}
                    />
                    {order.itemDescriptionCostCenter && (
                        <InfoRow
                            label="Centro de Custo"
                            value={order.itemDescriptionCostCenter}
                            icon="business-outline"
                            theme={theme}
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
            <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Informações da Solicitação
                </Text>
                <View style={styles.sectionContent}>
                    <InfoRow
                        label="Solicitante"
                        value={request.requesterName}
                        icon="person"
                        theme={theme}
                    />
                    <InfoRow
                        label="Centro de Custo"
                        value={request.CostCenter}
                        icon="business-outline"
                        theme={theme}
                    />
                    <InfoRow
                        label="Data da Solicitação"
                        value={formatDate(request.date)}
                        icon="calendar"
                        theme={theme}
                    />
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <SafeArea>
                <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                            Carregando detalhes...
                        </Text>
                    </View>
                </View>
            </SafeArea>
        );
    }

    if (error || !document) {
        return (
            <SafeArea>
                <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
                </View>
            </SafeArea>
        );
    }

    const statusColor = getStatusColor(document.documentStatus);
    const documentIcon = getDocumentTypeIcon(document.documentType);
    const canManage = approvalsService.canManageDocument(document);

    return (
        <SafeArea>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>

                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                        Detalhes
                    </Text>

                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Card principal */}
                    <View style={[styles.mainCard, { backgroundColor: theme.colors.surface }]}>
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
                                    <Text style={[styles.documentType, { color: theme.colors.text }]}>
                                        {DOCUMENT_TYPES[document.documentType]}
                                    </Text>
                                    <Text style={[styles.documentNumber, { color: theme.colors.primary }]}>
                                        {document.documentNumber}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Valor */}
                        <View style={[styles.valueSection, { borderTopColor: theme.colors.border }]}>
                            <Text style={[styles.valueLabel, { color: theme.colors.textSecondary }]}>
                                Valor Total
                            </Text>
                            <Text style={[styles.valueAmount, { color: theme.colors.text }]}>
                                {formatCurrency(document.documentTotal, document.documentSymbol)}
                            </Text>
                            {document.documentExchangeValue > 0 &&
                                document.documentExchangeValue !== document.documentTotal && (
                                    <Text style={[styles.exchangeValue, { color: theme.colors.textSecondary }]}>
                                        Valor convertido: {formatCurrency(document.documentExchangeValue, document.documentStrongSymbol)}
                                    </Text>
                                )}
                        </View>
                    </View>

                    {/* Informações gerais */}
                    <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Informações Gerais
                        </Text>
                        <View style={styles.sectionContent}>
                            <InfoRow
                                label="Filial"
                                value={document.documentBranch.trim()}
                                icon="business"
                                theme={theme}
                            />
                            <InfoRow
                                label="Usuário"
                                value={document.documentUserName}
                                icon="person"
                                theme={theme}
                            />
                            <InfoRow
                                label="Grupo de Aprovação"
                                value={document.documentGroupAprov}
                                icon="people"
                                theme={theme}
                            />
                            {document.documentItemGroup && (
                                <InfoRow
                                    label="Grupo de Item"
                                    value={document.documentItemGroup}
                                    icon="layers"
                                    theme={theme}
                                />
                            )}
                            <InfoRow
                                label="Data de Criação"
                                value={formatDate(document.documentCreated)}
                                icon="calendar"
                                theme={theme}
                            />
                            <InfoRow
                                label="ID do Sistema"
                                value={document.scrId.toString()}
                                icon="key"
                                theme={theme}
                            />
                        </View>
                    </View>

                    {/* Informações específicas */}
                    {renderPurchaseOrderInfo()}
                    {renderPurchaseRequestInfo()}

                    {/* Informações financeiras */}
                    <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Informações Financeiras
                        </Text>
                        <View style={styles.sectionContent}>
                            <InfoRow
                                label="Moeda"
                                value={`${document.documentSymbol} (${document.documentCurrency})`}
                                icon="card"
                                theme={theme}
                            />
                            {document.documentExchangeRate > 0 && document.documentExchangeRate !== 1 && (
                                <InfoRow
                                    label="Taxa de Câmbio"
                                    value={document.documentExchangeRate.toString()}
                                    icon="swap-horizontal"
                                    theme={theme}
                                />
                            )}
                            <InfoRow
                                label="Símbolo Principal"
                                value={document.documentStrongSymbol}
                                icon="cash"
                                theme={theme}
                            />
                        </View>
                    </View>

                    <View style={styles.bottomSpace} />
                </ScrollView>

                {/* Ações (apenas para documentos pendentes) */}
                {canManage && (
                    <View style={[styles.actionContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },

    backButton: {
        padding: 8,
        marginLeft: -8,
    },

    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
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
        marginBottom: 4,
    },

    documentNumber: {
        fontSize: 16,
        fontWeight: '500',
    },

    valueSection: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderTopWidth: 1,
        paddingTop: 16,
    },

    valueLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },

    valueAmount: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 4,
    },

    exchangeValue: {
        fontSize: 14,
        fontStyle: 'italic',
    },

    section: {
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
        padding: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },

    sectionContent: {
        padding: 20,
        paddingTop: 16,
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
        borderTopWidth: 1,
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