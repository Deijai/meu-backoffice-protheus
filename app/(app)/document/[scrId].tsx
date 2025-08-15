// app/(app)/document/[scrId].tsx
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { DocumentApproversModal } from '../../../src/components/approvals/DocumentApproversModal';
import { DocumentAttachmentsComponent } from '../../../src/components/approvals/DocumentAttachmentsComponent';
import { DocumentHistoryComponent } from '../../../src/components/approvals/DocumentHistoryComponent';
import { DocumentItemCard } from '../../../src/components/approvals/DocumentItemCard';
import { ItemDetailModal } from '../../../src/components/approvals/ItemDetailModal';
import { SafeArea } from '../../../src/components/layout/SafeArea';
import { documentDetailService } from '../../../src/services/api/documentDetailService';
import { useThemeStore } from '../../../src/store/themeStore';
import type {
    DocumentDetails,
    DocumentType,
    PurchaseOrderItem,
    PurchaseRequestItem
} from '../../../src/types/documentDetails';

const { width } = Dimensions.get('window');

export default function DocumentDetailScreen() {
    const { scrId } = useLocalSearchParams<{ scrId: string }>();
    const { theme } = useThemeStore();

    // Estados
    const [documentDetails, setDocumentDetails] = useState<DocumentDetails | null>(null);
    const [items, setItems] = useState<(PurchaseOrderItem | PurchaseRequestItem)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingItems, setIsLoadingItems] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'items' | 'history' | 'attachments'>('details');
    const [selectedItem, setSelectedItem] = useState<PurchaseOrderItem | PurchaseRequestItem | null>(null);
    const [showItemModal, setShowItemModal] = useState(false);
    const [showApproversModal, setShowApproversModal] = useState(false);

    // Carregar detalhes do documento
    const loadDocumentDetails = useCallback(async (showRefresh = false) => {
        if (!scrId) return;

        try {
            if (showRefresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }
            setError(null);

            const details = await documentDetailService.getDocumentDetails(Number(scrId));
            setDocumentDetails(details);

            // Carregar itens automaticamente após carregar detalhes
            await loadDocumentItems(details.documentType, details.documentNumber);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar detalhes';
            setError(errorMessage);
            Alert.alert('Erro', errorMessage);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [scrId]);

    // Carregar itens do documento
    const loadDocumentItems = useCallback(async (documentType: DocumentType, documentNumber: string) => {
        try {
            setIsLoadingItems(true);

            let itemsData;
            if (documentType === 'PC') {
                itemsData = await documentDetailService.getPurchaseOrderItems(Number(documentNumber));
            } else if (documentType === 'SC' || documentType === 'IP' || documentType === 'AE') {
                itemsData = await documentDetailService.getPurchaseRequestItems(Number(documentNumber));
            }

            if (itemsData) {
                setItems(itemsData);
            }
        } catch (err) {
            console.error('Erro ao carregar itens:', err);
        } finally {
            setIsLoadingItems(false);
        }
    }, []);

    // Aprovar/Rejeitar documento
    const handleApproveDocument = async () => {
        if (!documentDetails) return;

        Alert.alert(
            'Confirmar Aprovação',
            `Deseja aprovar o documento ${documentDetails.documentNumber}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Aprovar',
                    style: 'default',
                    onPress: async () => {
                        try {
                            await documentDetailService.approveDocument(documentDetails.scrId);
                            Alert.alert('Sucesso', 'Documento aprovado com sucesso!', [
                                { text: 'OK', onPress: () => router.back() }
                            ]);
                        } catch (err) {
                            Alert.alert('Erro', 'Falha ao aprovar documento');
                        }
                    }
                }
            ]
        );
    };

    const handleRejectDocument = async () => {
        if (!documentDetails) return;

        Alert.alert(
            'Reprovar Documento',
            'Digite o motivo da reprovação:',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Reprovar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await documentDetailService.rejectDocument(documentDetails.scrId, 'Reprovado pelo usuário');
                            Alert.alert('Sucesso', 'Documento reprovado com sucesso!', [
                                { text: 'OK', onPress: () => router.back() }
                            ]);
                        } catch (err) {
                            Alert.alert('Erro', 'Falha ao reprovar documento');
                        }
                    }
                }
            ]
        );
    };

    // Efeitos
    useEffect(() => {
        loadDocumentDetails();
    }, [loadDocumentDetails]);

    // Renderização dos itens
    const renderItem = ({ item }: { item: PurchaseOrderItem | PurchaseRequestItem }) => (
        <DocumentItemCard
            item={item}
            onPress={() => {
                setSelectedItem(item);
                setShowItemModal(true);
            }}
            onViewMore={() => {
                setSelectedItem(item);
                setShowItemModal(true);
            }}
            onViewHistory={() => {
                // Implementar visualização do histórico do item específico
                console.log('Ver histórico do item:', item);
            }}
        />
    );

    // Renderizar conteúdo da aba
    const renderTabContent = () => {
        if (!documentDetails) return null;

        switch (activeTab) {
            case 'details':
                return (
                    <ScrollView style={styles.tabContent}>
                        <View style={[styles.infoSection, { backgroundColor: theme.colors.surface }]}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                Informações Adicionais
                            </Text>

                            <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Dt. Entrega</Text>
                                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                                    {documentDetails.documentCreated || '13/08/2025'}
                                </Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Qtd.Entregue</Text>
                                <Text style={[styles.infoValue, { color: theme.colors.text }]}>-</Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Observacoes</Text>
                                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                                    TESTE COM O CAMPO OBS NORMAL
                                </Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Numero PC</Text>
                                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                                    {documentDetails.documentNumber}
                                </Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Descricao</Text>
                                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                                    PRODUTO PADRAO Ø $%
                                </Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Observacoes</Text>
                                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                                    obs para teste
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                );

            case 'items':
                return (
                    <View style={styles.tabContent}>
                        {isLoadingItems ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                                    Carregando itens...
                                </Text>
                            </View>
                        ) : items.length > 0 ? (
                            <FlatList
                                data={items}
                                renderItem={renderItem}
                                keyExtractor={(item, index) => {
                                    // Verificar se é PurchaseOrderItem ou PurchaseRequestItem
                                    const key = 'itemSku' in item ? item.itemSku : (item as PurchaseRequestItem).itemProduct;
                                    return `${key}-${index}`;
                                }}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.itemsList}
                            />
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="document-outline" size={48} color={theme.colors.textSecondary} />
                                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                                    Nenhum item encontrado
                                </Text>
                            </View>
                        )}
                    </View>
                );

            case 'history':
                return (
                    <View style={styles.tabContent}>
                        <DocumentHistoryComponent scrId={documentDetails.scrId} />
                    </View>
                );

            case 'attachments':
                return (
                    <View style={styles.tabContent}>
                        <DocumentAttachmentsComponent scrId={documentDetails.scrId} />
                    </View>
                );

            default:
                return null;
        }
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

    if (error || !documentDetails) {
        return (
            <SafeArea>
                <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
                        <Text style={[styles.errorText, { color: theme.colors.error }]}>
                            {error || 'Documento não encontrado'}
                        </Text>
                        <TouchableOpacity
                            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                            onPress={() => loadDocumentDetails()}
                        >
                            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeArea>
        );
    }

    return (
        <SafeArea>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>

                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>
                            Pedido de Compra por Item - {documentDetails.documentNumber}
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.menuButton} onPress={() => setShowApproversModal(true)}>
                        <Ionicons name="ellipsis-vertical" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Document Info */}
                <View style={[styles.documentInfo, { backgroundColor: theme.colors.primary }]}>
                    <View style={styles.documentRow}>
                        <Text style={styles.documentLabel}>Fornecedor</Text>
                        <Text style={styles.documentValue}>MOBILE</Text>
                    </View>

                    <View style={styles.documentRow}>
                        <Text style={styles.documentLabel}>Pedido de Compra</Text>
                        <Text style={styles.documentLabel}>Filial</Text>
                    </View>
                    <View style={styles.documentRow}>
                        <Text style={styles.documentValue}>{documentDetails.documentNumber}</Text>
                        <Text style={styles.documentValue}>D MG 01</Text>
                    </View>

                    <View style={styles.documentRow}>
                        <Text style={styles.documentLabel}>Valor</Text>
                        <Text style={styles.documentLabel}>Data</Text>
                    </View>
                    <View style={styles.documentRow}>
                        <Text style={styles.documentValue}>R$ {documentDetails.documentTotal?.toFixed(2) || '350,00'}</Text>
                        <Text style={styles.documentValue}>{documentDetails.documentCreated || '13/08/2025'}</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View style={[styles.tabsContainer, { backgroundColor: theme.colors.surface }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {[
                            { key: 'items', label: 'Itens', icon: 'list-outline' },
                            { key: 'details', label: 'Informações Adicionais', icon: 'information-circle-outline' },
                            { key: 'history', label: 'Histórico de Compras', icon: 'time-outline' },
                            { key: 'attachments', label: 'Anexos', icon: 'attach-outline' }
                        ].map(tab => (
                            <TouchableOpacity
                                key={tab.key}
                                style={[
                                    styles.tab,
                                    activeTab === tab.key && { borderBottomColor: theme.colors.primary }
                                ]}
                                onPress={() => setActiveTab(tab.key as any)}
                            >
                                <Text style={[
                                    styles.tabText,
                                    { color: activeTab === tab.key ? theme.colors.primary : theme.colors.textSecondary }
                                ]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Tab Content */}
                <View style={styles.content}>
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => loadDocumentDetails(true)}
                        colors={[theme.colors.primary]}
                    />
                    {renderTabContent()}
                </View>

                {/* Action Buttons */}
                <View style={[styles.actionButtons, { backgroundColor: theme.colors.background }]}>
                    <TouchableOpacity
                        style={[styles.rejectButton, { borderColor: theme.colors.error }]}
                        onPress={handleRejectDocument}
                    >
                        <Text style={[styles.rejectButtonText, { color: theme.colors.error }]}>
                            Reprovar
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.approveButton, { backgroundColor: theme.colors.success }]}
                        onPress={handleApproveDocument}
                    >
                        <Text style={styles.approveButtonText}>Aprovar</Text>
                    </TouchableOpacity>
                </View>

                {/* Modals */}
                <ItemDetailModal
                    visible={showItemModal}
                    item={selectedItem}
                    onClose={() => {
                        setShowItemModal(false);
                        setSelectedItem(null);
                    }}
                />

                <DocumentApproversModal
                    visible={showApproversModal}
                    scrId={documentDetails?.scrId || null}
                    onClose={() => setShowApproversModal(false)}
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        elevation: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backButton: {
        padding: 8,
    },
    headerContent: {
        flex: 1,
        marginHorizontal: 12,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    menuButton: {
        padding: 8,
    },
    documentInfo: {
        padding: 16,
        gap: 8,
    },
    documentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    documentLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    documentValue: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    },
    tabsContainer: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
        minWidth: 120,
        alignItems: 'center',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
    },
    content: {
        flex: 1,
    },
    tabContent: {
        flex: 1,
        padding: 16,
    },
    infoSection: {
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    infoLabel: {
        fontSize: 14,
        flex: 1,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
    },
    itemsList: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    // Remover estilos não utilizados já que agora usamos componentes separados
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
    },
    actionButtons: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
    },
    rejectButton: {
        flex: 1,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
        alignItems: 'center',
    },
    rejectButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    approveButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    approveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});