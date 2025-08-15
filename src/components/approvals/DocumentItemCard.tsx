// src/components/approvals/DocumentItemCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import type { PurchaseOrderItem, PurchaseRequestItem } from '../../types/documentDetails';

interface DocumentItemCardProps {
    item: PurchaseOrderItem | PurchaseRequestItem;
    onPress?: () => void;
    onViewMore?: () => void;
    onViewHistory?: () => void;
    showActions?: boolean;
}

export function DocumentItemCard({
    item,
    onPress,
    onViewMore,
    onViewHistory,
    showActions = true
}: DocumentItemCardProps) {
    const { theme } = useThemeStore();

    // Função para verificar se é um item de pedido de compra
    const isPurchaseOrderItem = (item: any): item is PurchaseOrderItem => {
        return 'purchaseOrderNumber' in item;
    };

    // Obter o código do produto baseado no tipo
    const getProductCode = () => {
        if (isPurchaseOrderItem(item)) {
            return item.itemSku;
        }
        return item.itemProduct;
    };

    // Obter a descrição do produto
    const getProductDescription = () => {
        return item.itemSkuDescription || 'PRODUTO SEM DESCRIÇÃO';
    };

    // Obter o número do documento
    const getDocumentNumber = () => {
        if (isPurchaseOrderItem(item)) {
            return `${item.purchaseOrderNumber}-${item.purchaseOrderItem}`;
        }
        return `${item.requestNumber}-${item.requestItem}`;
    };

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: theme.colors.surface }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Header do Item */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.productCode, { color: theme.colors.textSecondary }]}>
                        {getProductCode()}
                    </Text>
                    <Text style={[styles.documentNumber, { color: theme.colors.primary }]}>
                        Item: {getDocumentNumber()}
                    </Text>
                </View>

                <View style={styles.headerRight}>
                    <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
                        {item.currency} {item.itemTotal?.toFixed(2) || '0,00'}
                    </Text>
                </View>
            </View>

            {/* Descrição do Produto */}
            <Text
                style={[styles.productDescription, { color: theme.colors.text }]}
                numberOfLines={2}
            >
                {getProductDescription()}
            </Text>

            {/* Detalhes do Item */}
            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                        <Ionicons
                            name="business-outline"
                            size={16}
                            color={theme.colors.textSecondary}
                        />
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                            C.C.
                        </Text>
                        <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                            {item.costCenter}
                        </Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Ionicons
                            name="cube-outline"
                            size={16}
                            color={theme.colors.textSecondary}
                        />
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                            Qtd.
                        </Text>
                        <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                            {item.quantity} {item.unitMeasurement}
                        </Text>
                    </View>
                </View>

                <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                        <Ionicons
                            name="pricetag-outline"
                            size={16}
                            color={theme.colors.textSecondary}
                        />
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                            V. Unit.
                        </Text>
                        <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                            {item.currency} {item.unitValue?.toFixed(2) || '0,00'}
                        </Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Ionicons
                            name="people-outline"
                            size={16}
                            color={theme.colors.textSecondary}
                        />
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                            Grupo
                        </Text>
                        <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                            {item.groupAprov}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Ações */}
            {showActions && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionButton, { borderColor: theme.colors.primary }]}
                        onPress={onViewMore}
                    >
                        <Ionicons
                            name="eye-outline"
                            size={16}
                            color={theme.colors.primary}
                        />
                        <Text style={[styles.actionText, { color: theme.colors.primary }]}>
                            Ver Mais
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { borderColor: theme.colors.primary }]}
                        onPress={onViewHistory}
                    >
                        <Ionicons
                            name="time-outline"
                            size={16}
                            color={theme.colors.primary}
                        />
                        <Text style={[styles.actionText, { color: theme.colors.primary }]}>
                            Histórico
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    productCode: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 2,
    },
    documentNumber: {
        fontSize: 12,
        fontWeight: '600',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    productDescription: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        lineHeight: 22,
    },
    details: {
        gap: 8,
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 6,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 12,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderRadius: 8,
        gap: 6,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
    },
});