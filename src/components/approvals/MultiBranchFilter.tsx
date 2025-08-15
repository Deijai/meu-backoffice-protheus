// src/components/approvals/MultiBranchFilter.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { approvalsService } from '../../services/api/approvalsService';
import { useThemeStore } from '../../store/themeStore';

interface Branch {
    code: string;
    name: string;
}

interface MultiBranchFilterProps {
    selectedBranches: string[];
    onBranchesChange: (branches: string[]) => void;
    disabled?: boolean;
}

interface BranchItemProps {
    branch: Branch;
    isSelected: boolean;
    onToggle: (branchCode: string) => void;
}

const BranchItem: React.FC<BranchItemProps> = ({ branch, isSelected, onToggle }) => {
    const { theme } = useThemeStore();

    const itemStyles = StyleSheet.create({
        container: {
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.colors.border,
        },
        content: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        textContainer: {
            flex: 1,
            marginRight: 12,
        },
        name: {
            fontSize: 16,
            fontWeight: '500',
            color: theme.colors.text,
        },
        code: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            marginTop: 2,
        },
        checkbox: {
            padding: 4,
        },
    });

    return (
        <TouchableOpacity
            style={itemStyles.container}
            onPress={() => onToggle(branch.code)}
            activeOpacity={0.7}
        >
            <View style={itemStyles.content}>
                <View style={itemStyles.textContainer}>
                    <Text style={itemStyles.name}>{branch.name}</Text>
                    <Text style={itemStyles.code}>Código: {branch.code}</Text>
                </View>

                <TouchableOpacity
                    style={itemStyles.checkbox}
                    onPress={() => onToggle(branch.code)}
                >
                    <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={24}
                        color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                    />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

export const MultiBranchFilter: React.FC<MultiBranchFilterProps> = ({
    selectedBranches,
    onBranchesChange,
    disabled = false
}) => {
    const { theme } = useThemeStore();

    // Estados do modal
    const [modalVisible, setModalVisible] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
    const [searchText, setSearchText] = useState('');
    const [localSelectedBranches, setLocalSelectedBranches] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Carrega filiais quando o modal abre
    useEffect(() => {
        if (modalVisible) {
            loadBranches();
            setLocalSelectedBranches([...selectedBranches]);
            setSearchText('');
        }
    }, [modalVisible, selectedBranches]);

    // Filtra filiais conforme busca
    useEffect(() => {
        if (!searchText.trim()) {
            setFilteredBranches(branches);
        } else {
            const filtered = branches.filter(branch =>
                branch.name.toLowerCase().includes(searchText.toLowerCase()) ||
                branch.code.toLowerCase().includes(searchText.toLowerCase())
            );
            setFilteredBranches(filtered);
        }
    }, [searchText, branches]);

    const loadBranches = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const branchesData = await approvalsService.getAvailableBranchesWithNames();
            setBranches(branchesData);
            setFilteredBranches(branchesData);
        } catch (err) {
            console.error('Erro ao carregar filiais:', err);
            setError('Erro ao carregar filiais. Tente novamente.');
        }
        setIsLoading(false);
    };

    const toggleBranch = (branchCode: string) => {
        setLocalSelectedBranches(prev =>
            prev.includes(branchCode)
                ? prev.filter(code => code !== branchCode)
                : [...prev, branchCode]
        );
    };

    const selectAll = () => {
        const allBranchCodes = filteredBranches.map(branch => branch.code);
        const areAllSelected = allBranchCodes.every(code =>
            localSelectedBranches.includes(code)
        );

        if (areAllSelected) {
            setLocalSelectedBranches(prev =>
                prev.filter(code => !allBranchCodes.includes(code))
            );
        } else {
            const newSelection = [...localSelectedBranches];
            allBranchCodes.forEach(code => {
                if (!newSelection.includes(code)) {
                    newSelection.push(code);
                }
            });
            setLocalSelectedBranches(newSelection);
        }
    };

    const clearSelection = () => {
        setLocalSelectedBranches([]);
    };

    const handleApply = () => {
        onBranchesChange(localSelectedBranches);
        setModalVisible(false);
    };

    const handleCancel = () => {
        setLocalSelectedBranches([...selectedBranches]);
        setModalVisible(false);
    };

    const getDisplayText = () => {
        return selectedBranches.length.toString();
    };

    const getSelectedCount = () => localSelectedBranches.length;
    const getTotalCount = () => branches.length;
    const getFilteredSelectedCount = () => {
        return filteredBranches.filter(branch =>
            localSelectedBranches.includes(branch.code)
        ).length;
    };

    const areAllFilteredSelected = () => {
        if (filteredBranches.length === 0) return false;
        return filteredBranches.every(branch =>
            localSelectedBranches.includes(branch.code)
        );
    };

    const renderBranchItem = ({ item }: { item: Branch }) => (
        <BranchItem
            branch={item}
            isSelected={localSelectedBranches.includes(item.code)}
            onToggle={toggleBranch}
        />
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons
                name="search-outline"
                size={48}
                color={theme.colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                Nenhuma filial encontrada
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Tente ajustar sua busca
            </Text>
        </View>
    );

    const renderErrorState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons
                name="alert-circle-outline"
                size={48}
                color={theme.colors.error}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                Erro ao carregar filiais
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {error}
            </Text>
            <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                onPress={loadBranches}
            >
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
        </View>
    );

    const renderLoadingState = () => (
        <View style={styles.emptyContainer}>
            <ActivityIndicator
                size="large"
                color={theme.colors.primary}
            />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary, marginTop: 16 }]}>
                Carregando filiais...
            </Text>
        </View>
    );

    const styles = createStyles(theme);

    return (
        <>
            {/* Botão principal de filtro */}
            <TouchableOpacity
                style={[
                    styles.filterButton,
                    disabled && styles.filterButtonDisabled,
                    selectedBranches.length > 0 && styles.filterButtonActive
                ]}
                onPress={() => !disabled && setModalVisible(true)}
                activeOpacity={disabled ? 1 : 0.7}
            >
                <Ionicons
                    name="business-outline"
                    size={20}
                    color={disabled ? theme.colors.textSecondary :
                        selectedBranches.length > 0 ? '#FFFFFF' : theme.colors.text}
                />
                {selectedBranches.length > 0 && (
                    <View style={styles.filterBadge}>
                        <Text style={styles.filterBadgeText}>
                            {getDisplayText()}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Modal de seleção */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={handleCancel}
            >
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={theme.colors.text} />
                        </TouchableOpacity>

                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>Filtrar por Filiais</Text>
                            <Text style={styles.subtitle}>
                                {getSelectedCount()} de {getTotalCount()} selecionadas
                            </Text>
                        </View>

                        <View style={styles.headerActions}>
                            {getSelectedCount() > 0 && (
                                <TouchableOpacity onPress={clearSelection} style={styles.clearButton}>
                                    <Text style={styles.clearText}>Limpar</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Busca */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputContainer}>
                            <Ionicons
                                name="search"
                                size={20}
                                color={theme.colors.textSecondary}
                                style={styles.searchIcon}
                            />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar por nome ou código da filial..."
                                placeholderTextColor={theme.colors.textSecondary}
                                value={searchText}
                                onChangeText={setSearchText}
                                autoCorrect={false}
                            />
                            {searchText.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => setSearchText('')}
                                    style={styles.clearSearchButton}
                                >
                                    <Ionicons
                                        name="close-circle"
                                        size={20}
                                        color={theme.colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Ações rápidas */}
                        {!isLoading && !error && filteredBranches.length > 0 && (
                            <View style={styles.quickActions}>
                                <TouchableOpacity onPress={selectAll} style={styles.quickActionButton}>
                                    <Ionicons
                                        name={areAllFilteredSelected() ? "remove-circle-outline" : "checkmark-circle-outline"}
                                        size={16}
                                        color={theme.colors.primary}
                                    />
                                    <Text style={styles.quickActionText}>
                                        {areAllFilteredSelected() ? 'Desmarcar todas' : 'Selecionar todas'}
                                        {searchText ? ' (filtradas)' : ''}
                                    </Text>
                                </TouchableOpacity>

                                {searchText && getFilteredSelectedCount() > 0 && (
                                    <Text style={styles.filteredInfo}>
                                        {getFilteredSelectedCount()} de {filteredBranches.length} selecionadas
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Lista de filiais */}
                    <View style={styles.listContainer}>
                        {isLoading ? (
                            renderLoadingState()
                        ) : error ? (
                            renderErrorState()
                        ) : filteredBranches.length === 0 ? (
                            renderEmptyState()
                        ) : (
                            <FlatList
                                data={filteredBranches}
                                renderItem={renderBranchItem}
                                keyExtractor={(item) => item.code}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.listContent}
                            />
                        )}
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={handleCancel}
                        >
                            <Text style={[styles.buttonText, { color: theme.colors.text }]}>
                                Cancelar
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.applyButton, { backgroundColor: theme.colors.primary }]}
                            onPress={handleApply}
                        >
                            <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                                Aplicar ({getSelectedCount()})
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    // Botão principal
    filterButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: theme.colors.surface,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 40,
        minHeight: 40,
    },

    filterButtonDisabled: {
        opacity: 0.5,
    },

    filterButtonActive: {
        backgroundColor: theme.colors.primary,
    },



    filterBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: theme.colors.error,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },

    filterBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
    },

    // Modal
    modalContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },

    closeButton: {
        padding: 8,
    },

    titleContainer: {
        flex: 1,
        alignItems: 'center',
    },

    title: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
    },

    subtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },

    headerActions: {
        minWidth: 60,
        alignItems: 'flex-end',
    },

    clearButton: {
        padding: 8,
    },

    clearText: {
        fontSize: 14,
        color: theme.colors.error,
        fontWeight: '500',
    },

    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },

    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },

    searchIcon: {
        marginRight: 12,
    },

    searchInput: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text,
    },

    clearSearchButton: {
        padding: 4,
        marginLeft: 8,
    },

    quickActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
    },

    quickActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    quickActionText: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: '500',
    },

    filteredInfo: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },

    listContainer: {
        flex: 1,
    },

    listContent: {
        paddingBottom: 20,
    },

    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },

    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },

    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },

    retryButton: {
        marginTop: 16,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },

    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },

    footer: {
        flexDirection: 'row',
        padding: 20,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        gap: 12,
    },

    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },

    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },

    applyButton: {
        // backgroundColor definido dinamicamente
    },

    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});