// src/components/approvals/DashboardCard.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import type { DocumentType } from '../../types/approvals';
import { DOCUMENT_TYPES, getDocumentTypeIcon } from '../../types/approvals';

interface DashboardCardProps {
    documentType: DocumentType;
    summary: {
        pending: number;
        approved: number;
        rejected: number;
    };
    isLoading?: boolean;
}

interface StatusSectionProps {
    label: string;
    count: number;
    color: string;
    onPress: () => void;
    showBadge?: boolean;
}

const StatusSection: React.FC<StatusSectionProps> = ({
    label,
    count,
    color,
    onPress,
    showBadge = false
}) => {
    const { theme } = useThemeStore();

    const statusStyles = StyleSheet.create({
        statusSection: {
            borderLeftWidth: 4,
            borderLeftColor: color,
            paddingLeft: 12,
            paddingVertical: 8,
        },
        statusContent: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        statusLabel: {
            fontSize: 14,
            fontWeight: '500',
            color: theme.colors.textSecondary,
        },
        statusCountContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        statusCount: {
            fontSize: 16,
            fontWeight: '700',
            color: theme.colors.text,
        },
        badge: {
            backgroundColor: color,
            borderRadius: 12,
            minWidth: 24,
            height: 24,
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: 8,
        },
        badgeText: {
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: '600',
            textAlign: 'center',
        },
    });

    return (
        <TouchableOpacity
            style={statusStyles.statusSection}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={statusStyles.statusContent}>
                <Text style={statusStyles.statusLabel}>
                    {label}
                </Text>
                <View style={statusStyles.statusCountContainer}>
                    <Text style={statusStyles.statusCount}>
                        {count}
                    </Text>
                    {showBadge && count > 0 && (
                        <View style={statusStyles.badge}>
                            <Text style={statusStyles.badgeText}>{count}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

export const DashboardCard: React.FC<DashboardCardProps> = ({
    documentType,
    summary,
    isLoading = false
}) => {
    const { theme } = useThemeStore();
    const documentTypeIcon = getDocumentTypeIcon(documentType);

    const navigateToApprovals = (status: '02' | '03' | '06') => {
        // Navega para a página de aprovações com filtros aplicados
        router.push({
            pathname: '/(app)/(tabs)/approvals',
            params: {
                documentType,
                status,
                initialTab: status === '02' ? 0 : status === '03' ? 1 : 2
            }
        });
    };

    const cardStyles = StyleSheet.create({
        container: {
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            padding: 16,
            margin: 8,
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            minHeight: 200,
        },
        loadingContent: {
            flex: 1,
            justifyContent: 'center',
        },
        loadingPlaceholder: {
            height: 16,
            backgroundColor: theme.colors.border,
            borderRadius: 8,
            opacity: 0.6,
        },
        header: {
            marginBottom: 16,
        },
        titleContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        icon: {
            marginRight: 12,
        },
        title: {
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text,
            flex: 1,
            lineHeight: 22,
        },
        statusContainer: {
            flex: 1,
            gap: 12,
        },
        footer: {
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            paddingTop: 12,
            marginTop: 8,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        totalLabel: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            fontWeight: '500',
        },
        totalCount: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.colors.primary,
        },
    });

    if (isLoading) {
        return (
            <View style={cardStyles.container}>
                <View style={cardStyles.loadingContent}>
                    <View style={cardStyles.loadingPlaceholder} />
                    <View style={[cardStyles.loadingPlaceholder, { width: '60%', marginTop: 8 }]} />
                    <View style={[cardStyles.loadingPlaceholder, { width: '40%', marginTop: 4 }]} />
                </View>
            </View>
        );
    }

    return (
        <View style={cardStyles.container}>
            {/* Header do card */}
            <View style={cardStyles.header}>
                <View style={cardStyles.titleContainer}>
                    <Ionicons
                        name={documentTypeIcon as any}
                        size={24}
                        color={theme.colors.primary}
                        style={cardStyles.icon}
                    />
                    <Text style={cardStyles.title} numberOfLines={2}>
                        {DOCUMENT_TYPES[documentType]}
                    </Text>
                </View>
            </View>

            {/* Seções de status */}
            <View style={cardStyles.statusContainer}>
                <StatusSection
                    label="Pendentes"
                    count={summary.pending}
                    color="#0c9abe"
                    onPress={() => navigateToApprovals('02')}
                    showBadge={true}
                />

                <StatusSection
                    label="Aprovados"
                    count={summary.approved}
                    color="#28a745"
                    onPress={() => navigateToApprovals('03')}
                />

                <StatusSection
                    label="Reprovados"
                    count={summary.rejected}
                    color="#dc3545"
                    onPress={() => navigateToApprovals('06')}
                />
            </View>

            {/* Total de documentos */}
            <View style={cardStyles.footer}>
                <Text style={cardStyles.totalLabel}>Total de documentos</Text>
                <Text style={cardStyles.totalCount}>
                    {summary.pending + summary.approved + summary.rejected}
                </Text>
            </View>
        </View>
    );
};

// Removendo a função createStyles que não é mais necessária