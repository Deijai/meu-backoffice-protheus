// src/components/approvals/ItemDetailModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import type { PurchaseOrderItem, PurchaseRequestItem } from '../../types/documentDetails';

interface ItemDetailModalProps {
    visible: boolean;
    item: PurchaseOrderItem | PurchaseRequestItem | null;
    onClose: () => void;
}

const { height } = Dimensions.get('window');

export function ItemDetailModal({ visible, item, onClose }: ItemDetailModalProps) {
    const { theme } = useThemeStore();

    if (!item) return null;

    // Função para verificar se é um item de pedido de compra
    const isPurchaseOrderItem = (item: any): item is PurchaseOrderItem => {
        return 'purchaseOrderNumber' in item;
    };

    // Obter informações do item baseado no tipo
    const getItemInfo = () => {
        if (isPurchaseOrderItem(item)) {
            return {
                documentNumber: item.purchaseOrderNumber,
                itemNumber: item.purchaseOrderItem,
                productCode: item.itemSku,
                documentType: 'Pedido de Compra'
            };
        }
        return {
            documentNumber: item.requestNumber,
            itemNumber: item.requestItem,
            productCode: (item as PurchaseRequestItem).itemProduct,
            documentType: 'Solicitação de Compra',
            sc1Id: (item as PurchaseRequestItem).sc1Id
        };
    };

    const itemInfo = getItemInfo();

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={theme.colors.text} />
                    </TouchableOpacity>

                    <View style={styles.headerContent}>
                        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                            Detalhes do Item
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                            {itemInfo.documentType} {itemInfo.documentNumber}
                        </Text>
                    </View>
                </View>

                {/* Content */}
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Informações Básicas */}
                    <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Informações Básicas
                        </Text>

                        <View style={styles.infoGrid}>
                            <View style={styles.infoItem}>
                                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                                    Código do Produto
                                </Text>
                                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                                    {itemInfo.productCode}
                                </Text>
                            </View>

                            <View style={styles.infoItem}>
                                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                                    Item
                                </Text>
                                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                                    {itemInfo.itemNumber}
                                </Text>
                            </View>

                            {!isPurchaseOrderItem(item) && (
                                <View style={styles.infoItem}>
                                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                                        SC1 ID
                                    </Text>
                                    <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                                        {(itemInfo as any).sc1Id}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.infoItem}>
                                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                                    Grupo de Item
                                </Text>
                                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                                    {item.itemGroup}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Descrição do Produto */}
                    <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Descrição do Produto
                        </Text>
                        <Text style={[styles.productDescription, { color: theme.colors.text }]}>
                            {item.itemSkuDescription || 'Sem descrição disponível'}
                        </Text>
                    </View>

                    {/* Quantidades e Valores */}
                    <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Quantidades e Valores
                        </Text>

                        <View style={styles.valuesGrid}>
                            <View style={[styles.valueCard, { backgroundColor: theme.colors.background }]}>
                                <Ionicons name="cube-outline" size={24} color={theme.colors.primary} />
                                <Text style={[styles.valueLabel, { color: theme.colors.textSecondary }]}>
                                    Quantidade
                                </Text>
                                <Text style={[styles.valueAmount, { color: theme.colors.text }]}>
                                    {item.quantity}
                                </Text>
                                <Text style={[styles.valueUnit, { color: theme.colors.textSecondary }]}>
                                    {item.unitMeasurement}
                                </Text>
                            </View>

                            <View style={[styles.valueCard, { backgroundColor: theme.colors.background }]}>
                                <Ionicons name="pricetag-outline" size={24} color={theme.colors.primary} />
                                <Text style={[styles.valueLabel, { color: theme.colors.textSecondary }]}>
                                    Valor Unitário
                                </Text>
                                <Text style={[styles.valueAmount, { color: theme.colors.text }]}>
                                    {item.currency} {item.unitValue?.toFixed(2) || '0,00'}
                                </Text>
                            </View>

                            <View style={[styles.valueCard, { backgroundColor: theme.colors.primary + '15' }]}>
                                <Ionicons name="cash-outline" size={24} color={theme.colors.primary} />
                                <Text style={[styles.valueLabel, { color: theme.colors.textSecondary }]}>
                                    Valor Total
                                </Text>
                                <Text style={[styles.valueAmountTotal, { color: theme.colors.primary }]}>
                                    {item.currency} {item.itemTotal?.toFixed(2) || '0,00'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Informações Organizacionais */}
                    <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Informações Organizacionais
                        </Text>

                        <View style={styles.infoGrid}>
                            <View style={styles.infoItem}>
                                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                                    Centro de Custo
                                </Text>
                                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                                    {item.costCenter}
                                </Text>
                            </View>

                            <View style={styles.infoItem}>
                                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                                    Grupo de Aprovação
                                </Text>
                                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                                    {item.groupAprov}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Botões de Ação */}
                    <View style={styles.actionsSection}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                            onPress={() => {
                                // Implementar ação de visualizar histórico
                                console.log('Ver histórico do item:', itemInfo.productCode);
                            }}
                        >
                            <Ionicons name="time-outline" size={20} color="white" />
                            <Text style={styles.actionButtonText}>Ver Histórico</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
                            onPress={() => {
                                // Implementar ação de ver detalhes do fornecedor
                                console.log('Ver fornecedor do item:', itemInfo.productCode);
                            }}
                        >
                            <Ionicons name="business-outline" size={20} color="white" />
                            <Text style={styles.actionButtonText}>Ver Fornecedor</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </Modal>
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
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    closeButton: {
        padding: 8,
        marginRight: 8,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 1,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    infoGrid: {
        gap: 12,
    },
    infoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    infoLabel: {
        fontSize: 14,
        flex: 1,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'right',
    },
    productDescription: {
        fontSize: 16,
        lineHeight: 24,
    },
    valuesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    valueCard: {
        flex: 1,
        minWidth: '30%',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        gap: 4,
    },
    valueLabel: {
        fontSize: 12,
        textAlign: 'center',
    },
    valueAmount: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    valueAmountTotal: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
    },
    valueUnit: {
        fontSize: 12,
    },
    actionsSection: {
        gap: 12,
        marginTop: 8,
        marginBottom: 32,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 8,
        gap: 8,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});