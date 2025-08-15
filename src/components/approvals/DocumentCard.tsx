// src/components/approvals/DocumentCard.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import type { Document } from '../../types/approvals';
import { DOCUMENT_STATUS_LABELS, DOCUMENT_TYPES } from '../../types/approvals';

interface DocumentCardProps {
    document: Document;
    isSelected?: boolean;
    onSelect?: () => void;
    onPress?: () => void;
    onLongPress?: () => void;
    showSelection?: boolean;
}

export function DocumentCard({
    document,
    isSelected = false,
    onSelect,
    onPress,
    onLongPress,
    showSelection = false
}: DocumentCardProps) {
    const { theme } = useThemeStore();

    // Verificação de segurança
    if (!document) {
        console.warn('DocumentCard: document is undefined');
        return null;
    }

    const handlePress = () => {
        if (showSelection) {
            // Se estiver no modo de seleção, apenas seleciona/deseleciona
            onSelect?.();
        } else {
            // Caso contrário, navega para a página de detalhes
            try {
                router.push(`/document/${document.scrId}`);
                onPress?.();
            } catch (error) {
                console.error('Erro ao navegar para detalhes:', error);
                Alert.alert('Erro', 'Não foi possível abrir os detalhes do documento');
            }
        }
    };

    const handleLongPress = () => {
        if (!showSelection) {
            // Long press inicia o modo de seleção
            onLongPress?.();
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case '02':
                return '#F59E0B'; // Pendente - Amarelo
            case '03':
                return '#10B981'; // Aprovado - Verde
            case '06':
                return '#EF4444'; // Reprovado - Vermelho
            default:
                return theme.colors.textSecondary;
        }
    };

    const getDocumentTypeIcon = (type: string) => {
        switch (type) {
            case 'PC':
                return 'receipt-outline';
            case 'SC':
                return 'clipboard-outline';
            case 'IP':
                return 'document-text-outline';
            case 'AE':
                return 'checkmark-done-outline';
            case 'CT':
                return 'contract-outline';
            case 'MD':
                return 'bar-chart-outline';
            case 'IM':
                return 'list-outline';
            case 'SA':
                return 'cube-outline';
            default:
                return 'document-outline';
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const formatDateRelative = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = now.getTime() - date.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                return 'Hoje';
            } else if (diffDays === 1) {
                return 'Ontem';
            } else if (diffDays < 7) {
                return `${diffDays} dias atrás`;
            } else {
                return formatDate(dateString);
            }
        } catch {
            return formatDate(dateString);
        }
    };

    const getPriorityIndicator = () => {
        // Lógica para determinar prioridade baseada no valor ou data
        const value = document.documentTotal;
        const isHighValue = value > 10000; // Valores acima de R$ 10.000
        const isUrgent = document.documentStatus === '02'; // Pendente

        if (isHighValue && isUrgent) {
            return {
                color: '#EF4444',
                icon: 'flash' as const,
                label: 'Urgente'
            };
        } else if (isHighValue) {
            return {
                color: '#F59E0B',
                icon: 'star' as const,
                label: 'Alto Valor'
            };
        }
        return null;
    };

    const priorityIndicator = getPriorityIndicator();

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    backgroundColor: theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border
                },
                isSelected && styles.selected
            ]}
            onPress={handlePress}
            onLongPress={handleLongPress}
            activeOpacity={0.7}
            delayLongPress={300}
        >
            {/* Priority Indicator */}
            {priorityIndicator && (
                <View style={[styles.priorityBadge, { backgroundColor: priorityIndicator.color }]}>
                    <Ionicons name={priorityIndicator.icon} size={12} color="white" />
                </View>
            )}

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.typeContainer}>
                        <View style={[styles.typeIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                            <Ionicons
                                name={getDocumentTypeIcon(document.documentType)}
                                size={16}
                                color={theme.colors.primary}
                            />
                        </View>

                        <View style={styles.typeInfo}>
                            <Text style={[styles.documentType, { color: theme.colors.primary }]}>
                                {DOCUMENT_TYPES[document.documentType]}
                            </Text>
                            <View
                                style={[
                                    styles.statusBadge,
                                    { backgroundColor: getStatusColor(document.documentStatus) + '20' }
                                ]}
                            >
                                <Text style={[styles.statusText, { color: getStatusColor(document.documentStatus) }]}>
                                    {DOCUMENT_STATUS_LABELS[document.documentStatus]}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <Text style={[styles.documentNumber, { color: theme.colors.text }]}>
                        {document.documentNumber}
                    </Text>
                </View>

                <View style={styles.headerRight}>
                    {showSelection && (
                        <View style={[
                            styles.checkbox,
                            {
                                backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                                borderColor: isSelected ? theme.colors.primary : theme.colors.border
                            }
                        ]}>
                            {isSelected && (
                                <Ionicons name="checkmark" size={16} color="white" />
                            )}
                        </View>
                    )}

                    <Text style={[styles.documentValue, { color: theme.colors.primary }]}>
                        {formatCurrency(document.documentTotal)}
                    </Text>
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Details Row */}
                <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                        <Ionicons name="business-outline" size={14} color={theme.colors.textSecondary} />
                        <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                            {document.documentBranch}
                        </Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
                        <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                            {formatDateRelative(document.documentCreated)}
                        </Text>
                    </View>
                </View>

                {/* Supplier Info */}
                {/* Supplier Info - usando dados corretos do Document */}
                {document.purchaseOrder?.[0]?.supplyerName && (
                    <View style={styles.supplierContainer}>
                        <Ionicons name="person-outline" size={14} color={theme.colors.textSecondary} />
                        <Text
                            style={[styles.supplierText, { color: theme.colors.text }]}
                            numberOfLines={1}
                        >
                            {document.purchaseOrder[0].supplyerName}
                        </Text>
                    </View>
                )}

                {/* Additional Info - usando dados corretos do Document */}
                {document.purchaseRequest?.[0]?.requesterName && (
                    <View style={styles.requestedByContainer}>
                        <Text style={[styles.requestedByLabel, { color: theme.colors.textSecondary }]}>
                            Solicitado por:
                        </Text>
                        <Text style={[styles.requestedByText, { color: theme.colors.text }]}>
                            {document.purchaseRequest[0].requesterName}
                        </Text>
                    </View>
                )}

                {/* Informação adicional do documento */}
                {document.documentUserName && (
                    <View style={styles.requestedByContainer}>
                        <Text style={[styles.requestedByLabel, { color: theme.colors.textSecondary }]}>
                            Usuário:
                        </Text>
                        <Text style={[styles.requestedByText, { color: theme.colors.text }]}>
                            {document.documentUserName}
                        </Text>
                    </View>
                )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                {/* Tags/Categories */}
                <View style={styles.tagsContainer}>
                    {priorityIndicator && (
                        <View style={[styles.tag, { backgroundColor: priorityIndicator.color + '15' }]}>
                            <Text style={[styles.tagText, { color: priorityIndicator.color }]}>
                                {priorityIndicator.label}
                            </Text>
                        </View>
                    )}

                    {document.costCenter && (
                        <View style={[styles.tag, { backgroundColor: theme.colors.primary + '15' }]}>
                            <Text style={[styles.tagText, { color: theme.colors.primary }]}>
                                {document.costCenter}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Action Indicator */}
                {!showSelection && (
                    <View style={styles.actionIndicator}>
                        <Text style={[styles.tapHint, { color: theme.colors.textSecondary }]}>
                            Toque para detalhes
                        </Text>
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={theme.colors.textSecondary}
                        />
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        marginHorizontal: 4,
        elevation: 3,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        borderWidth: 1,
        position: 'relative',
    },
    selected: {
        elevation: 6,
        shadowOpacity: 0.2,
        shadowRadius: 8,
        transform: [{ scale: 0.98 }],
    },
    priorityBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerLeft: {
        flex: 1,
        marginRight: 12,
    },
    headerRight: {
        alignItems: 'flex-end',
        gap: 8,
    },
    typeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 10,
    },
    typeIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    typeInfo: {
        flex: 1,
        gap: 4,
    },
    documentType: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    documentNumber: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    documentValue: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        gap: 8,
        marginBottom: 12,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    detailText: {
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
    },
    supplierContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
    },
    supplierText: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    requestedByContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 2,
    },
    requestedByLabel: {
        fontSize: 12,
        marginRight: 4,
    },
    requestedByText: {
        fontSize: 12,
        fontWeight: '600',
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
    },
    tagsContainer: {
        flexDirection: 'row',
        gap: 6,
        flex: 1,
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    tagText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    actionIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    tapHint: {
        fontSize: 11,
        fontStyle: 'italic',
    },
});

// Export default para compatibilidade
export default DocumentCard;