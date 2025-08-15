// app/(app)/(tabs)/home.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { DashboardCard } from '../../../src/components/approvals/DashboardCard';
import { ConfigModal } from '../../../src/components/dashboard/ConfigModal';
import { SafeArea } from '../../../src/components/layout/SafeArea';
import { useApprovalsStore } from '../../../src/store/approvalsStore';
import { useAuthStore } from '../../../src/store/authStore';
import { useDashboardConfigStore } from '../../../src/store/dashboardConfigStore';
import { useThemeStore } from '../../../src/store/themeStore';
import { getModuleInfo, hasDocumentsForApproval } from '../../../src/types/approvals';

export default function HomeScreen() {
    const { theme } = useThemeStore();
    const { selectedModule } = useAuthStore();
    const {
        dashboardSummary,
        isDashboardLoading,
        loadDashboardSummary
    } = useApprovalsStore();

    const {
        enabledCards,
        isLoading: isConfigLoading,
        loadConfig,
        getAvailableCards
    } = useDashboardConfigStore();

    // Estados locais
    const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Informações do módulo atual
    const moduleCode = selectedModule?.code;
    const moduleInfo = moduleCode ? getModuleInfo(moduleCode) : null;
    const hasDocuments = moduleCode ? hasDocumentsForApproval(moduleCode) : false;
    const availableCards = getAvailableCards();

    // Carrega configuração inicial
    useEffect(() => {
        if (moduleCode) {
            loadConfig();
        }
    }, [moduleCode, loadConfig]);

    // Carrega dados do dashboard quando os cards habilitados mudam
    useEffect(() => {
        if (enabledCards.length > 0) {
            loadDashboardSummary(enabledCards);
        }
    }, [enabledCards, loadDashboardSummary]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                loadConfig(),
                enabledCards.length > 0 ? loadDashboardSummary(enabledCards) : Promise.resolve()
            ]);
        } catch (error) {
            console.error('Erro ao atualizar dashboard:', error);
        }
        setIsRefreshing(false);
    }, [loadConfig, enabledCards, loadDashboardSummary]);

    const renderDashboardCards = useCallback(() => {
        if (!hasDocuments) {
            return renderNoDocumentsForModule();
        }

        if (enabledCards.length === 0) {
            return renderNoCardsEnabled();
        }

        return (
            <View style={styles.cardsGrid}>
                {enabledCards.map(documentType => (
                    <View key={documentType} style={styles.cardContainer}>
                        <DashboardCard
                            documentType={documentType}
                            summary={dashboardSummary[documentType] || {
                                pending: 0,
                                approved: 0,
                                rejected: 0
                            }}
                            isLoading={isDashboardLoading}
                        />
                    </View>
                ))}
            </View>
        );
    }, [hasDocuments, enabledCards, dashboardSummary, isDashboardLoading]);

    const renderNoModuleSelected = useCallback(() => (
        <View style={styles.emptyDashboard}>
            <Ionicons
                name="help-circle-outline"
                size={64}
                color={theme.colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                Nenhum módulo selecionado
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                Selecione um módulo para visualizar o dashboard
            </Text>
        </View>
    ), [theme]);

    const renderNoDocumentsForModule = useCallback(() => (
        <View style={styles.emptyDashboard}>
            <Ionicons
                name={moduleInfo?.icon as any || "information-circle-outline"}
                size={64}
                color={theme.colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                Módulo sem documentos de aprovação
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                O módulo {moduleInfo?.name} não possui documentos que necessitem de aprovação.
            </Text>
            <View style={styles.moduleInfoCard}>
                <Text style={[styles.moduleInfoText, { color: theme.colors.textSecondary }]}>
                    Para acessar documentos de aprovação, selecione um dos seguintes módulos:
                    {'\n'}• Compras (SIGACOM)
                    {'\n'}• Contratos (SIGAGCT)
                    {'\n'}• Estoque (SIGAEST)
                </Text>
            </View>
        </View>
    ), [moduleInfo, theme]);

    const renderNoCardsEnabled = useCallback(() => (
        <View style={styles.emptyDashboard}>
            <Ionicons
                name="grid-outline"
                size={64}
                color={theme.colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                Nenhum card configurado
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                Configure os cards que deseja visualizar para o módulo {moduleInfo?.name}
            </Text>
            <TouchableOpacity
                style={[styles.configButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setIsConfigModalVisible(true)}
            >
                <Text style={styles.configButtonText}>Configurar Cards</Text>
            </TouchableOpacity>
        </View>
    ), [moduleInfo, theme]);

    // Contadores memoizados
    const totalPendingCount = useMemo(() => {
        return enabledCards.reduce((total, type) => {
            const summary = dashboardSummary[type];
            return total + (summary?.pending || 0);
        }, 0);
    }, [enabledCards, dashboardSummary]);

    const totalDocumentsCount = useMemo(() => {
        return enabledCards.reduce((total, type) => {
            const summary = dashboardSummary[type];
            return total + (summary?.pending || 0) + (summary?.approved || 0) + (summary?.rejected || 0);
        }, 0);
    }, [enabledCards, dashboardSummary]);

    const styles = createStyles(theme, moduleInfo?.color);

    return (
        <SafeArea>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Olá, administrador</Text>
                        <Text style={styles.subtitle}>
                            {moduleInfo ? moduleInfo.name : 'Selecione um módulo'}
                        </Text>
                        {moduleCode && (
                            <Text style={styles.moduleCode}>
                                {moduleCode}
                            </Text>
                        )}
                    </View>

                    <View style={styles.headerActions}>
                        {moduleInfo && (
                            <View style={[styles.moduleIconContainer, { backgroundColor: moduleInfo.color }]}>
                                <Ionicons
                                    name={moduleInfo.icon as any}
                                    size={24}
                                    color="#FFFFFF"
                                />
                            </View>
                        )}

                        {hasDocuments && (
                            <TouchableOpacity
                                style={styles.configIconButton}
                                onPress={() => setIsConfigModalVisible(true)}
                            >
                                <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Resumo geral */}
                {hasDocuments && enabledCards.length > 0 && !isDashboardLoading && (
                    <View style={styles.summaryContainer}>
                        <View style={[styles.summaryCard, {
                            borderLeftWidth: 4,
                            borderLeftColor: moduleInfo?.color || theme.colors.primary
                        }]}>
                            <View style={styles.summaryStats}>
                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                                        Pendentes
                                    </Text>
                                    <Text style={[styles.summaryValue, { color: '#0c9abe' }]}>
                                        {totalPendingCount}
                                    </Text>
                                </View>

                                <View style={styles.summaryDivider} />

                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                                        Total de Documentos
                                    </Text>
                                    <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                                        {totalDocumentsCount}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Conteúdo principal */}
                <ScrollView
                    style={styles.content}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor={theme.colors.primary}
                            colors={[theme.colors.primary]}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {/* Seção de documentos */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>
                                {moduleInfo ? `${moduleInfo.name} - Documentos` : 'Documentos'}
                            </Text>
                            {hasDocuments && (
                                <TouchableOpacity
                                    onPress={() => setIsConfigModalVisible(true)}
                                    style={styles.configTextButton}
                                >
                                    <Text style={[styles.configText, { color: theme.colors.primary }]}>
                                        Configurar
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {!moduleCode ? renderNoModuleSelected() : renderDashboardCards()}
                    </View>

                    {/* Ações rápidas - apenas se há documentos */}
                    {hasDocuments && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Ações Rápidas</Text>

                            <View style={styles.quickActions}>
                                <TouchableOpacity style={styles.quickActionItem}>
                                    <View style={[styles.quickActionIcon, { backgroundColor: '#0c9abe20' }]}>
                                        <Ionicons name="document-text" size={24} color="#0c9abe" />
                                    </View>
                                    <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                                        Todos os Pendentes
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.quickActionItem}>
                                    <View style={[styles.quickActionIcon, { backgroundColor: '#28a74520' }]}>
                                        <Ionicons name="checkmark-circle" size={24} color="#28a745" />
                                    </View>
                                    <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                                        Aprovados Hoje
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.quickActionItem}>
                                    <View style={[styles.quickActionIcon, { backgroundColor: '#dc354520' }]}>
                                        <Ionicons name="close-circle" size={24} color="#dc3545" />
                                    </View>
                                    <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                                        Reprovados
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.quickActionItem}>
                                    <View style={[styles.quickActionIcon, { backgroundColor: '#6c757d20' }]}>
                                        <Ionicons name="analytics" size={24} color="#6c757d" />
                                    </View>
                                    <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                                        Relatórios
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Dicas por módulo */}
                    {moduleInfo && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                Dicas - {moduleInfo.name}
                            </Text>

                            <View style={styles.tipsContainer}>
                                <View style={styles.tipItem}>
                                    <Ionicons name="bulb-outline" size={20} color={moduleInfo.color} />
                                    <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                                        Use os filtros para encontrar documentos específicos mais rapidamente
                                    </Text>
                                </View>

                                {hasDocuments && (
                                    <>
                                        <View style={styles.tipItem}>
                                            <Ionicons name="checkmark-circle-outline" size={20} color={moduleInfo.color} />
                                            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                                                Selecione múltiplos documentos do mesmo tipo para aprovação em lote
                                            </Text>
                                        </View>

                                        <View style={styles.tipItem}>
                                            <Ionicons name="settings-outline" size={20} color={moduleInfo.color} />
                                            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                                                Personalize seu dashboard ocultando cards que não utiliza
                                            </Text>
                                        </View>
                                    </>
                                )}

                                <View style={styles.tipItem}>
                                    <Ionicons name="swap-horizontal" size={20} color={moduleInfo.color} />
                                    <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                                        Para trocar de módulo, acesse as configurações do aplicativo
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Espaço adicional no final */}
                    <View style={styles.bottomSpace} />
                </ScrollView>

                {/* Modal de configuração */}
                <ConfigModal
                    visible={isConfigModalVisible}
                    onClose={() => setIsConfigModalVisible(false)}
                />
            </View>
        </SafeArea>
    );
}

const createStyles = (theme: any, moduleColor?: string) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
    },

    greeting: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 4,
    },

    subtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        fontWeight: '500',
    },

    moduleCode: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontWeight: '500',
        marginTop: 2,
    },

    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },

    moduleIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },

    configIconButton: {
        padding: 8,
        borderRadius: 8,
    },

    summaryContainer: {
        paddingHorizontal: 20,
        marginBottom: 8,
    },

    summaryCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },

    summaryStats: {
        flexDirection: 'row',
    },

    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },

    summaryDivider: {
        width: 1,
        backgroundColor: theme.colors.border,
        marginHorizontal: 20,
    },

    summaryLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },

    summaryValue: {
        fontSize: 28,
        fontWeight: '700',
    },

    content: {
        flex: 1,
    },

    section: {
        paddingHorizontal: 20,
        marginBottom: 32,
    },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },

    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.colors.text,
    },

    configTextButton: {
        padding: 4,
    },

    configText: {
        fontSize: 16,
        fontWeight: '500',
    },

    cardsGrid: {
        gap: 8,
    },

    cardContainer: {
        marginHorizontal: -8,
    },

    emptyDashboard: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },

    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },

    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },

    moduleInfoCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },

    moduleInfoText: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'left',
    },

    configButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },

    configButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },

    quickActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },

    quickActionItem: {
        flex: 1,
        minWidth: '45%',
        alignItems: 'center',
        padding: 20,
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },

    quickActionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },

    quickActionText: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },

    tipsContainer: {
        gap: 16,
    },

    tipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },

    tipText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },

    bottomSpace: {
        height: 40,
    },
});