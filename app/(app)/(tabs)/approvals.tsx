// app/(app)/(tabs)/approvals.tsx
import { Ionicons } from '@expo/vector-icons';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActionSheetIOS,
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { DocumentCard } from '../../../src/components/approvals/DocumentCard';
import { FilterModal } from '../../../src/components/approvals/FilterModal';
import { MultiBranchFilter } from '../../../src/components/approvals/MultiBranchFilter';
import { SafeArea } from '../../../src/components/layout/SafeArea';
import { useApprovalsStore } from '../../../src/store/approvalsStore';
import { useThemeStore } from '../../../src/store/themeStore';
import type { Document, DocumentStatus, DocumentType } from '../../../src/types/approvals';

const SEGMENTS = ['Pendentes', 'Aprovados', 'Reprovados'];
const STATUS_MAP: Record<number, DocumentStatus> = {
    0: '02', // Pendentes
    1: '03', // Aprovados
    2: '06'  // Reprovados
};

export default function ApprovalsScreen() {
    const { theme } = useThemeStore();
    const {
        documents,
        selectedDocuments,
        currentStatus,
        isLoading,
        isLoadingMore,
        isRefreshing,
        hasNextPage,
        error,
        filters,
        sortOption,
        loadDocuments,
        loadMoreDocuments,
        refreshDocuments,
        selectDocument,
        selectAllDocuments,
        clearSelection,
        approveSelected,
        rejectSelected,
        setFilters,
        clearFilters,
        setSortOption,
        setCurrentStatus,
        isDocumentSelected,
        getSelectedDocuments,
        clearError,
        getSortOptions
    } = useApprovalsStore();

    // Estados locais
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

    // Refs
    const flatListRef = useRef<FlatList>(null);

    // Parâmetros da URL (para navegação do dashboard)
    const params = useLocalSearchParams<{
        documentType?: DocumentType;
        status?: DocumentStatus;
        initialTab?: string;
    }>();

    // Efeito para navegação do dashboard
    useEffect(() => {
        if (params.initialTab) {
            const tabIndex = parseInt(params.initialTab);
            if (tabIndex >= 0 && tabIndex <= 2) {
                setSelectedIndex(tabIndex);
                setCurrentStatus(STATUS_MAP[tabIndex]);
            }
        }
    }, [params.initialTab]);

    // Carrega documentos quando status muda
    useEffect(() => {
        const status = STATUS_MAP[selectedIndex];
        setCurrentStatus(status);
        loadDocuments(status, true);
        setIsSelectionMode(false);
        clearSelection();
    }, [selectedIndex]);

    // Limpa erro quando aparecer
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                clearError();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleSegmentChange = (index: number) => {
        setSelectedIndex(index);
    };

    const handleDocumentPress = (document: Document) => {
        if (isSelectionMode) {
            selectDocument(document.scrId);
        } else {
            // Navega para detalhes do documento
            router.push(`/document-details/${document.scrId}`);
        }
    };

    const handleDocumentLongPress = (document: Document) => {
        if (!isSelectionMode && currentStatus === '02') {
            setIsSelectionMode(true);
            selectDocument(document.scrId);
        }
    };

    const handleDocumentSelect = (document: Document) => {
        selectDocument(document.scrId);
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        if (isSelectionMode) {
            clearSelection();
        }
    };

    const handleSelectAll = () => {
        selectAllDocuments();
    };

    const handleSortPress = () => {
        const sortOptions = getSortOptions();

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancelar', ...sortOptions.map(opt => opt.label)],
                    cancelButtonIndex: 0,
                    title: 'Ordenar por'
                },
                (buttonIndex) => {
                    if (buttonIndex > 0) {
                        setSortOption(sortOptions[buttonIndex - 1]);
                    }
                }
            );
        } else {
            // Para Android, pode usar um modal customizado ou Alert
            Alert.alert(
                'Ordenar por',
                'Selecione uma opção',
                sortOptions.map(option => ({
                    text: option.label,
                    onPress: () => setSortOption(option)
                }))
            );
        }
    };

    const handleApproveSelected = async () => {
        const selectedDocs = getSelectedDocuments();
        if (selectedDocs.length === 0) return;

        Alert.alert(
            'Confirmar Aprovação',
            `Deseja aprovar ${selectedDocs.length} documento(s) selecionado(s)?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Aprovar',
                    style: 'default',
                    onPress: async () => {
                        try {
                            await approveSelected();
                            setIsSelectionMode(false);
                            Alert.alert('Sucesso', 'Documentos aprovados com sucesso!');
                        } catch (error) {
                            Alert.alert('Erro', 'Falha ao aprovar documentos');
                        }
                    }
                }
            ]
        );
    };

    const handleRejectSelected = async () => {
        const selectedDocs = getSelectedDocuments();
        if (selectedDocs.length === 0) return;

        Alert.prompt(
            'Confirmar Reprovação',
            `Deseja reprovar ${selectedDocs.length} documento(s)?\nMotivo (opcional):`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Reprovar',
                    style: 'destructive',
                    onPress: async (reason) => {
                        try {
                            await rejectSelected(reason);
                            setIsSelectionMode(false);
                            Alert.alert('Sucesso', 'Documentos reprovados com sucesso!');
                        } catch (error) {
                            Alert.alert('Erro', 'Falha ao reprovar documentos');
                        }
                    }
                }
            ],
            'plain-text'
        );
    };

    // Função para lidar com mudanças nas filiais selecionadas
    const handleBranchesChange = (branches: string[]) => {
        setSelectedBranches(branches);

        // Atualiza os filtros automaticamente
        const newFilters = {
            ...filters,
            documentBranch: branches.length > 0 ? branches : undefined
        };
        setFilters(newFilters);
    };

    // Função para limpar todos os filtros incluindo filiais
    const handleClearAllFilters = () => {
        clearFilters();
        setSelectedBranches([]);
    };

    // Função para contar filtros ativos
    const getActiveFiltersCount = () => {
        let count = 0;
        if (filters.searchkey) count++;
        if (filters.initDate || filters.endDate) count++;
        if (filters.documentBranch && filters.documentBranch.length > 0) count++;
        if (filters.documentTypes && filters.documentTypes.length > 0) count++;
        if (selectedBranches.length > 0) count++;
        return count;
    };

    const hasActiveFilters = () => {
        return getActiveFiltersCount() > 0;
    };

    const renderDocument = useCallback(({ item }: { item: Document }) => (
        <DocumentCard
            document={item}
            isSelected={isDocumentSelected(item.scrId)}
            onSelect={() => handleDocumentSelect(item)}
            onPress={() => handleDocumentPress(item)}
            showSelection={isSelectionMode}
        />
    ), [isSelectionMode, isDocumentSelected]);

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Ionicons
                name="document-text-outline"
                size={64}
                color={theme.colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                Nenhum documento encontrado
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                {hasActiveFilters()
                    ? 'Tente ajustar os filtros de busca'
                    : 'Não há documentos para este status'
                }
            </Text>
        </View>
    );

    const renderLoadingFooter = () => {
        if (!isLoadingMore) return null;

        return (
            <View style={styles.loadingFooter}>
                <ActivityIndicator color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                    Carregando mais documentos...
                </Text>
            </View>
        );
    };

    const styles = createStyles(theme);

    return (
        <SafeArea>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Aprovações</Text>

                <View style={styles.headerActions}>
                    {/* Filtro de multi-filial */}
                    <MultiBranchFilter
                        selectedBranches={selectedBranches}
                        onBranchesChange={handleBranchesChange}
                    />

                    {/* Botão de filtro */}
                    <TouchableOpacity
                        style={[
                            styles.headerButton,
                            hasActiveFilters() && styles.headerButtonActive
                        ]}
                        onPress={() => setIsFilterModalVisible(true)}
                    >
                        <Ionicons
                            name="filter"
                            size={20}
                            color={hasActiveFilters() ? '#FFFFFF' : theme.colors.text}
                        />
                        {hasActiveFilters() && (
                            <View style={styles.filterBadge}>
                                <Text style={styles.filterBadgeText}>
                                    {getActiveFiltersCount()}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Botão de ordenação */}
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={handleSortPress}
                    >
                        <Ionicons name="swap-vertical" size={20} color={theme.colors.text} />
                    </TouchableOpacity>

                    {/* Botão de seleção (apenas para pendentes) */}
                    {currentStatus === '02' && (
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={toggleSelectionMode}
                        >
                            <Ionicons
                                name={isSelectionMode ? "close" : "checkmark-circle-outline"}
                                size={20}
                                color={isSelectionMode ? theme.colors.error : theme.colors.text}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Segmented Control */}
            <View style={styles.segmentContainer}>
                <SegmentedControl
                    values={SEGMENTS}
                    selectedIndex={selectedIndex}
                    onChange={(event) => handleSegmentChange(event.nativeEvent.selectedSegmentIndex)}
                    style={styles.segmentedControl}
                    backgroundColor={theme.colors.surface}
                    tintColor={theme.colors.primary}
                    fontStyle={{ color: theme.colors.text }}
                    activeFontStyle={{ color: '#FFFFFF' }}
                />
            </View>



            {/* Modo de seleção header */}
            {isSelectionMode && (
                <View style={styles.selectionHeader}>
                    <Text style={[styles.selectionText, { color: theme.colors.text }]}>
                        {selectedDocuments.length} selecionado(s)
                    </Text>
                    <TouchableOpacity onPress={handleSelectAll}>
                        <Text style={[styles.selectAllText, { color: theme.colors.primary }]}>
                            Selecionar Todos
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Filtros ativos (mantido para compatibilidade) */}
            {Object.keys(filters).length > 0 && (
                <View style={styles.activeFilters}>
                    <Text style={[styles.filtersText, { color: theme.colors.textSecondary }]}>
                        Filtros ativos
                    </Text>
                    <TouchableOpacity onPress={handleClearAllFilters}>
                        <Text style={[styles.clearFiltersText, { color: theme.colors.primary }]}>
                            Limpar
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Error message */}
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={clearError}>
                        <Ionicons name="close" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Lista de documentos */}
            <FlatList
                ref={flatListRef}
                data={documents}
                keyExtractor={(item) => `${item.scrId}-${item.documentNumber}`}
                renderItem={renderDocument}
                ListEmptyComponent={!isLoading ? renderEmptyList : null}
                ListFooterComponent={renderLoadingFooter}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={refreshDocuments}
                        tintColor={theme.colors.primary}
                        colors={[theme.colors.primary]}
                    />
                }
                onEndReached={() => {
                    if (hasNextPage && !isLoadingMore) {
                        loadMoreDocuments();
                    }
                }}
                onEndReachedThreshold={0.1}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={documents.length === 0 ? styles.emptyListContainer : undefined}
            />

            {/* Loading overlay */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                        Carregando documentos...
                    </Text>
                </View>
            )}

            {/* Ações de aprovação (modo de seleção) */}
            {isSelectionMode && selectedDocuments.length > 0 && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={handleRejectSelected}
                    >
                        <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Reprovar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={handleApproveSelected}
                    >
                        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Aprovar</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Modal de filtros */}
            <FilterModal
                visible={isFilterModalVisible}
                onClose={() => setIsFilterModalVisible(false)}
                currentFilters={filters}
                onApplyFilters={setFilters}
            />
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },

    title: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.text,
    },

    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    headerButton: {
        padding: 8,
        borderRadius: 8,
        position: 'relative',
    },

    headerButtonActive: {
        backgroundColor: theme.colors.primary,
    },

    filterBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: theme.colors.error,
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },

    filterBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '600',
    },

    segmentContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },

    segmentedControl: {
        height: 36,
    },



    selectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },

    selectionText: {
        fontSize: 16,
        fontWeight: '500',
    },

    selectAllText: {
        fontSize: 16,
        fontWeight: '500',
    },

    activeFilters: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: theme.colors.surface,
    },

    filtersText: {
        fontSize: 14,
    },

    clearFiltersText: {
        fontSize: 14,
        fontWeight: '500',
    },

    errorContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.error,
        paddingHorizontal: 20,
        paddingVertical: 12,
    },

    errorText: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },

    emptyListContainer: {
        flexGrow: 1,
    },

    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    },

    loadingFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        gap: 12,
    },

    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },

    loadingText: {
        fontSize: 14,
        fontWeight: '500',
    },

    actionButtons: {
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
        paddingVertical: 14,
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