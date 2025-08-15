// src/components/approvals/DocumentCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import type { Document } from '../../types/approvals';
import {
    DOCUMENT_STATUS_LABELS,
    DOCUMENT_TYPES,
    formatCurrency,
    formatDate,
    getDocumentTypeIcon,
    getStatusColor
} from '../../types/approvals';

interface DocumentCardProps {
    document: Document;
    isSelected: boolean;
    onSelect: () => void;
    onPress: () => void;
    showSelection?: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
    document,
    isSelected,
    onSelect,
    onPress,
    showSelection = false
}) => {
    const { theme } = useThemeStore();

    const statusColor = getStatusColor(document.documentStatus);
    const documentTypeIcon = getDocumentTypeIcon(document.documentType);

    const supplierInfo = document.purchaseOrder?.[0] || document.purchaseRequest?.[0];
    const supplierName = 'supplyerName' in (supplierInfo || {})
        ? (supplierInfo as any).supplyerName
        : 'requesterName' in (supplierInfo || {})
            ? (supplierInfo as any).requesterName
            : 'N/A';

    const purchaserName = 'purchaserName' in (supplierInfo || {})
        ? (supplierInfo as any).purchaserName
        : 'N/A';

    const styles = createStyles(theme, statusColor);

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Borda lateral colorida */}
            <View style={styles.statusBorder} />

            {/* Conteúdo principal */}
            <View style={styles.content}>
                {/* Header do card */}
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <Ionicons
                            name={documentTypeIcon as any}
                            size={20}
                            color={theme.colors.primary}
                            style={styles.typeIcon}
                        />
                        <Text style={styles.documentType}>
                            {DOCUMENT_TYPES[document.documentType]}
                        </Text>
                        <Text style={styles.documentNumber}>
                            {document.documentNumber}
                        </Text>
                    </View>

                    {/* Checkbox de seleção */}
                    {showSelection && (
                        <TouchableOpacity
                            onPress={onSelect}
                            style={styles.selectionButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons
                                name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                                size={24}
                                color={isSelected ? theme.colors.primary : theme.colors.text}
                            />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Informações principais */}
                <View style={styles.mainInfo}>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Filial:</Text>
                        <Text style={styles.value}>{document.documentBranch.trim()}</Text>
                    </View>

                    {supplierName && supplierName !== 'N/A' && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>
                                {document.documentType === 'SC' ? 'Solicitante:' : 'Fornecedor:'}
                            </Text>
                            <Text style={styles.value} numberOfLines={1}>
                                {supplierName}
                            </Text>
                        </View>
                    )}

                    {purchaserName && purchaserName !== 'N/A' && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Comprador:</Text>
                            <Text style={styles.value}>{purchaserName}</Text>
                        </View>
                    )}

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Data:</Text>
                        <Text style={styles.value}>{formatDate(document.documentCreated)}</Text>
                    </View>
                </View>

                {/* Footer com valor e status */}
                <View style={styles.footer}>
                    <View style={styles.valueContainer}>
                        <Text style={styles.valueLabel}>Valor</Text>
                        <Text style={styles.valueAmount}>
                            {formatCurrency(document.documentTotal, document.documentSymbol)}
                        </Text>
                        {document.documentExchangeValue > 0 && document.documentExchangeValue !== document.documentTotal && (
                            <Text style={styles.exchangeValue}>
                                {formatCurrency(document.documentExchangeValue, document.documentStrongSymbol)}
                            </Text>
                        )}
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.statusText}>
                            {DOCUMENT_STATUS_LABELS[document.documentStatus]}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const createStyles = (theme: any, statusColor: string) => StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surface,
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 12,
        flexDirection: 'row',
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },

    statusBorder: {
        width: 4,
        backgroundColor: statusColor,
    },

    content: {
        flex: 1,
        padding: 16,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },

    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },

    typeIcon: {
        marginRight: 8,
    },

    documentType: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        flex: 1,
    },

    documentNumber: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.primary,
        marginLeft: 8,
    },

    selectionButton: {
        padding: 4,
    },

    mainInfo: {
        marginBottom: 16,
    },

    infoRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },

    label: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        width: 80,
        fontWeight: '500',
    },

    value: {
        fontSize: 14,
        color: theme.colors.text,
        flex: 1,
    },

    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },

    valueContainer: {
        flex: 1,
    },

    valueLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 2,
    },

    valueAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
    },

    exchangeValue: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
    },

    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginLeft: 12,
    },

    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
    },
});