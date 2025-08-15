// src/components/approvals/FilterModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { approvalsService } from '../../services/api/approvalsService';
import { useThemeStore } from '../../store/themeStore';
import type { DocumentType, FilterState } from '../../types/approvals';
import { DOCUMENT_TYPES } from '../../types/approvals';

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    currentFilters: FilterState;
    onApplyFilters: (filters: FilterState) => void;
}

interface CheckboxItemProps {
    title: string;
    subtitle?: string;
    isChecked: boolean;
    onToggle: () => void;
}

const CheckboxItem: React.FC<CheckboxItemProps> = ({
    title,
    subtitle,
    isChecked,
    onToggle
}) => {
    const { theme } = useThemeStore();

    // Estilos locais para o CheckboxItem
    const checkboxStyles = StyleSheet.create({
        item: {
            paddingVertical: 4,
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
        title: {
            fontSize: 16,
            fontWeight: '500',
            color: theme.colors.text,
        },
        subtitle: {
            fontSize: 12,
            marginTop: 2,
            color: theme.colors.textSecondary,
        },
    });

    return (
        <TouchableOpacity
            style={checkboxStyles.item}
            onPress={onToggle}
            activeOpacity={0.7}
        >
            <View style={checkboxStyles.content}>
                <View style={checkboxStyles.textContainer}>
                    <Text style={checkboxStyles.title}>
                        {title}
                    </Text>
                    {subtitle && (
                        <Text style={checkboxStyles.subtitle}>
                            {subtitle}
                        </Text>
                    )}
                </View>

                <Ionicons
                    name={isChecked ? 'checkmark-square' : 'square-outline' as any}
                    size={24}
                    color={isChecked ? theme.colors.primary : theme.colors.textSecondary}
                />
            </View>
        </TouchableOpacity>
    );
};

export const FilterModal: React.FC<FilterModalProps> = ({
    visible,
    onClose,
    currentFilters,
    onApplyFilters
}) => {
    const { theme } = useThemeStore();

    // Estados locais do modal
    const [searchText, setSearchText] = useState(currentFilters.searchkey || '');
    const [initDate, setInitDate] = useState(currentFilters.initDate || '');
    const [endDate, setEndDate] = useState(currentFilters.endDate || '');
    const [selectedBranches, setSelectedBranches] = useState<string[]>(
        currentFilters.documentBranch || []
    );
    const [selectedTypes, setSelectedTypes] = useState<DocumentType[]>(
        currentFilters.documentTypes || []
    );

    // Estados de dados
    const [availableBranches, setAvailableBranches] = useState<Array<{ code: string; name: string; }>>([]);
    const [isLoadingBranches, setIsLoadingBranches] = useState(false);

    // Carrega filiais disponíveis quando o modal abre
    useEffect(() => {
        if (visible) {
            loadAvailableBranches();
            resetFilters();
        }
    }, [visible]);

    const resetFilters = () => {
        setSearchText(currentFilters.searchkey || '');
        setInitDate(currentFilters.initDate || '');
        setEndDate(currentFilters.endDate || '');
        setSelectedBranches(currentFilters.documentBranch || []);
        setSelectedTypes(currentFilters.documentTypes || []);
    };

    const loadAvailableBranches = async () => {
        setIsLoadingBranches(true);
        try {
            const branches = await approvalsService.getAvailableBranchesWithNames();
            setAvailableBranches(branches);
        } catch (error) {
            console.error('Erro ao carregar filiais:', error);
        }
        setIsLoadingBranches(false);
    };

    const toggleBranch = (branchCode: string) => {
        setSelectedBranches(prev =>
            prev.includes(branchCode)
                ? prev.filter(b => b !== branchCode)
                : [...prev, branchCode]
        );
    };

    const toggleDocumentType = (type: DocumentType) => {
        setSelectedTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const selectAllBranches = () => {
        const allBranchCodes = availableBranches.map(b => b.code);
        setSelectedBranches(
            selectedBranches.length === allBranchCodes.length
                ? []
                : allBranchCodes
        );
    };

    const selectAllTypes = () => {
        const allTypes = Object.keys(DOCUMENT_TYPES) as DocumentType[];
        setSelectedTypes(
            selectedTypes.length === allTypes.length
                ? []
                : allTypes
        );
    };

    const handleApplyFilters = () => {
        const newFilters: FilterState = {
            searchkey: searchText.trim() || undefined,
            initDate: initDate || undefined,
            endDate: endDate || undefined,
            documentBranch: selectedBranches.length > 0 ? selectedBranches : undefined,
            documentTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
        };

        onApplyFilters(newFilters);
        onClose();
    };

    const handleClearFilters = () => {
        setSearchText('');
        setInitDate('');
        setEndDate('');
        setSelectedBranches([]);
        setSelectedTypes([]);
        onApplyFilters({});
        onClose();
    };

    const hasActiveFilters = () => {
        return searchText.trim() ||
            initDate ||
            endDate ||
            selectedBranches.length > 0 ||
            selectedTypes.length > 0;
    };

    const styles = createStyles(theme);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={theme.colors.text} />
                    </TouchableOpacity>

                    <Text style={styles.title}>Filtros</Text>

                    {hasActiveFilters() && (
                        <TouchableOpacity onPress={handleClearFilters} style={styles.clearButton}>
                            <Text style={styles.clearText}>Limpar</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Conteúdo */}
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Busca por texto */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Busca</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons
                                name="search"
                                size={20}
                                color={theme.colors.textSecondary}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.textInput}
                                placeholder="Digite para buscar..."
                                placeholderTextColor={theme.colors.textSecondary}
                                value={searchText}
                                onChangeText={setSearchText}
                            />
                        </View>
                        <Text style={styles.helpText}>
                            Busca por número do documento, descrição ou observações
                        </Text>
                    </View>

                    {/* Filtro por data */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Período</Text>
                        <View style={styles.dateRow}>
                            <View style={styles.dateInput}>
                                <Text style={styles.dateLabel}>Data Inicial</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons
                                        name="calendar"
                                        size={20}
                                        color={theme.colors.textSecondary}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="DD/MM/AAAA"
                                        placeholderTextColor={theme.colors.textSecondary}
                                        value={initDate}
                                        onChangeText={setInitDate}
                                    />
                                </View>
                            </View>

                            <View style={styles.dateInput}>
                                <Text style={styles.dateLabel}>Data Final</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons
                                        name="calendar"
                                        size={20}
                                        color={theme.colors.textSecondary}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="DD/MM/AAAA"
                                        placeholderTextColor={theme.colors.textSecondary}
                                        value={endDate}
                                        onChangeText={setEndDate}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Filtro por filial */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Filiais</Text>
                            <TouchableOpacity onPress={selectAllBranches}>
                                <Text style={styles.selectAllText}>
                                    {selectedBranches.length === availableBranches.length ?
                                        'Desmarcar Todas' : 'Selecionar Todas'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {isLoadingBranches ? (
                            <View style={styles.loadingContainer}>
                                <Text style={styles.loadingText}>Carregando filiais...</Text>
                            </View>
                        ) : (
                            <View style={styles.checkboxContainer}>
                                {availableBranches.map((branch, index) => (
                                    <CheckboxItem
                                        key={branch.code + index}
                                        title={branch.name}
                                        subtitle={branch.code}
                                        isChecked={selectedBranches.includes(branch.code)}
                                        onToggle={() => toggleBranch(branch.code)}
                                    />
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Filtro por Tipo de Documento */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Tipos de Documento</Text>
                            <TouchableOpacity onPress={selectAllTypes}>
                                <Text style={styles.selectAllText}>
                                    {selectedTypes.length === Object.keys(DOCUMENT_TYPES).length ?
                                        'Desmarcar Todos' : 'Selecionar Todos'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.checkboxContainer}>
                            {(Object.entries(DOCUMENT_TYPES) as [DocumentType, string][]).map(([type, name]) => (
                                <CheckboxItem
                                    key={type}
                                    title={name}
                                    subtitle={type}
                                    isChecked={selectedTypes.includes(type)}
                                    onToggle={() => toggleDocumentType(type)}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Resumo dos filtros aplicados */}
                    {hasActiveFilters() && (
                        <View style={styles.summarySection}>
                            <Text style={styles.summaryTitle}>Filtros Ativos</Text>

                            {searchText && (
                                <View style={styles.summaryItem}>
                                    <Ionicons name="search" size={16} color={theme.colors.primary} />
                                    <Text style={styles.summaryText}>Busca: "{searchText}"</Text>
                                </View>
                            )}

                            {(initDate || endDate) && (
                                <View style={styles.summaryItem}>
                                    <Ionicons name="calendar" size={16} color={theme.colors.primary} />
                                    <Text style={styles.summaryText}>
                                        Período: {initDate || '...'} até {endDate || '...'}
                                    </Text>
                                </View>
                            )}

                            {selectedBranches.length > 0 && (
                                <View style={styles.summaryItem}>
                                    <Ionicons name="business" size={16} color={theme.colors.primary} />
                                    <Text style={styles.summaryText}>
                                        {selectedBranches.length} filial(is) selecionada(s)
                                    </Text>
                                </View>
                            )}

                            {selectedTypes.length > 0 && (
                                <View style={styles.summaryItem}>
                                    <Ionicons name="document" size={16} color={theme.colors.primary} />
                                    <Text style={styles.summaryText}>
                                        {selectedTypes.length} tipo(s) de documento
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>

                {/* Footer com ações */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={onClose}
                    >
                        <Text style={[styles.buttonText, { color: theme.colors.text }]}>
                            Cancelar
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.applyButton, { backgroundColor: theme.colors.primary }]}
                        onPress={handleApplyFilters}
                    >
                        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                            Aplicar Filtros
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: {
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

    title: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
    },

    clearButton: {
        padding: 8,
    },

    clearText: {
        fontSize: 16,
        color: theme.colors.error,
        fontWeight: '500',
    },

    content: {
        flex: 1,
    },

    section: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 16,
    },

    selectAllText: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: '500',
    },

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },

    inputIcon: {
        marginRight: 12,
    },

    textInput: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text,
    },

    dateRow: {
        flexDirection: 'row',
        gap: 12,
    },

    dateInput: {
        flex: 1,
    },

    dateLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.text,
        marginBottom: 8,
    },

    helpText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 8,
        fontStyle: 'italic',
    },

    loadingContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },

    loadingText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },

    checkboxContainer: {
        gap: 8,
    },

    summarySection: {
        margin: 20,
        padding: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },

    summaryTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 12,
    },

    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },

    summaryText: {
        fontSize: 14,
        color: theme.colors.text,
        marginLeft: 8,
        flex: 1,
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