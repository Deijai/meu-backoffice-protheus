// app/(app)/(tabs)/approvals.tsx - Integração completa com navegação
import DocumentCard from '@/src/components/approvals/DocumentCard';
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
    Vibration,
    View
} from 'react-native';
import { FilterModal } from '../../../src/components/approvals/FilterModal';
import { SafeArea } from '../../../src/components/layout/SafeArea';
import { useApprovalsStore } from '../../../src/store/approvalsStore';
import { useAuthStore } from '../../../src/store/authStore';
import { useThemeStore } from '../../../src/store/themeStore';
import type { Document, DocumentStatus, DocumentType } from '../../../src/types/approvals';
import { getModuleInfo, hasDocumentsForApproval } from '../../../src/types/approvals';

const SEGMENTS = ['Pendentes', 'Aprovados', 'Reprovados'];
const STATUS_MAP: Record<number, DocumentStatus> = {
    0: '02', // Pendentes
    1: '03', // Aprovados
    2: '06'  // Reprovados
};

export default function ApprovalsScreen() {
    const { theme } = useThemeStore();
    const { selectedModule } = useAuthStore();
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
        getSortOptions,
        getCurrentModuleCode,
        getValidDocumentTypesForCurrentModule
    } = useApprovalsStore();

    // Estados locais
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    // Refs
    const flatListRef = useRef<FlatList>(null);

    // Parâmetros da URL (para navegação do dashboard)
    const params = useLocalSearchParams<{
        documentType?: DocumentType;
        status?: DocumentStatus;
        initialTab?: string;
    }>();

    // Informações do módulo atual
    const moduleCode = getCurrentModuleCode();
    const moduleInfo = moduleCode ? getModuleInfo(moduleCode) : null;
    const hasValidModule = moduleCode ? hasDocumentsForApproval(moduleCode) : false;

    // Efeitos
    useEffect(() => {
        // Configurar status inicial baseado nos parâmetros
        if (params.status) {
            const statusIndex = Object.values(STATUS_MAP).indexOf(params.status);
            if (statusIndex !== -1) {
                setSelectedIndex(statusIndex);
                setCurrentStatus(params.status);
            }
        }

        // Configurar filtros iniciais
        if (params.documentType) {
            setFilters({ documentTypes: [params.documentType] });
        }
    }, [params]);

    useEffect(() => {
        // Carregar documentos quando o status ou módulo mudarem
        if (hasValidModule) {
            loadDocuments(currentStatus, true);
        }
    }, [currentStatus, selectedModule, hasValidModule]);

    useEffect(() => {
        // Limpar seleção quando sair do modo de seleção
        if (!isSelectionMode) {
            clearSelection();
        }
    }, [isSelectionMode]);

    // Handlers
    const handleSegmentChange = (index: number) => {
        setSelectedIndex(index);
        const newStatus = STATUS_MAP[index];
        setCurrentStatus(newStatus);
        setIsSelectionMode(false); // Sair do modo de seleção ao trocar de aba

        // Scroll para o topo
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    };

    const handleDocumentSelect = (document: Document) => {
        if (isSelectionMode) {
            selectDocument(document.scrId);

            // Vibração leve para feedback tátil
            if (Platform.OS === 'ios') {
                Vibration.vibrate(10);
            }
        } else {
            // Navegar para detalhes do documento
            try {
                router.push(`/document/${document.scrId}`);
            } catch (error) {
                console.error('Erro ao navegar para detalhes:', error);
                Alert.alert('Erro', 'Não foi possível abrir os detalhes do documento');
            }
        }
    };

    const handleDocumentPress = (document: Document) => {
        // Ação adicional ao pressionar (opcional)
        console.log('Documento pressionado:', document.documentNumber);

        // Poderá implementar analytics, logging, etc.
    };

    const handleDocumentLongPress = (document: Document) => {
        if (!isSelectionMode) {
            // Entrar no modo de seleção
            setIsSelectionMode(true);
            selectDocument(document.scrId);

            // Vibração mais forte para indicar entrada no modo de seleção
            if (Platform.OS === 'ios') {
                Vibration.vibrate([0, 50]);
            } else {
                Vibration.vibrate(50);
            }

            // Feedback visual opcional
            Alert.alert(
                'Modo de Seleção',
                'Toque nos documentos para selecioná-los ou use os botões de ação em lote.',
                [{ text: 'OK' }],
                { cancelable: true }
            );
        }
    };

    const handleSelectAll = () => {
        selectAllDocuments();

        // Vibração para feedback
        if (Platform.OS === 'ios') {
            Vibration.vibrate(10);
        }
    };

    const handleClearSelection = () => {
        setIsSelectionMode(false);
        clearSelection();
    };

    const handleApproveSelected = async () => {
        const selectedDocs = getSelectedDocuments();

        if (selectedDocs.length === 0) {
            Alert.alert('Aviso', 'Selecione ao menos um documento para aprovar');
            return;
        }

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

                            Alert.alert(
                                'Sucesso',
                                `${selectedDocs.length} documento(s) aprovado(s) com sucesso!`
                            );
                        } catch (error) {
                            Alert.alert('Erro', 'Falha ao aprovar documentos selecionados');
                        }
                    }
                }
            ]
        );
    };

    const handleRejectSelected = async () => {
        const selectedDocs = getSelectedDocuments();

        if (selectedDocs.length === 0) {
            Alert.alert('Aviso', 'Selecione ao menos um documento para reprovar');
            return;
        }

        // Solicitar motivo da reprovação
        Alert.prompt(
            'Reprovar Documentos',
            `Digite o motivo para reprovar ${selectedDocs.length} documento(s):`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Reprovar',
                    style: 'destructive',
                    onPress: async (reason) => {
                        try {
                            await rejectSelected(reason || 'Reprovado via aplicativo móvel');
                            setIsSelectionMode(false);

                            Alert.alert(
                                'Sucesso',
                                `${selectedDocs.length} documento(s) reprovado(s) com sucesso!`
                            );
                        } catch (error) {
                            Alert.alert('Erro', 'Falha ao reprovar documentos selecionados');
                        }
                    }
                }
            ],
            'plain-text',
            '',
            'default'
        );
    };

    const handleSort = () => {
        const sortOptions = getSortOptions();

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancelar', ...sortOptions.map(option => option.label)],
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
            // Para Android, você pode usar um modal customizado ou biblioteca como react-native-action-sheet
            Alert.alert(
                'Ordenar',
                'Escolha como ordenar os documentos:',
                sortOptions.map(option => ({
                    text: option.label,
                    onPress: () => setSortOption(option)
                }))
            );
        }
    };

    // Renderização dos documentos
    const renderDocument = useCallback(({ item }: { item: Document }) => (
        <DocumentCard
            document={item}
            isSelected={isDocumentSelected(item.scrId)}
            onSelect={() => handleDocumentSelect(item)}
            onPress={() => handleDocumentPress(item)}
            onLongPress={() => handleDocumentLongPress(item)}
            showSelection={isSelectionMode}
        />
    ), [isSelectionMode, isDocumentSelected]);

    const renderEmptyList = () => {
        // Se não há módulo selecionado
        if (!moduleCode) {
            return (
                <View style={styles.emptyContainer}>
                    <Ionicons
                        name="cube-outline"
                        size={64}
                        color={theme.colors.textSecondary}
                    />
                    <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                        Nenhum Módulo Selecionado
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                        Selecione um módulo primeiro para visualizar documentos de aprovação
                    </Text>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                        onPress={() => router.push('/module-selection')}
                    >
                        <Text style={styles.actionButtonText}>Selecionar Módulo</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // Se módulo não tem documentos de aprovação
        if (!hasValidModule) {
            return (
                <View style={styles.emptyContainer}>
                    <Ionicons
                        name="information-circle-outline"
                        size={64}
                        color={theme.colors.textSecondary}
                    />
                    <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                        Módulo sem Documentos de Aprovação
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                        O módulo {moduleInfo?.name} não possui documentos que necessitem de aprovação.
                        {'\n\n'}
                        Módulos com aprovações disponíveis:
                        {'\n'}• Compras (SIGACOM)
                        {'\n'}• Contratos (SIGAGCT)
                        {'\n'}• Estoque (SIGAEST)
                    </Text>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                        onPress={() => router.push('/module-selection')}
                    >
                        <Text style={styles.actionButtonText}>Trocar Módulo</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // Módulo válido mas sem documentos encontrados
        return (
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
                    {filters && Object.keys(filters).length > 0
                        ? 'Tente ajustar os filtros para encontrar documentos'
                        : 'Não há documentos para este status no momento'
                    }
                </Text>
                {filters && Object.keys(filters).length > 0 && (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                        onPress={clearFilters}
                    >
                        <Text style={styles.actionButtonText}>Limpar Filtros</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    // Se há erro, mostrar tela de erro
    if (error) {
        return (
            <SafeArea>
                <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
                        <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
                            Erro ao Carregar
                        </Text>
                        <Text style={[styles.errorMessage, { color: theme.colors.textSecondary }]}>
                            {error}
                        </Text>
                        <TouchableOpacity
                            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                            onPress={() => {
                                clearError();
                                loadDocuments(currentStatus, true);
                            }}
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
                <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.headerLeft}>
                        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                            Aprovações
                        </Text>
                        {moduleInfo && (
                            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                                {moduleInfo.name}
                            </Text>
                        )}
                    </View>

                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => setIsFilterModalVisible(true)}
                        >
                            <Ionicons
                                name="funnel-outline"
                                size={24}
                                color={Object.keys(filters).length > 0 ? theme.colors.primary : theme.colors.textSecondary}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={handleSort}
                        >
                            <Ionicons name="swap-vertical-outline" size={24} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Segment Control */}
                {hasValidModule && (
                    <View style={styles.segmentContainer}>
                        <SegmentedControl
                            values={SEGMENTS}
                            selectedIndex={selectedIndex}
                            onChange={(event) => handleSegmentChange(event.nativeEvent.selectedSegmentIndex)}
                            style={styles.segmentControl}
                            tintColor={theme.colors.primary}
                            backgroundColor={theme.colors.surface}
                        />
                    </View>
                )}

                {/* Selection Mode Header */}
                {isSelectionMode && (
                    <View style={[styles.selectionHeader, { backgroundColor: theme.colors.primary }]}>
                        <TouchableOpacity onPress={handleClearSelection} style={styles.selectionButton}>
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>

                        <Text style={styles.selectionTitle}>
                            {selectedDocuments.length} selecionado(s)
                        </Text>

                        <View style={styles.selectionActions}>
                            <TouchableOpacity onPress={handleSelectAll} style={styles.selectionButton}>
                                <Text style={styles.selectionButtonText}>Todos</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Documents List */}
                <FlatList
                    ref={flatListRef}
                    data={documents}
                    renderItem={renderDocument}
                    keyExtractor={(item) => item.scrId.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.documentsList,
                        documents.length === 0 && styles.emptyListContainer
                    ]}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={refreshDocuments}
                            colors={[theme.colors.primary]}
                            tintColor={theme.colors.primary}
                        />
                    }
                    onEndReached={() => {
                        if (hasNextPage && !isLoadingMore) {
                            loadMoreDocuments();
                        }
                    }}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={isLoadingMore ? (
                        <View style={styles.loadingMore}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                                Carregando mais documentos...
                            </Text>
                        </View>
                    ) : null}
                    ListEmptyComponent={!isLoading ? renderEmptyList : null}
                />

                {/* Selection Actions */}
                {isSelectionMode && selectedDocuments.length > 0 && (
                    <View style={[styles.selectionActions, { backgroundColor: theme.colors.surface }]}>
                        <TouchableOpacity
                            style={[styles.actionButtonSecondary, { borderColor: theme.colors.error }]}
                            onPress={handleRejectSelected}
                        >
                            <Ionicons name="close-circle-outline" size={20} color={theme.colors.error} />
                            <Text style={[styles.actionButtonSecondaryText, { color: theme.colors.error }]}>
                                Reprovar
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButtonPrimary, { backgroundColor: theme.colors.success }]}
                            onPress={handleApproveSelected}
                        >
                            <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                            <Text style={styles.actionButtonPrimaryText}>Aprovar</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Filter Modal */}
                <FilterModal
                    visible={isFilterModalVisible}
                    onClose={() => setIsFilterModalVisible(false)}
                    currentFilters={filters}
                    onApplyFilters={setFilters}
                />

                {/* Loading Overlay */}
                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                            Carregando documentos...
                        </Text>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    headerLeft: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    headerButton: {
        padding: 8,
    },
    segmentContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    segmentControl: {
        height: 36,
    },
    selectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    selectionButton: {
        padding: 4,
    },
    selectionTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    selectionButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    documentsList: {
        padding: 16,
    },
    emptyListContainer: {
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    actionButton: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    selectionActions: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
    },
    actionButtonSecondary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
        gap: 8,
    },
    actionButtonPrimary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    actionButtonSecondaryText: {
        fontSize: 16,
        fontWeight: '600',
    },
    actionButtonPrimaryText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingMore: {
        padding: 16,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 8,
        fontSize: 14,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
    },
    errorMessage: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    retryButton: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});