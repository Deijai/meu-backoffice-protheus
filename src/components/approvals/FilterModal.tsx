// src/components/approvals/FilterModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
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

    return (
        <TouchableOpacity
            style={styles.checkboxItem}
            onPress={onToggle}
            activeOpacity={0.7}
        >
            <View style={styles.checkboxContent}>
                <View style={styles.checkboxText}>
                    <Text style={[styles.checkboxTitle, { color: theme.colors.text }]}>
                        {title}
                    </Text>
                    {subtitle && (
                        <Text style={[styles.checkboxSubtitle, { color: theme.colors.textSecondary }]}>
                            {subtitle}
                        </Text>
                    )}
                </View>

                <Ionicons
                    name={isChecked ? 'checkmark-square' : 'square-outline'}
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

    const toggleBranch = (branch: string) => {
        setSelectedBranches(prev =>
            prev.includes(branch)
                ? prev.filter(b => b !== branch)
                : [...prev, branch]
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
        setSelectedBranches(
            selectedBranches.length === availableBranches.length
                ? []
                : availableBranches
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

    const validateDateFormat = (date: string): boolean => {
        if (!date) return true;
        const regex = /^\d{2}\/\d{2}\/\d{4}$/;
        return regex.test(date);
    };

    const formatDateForApi = (dateString: string): string => {
        if (!dateString) return '';
        const [day, month, year] = dateString.split('/');
        return `${year}${month}${day}`;
    };

    const handleApplyFilters = () => {
        // Validação de datas
        if (!validateDateFormat(initDate)) {
            Alert.alert('Erro', 'Data inicial deve estar no formato DD/MM/AAAA');
            return;
        }

        if (!validateDateFormat(endDate)) {
            Alert.alert('Erro', 'Data final deve estar no formato DD/MM/AAAA');
            return;
        }

        // Validação de período
        if (initDate && endDate) {
            const start = new Date(formatDateForApi(initDate));
            const end = new Date(formatDateForApi(endDate));

            if (start > end) {
                Alert.alert('Erro', 'Data inicial não pode ser maior que a data final');
                return;
            }
        }

        const filters: FilterState = {};

        if (searchText.trim()) {
            filters.searchkey = searchText.trim();
        }

        if (initDate) {
            filters.initDate = formatDateForApi(initDate);
        }

        if (endDate) {
            filters.endDate = formatDateForApi(endDate);
        }

        if (selectedBranches.length > 0) {
            filters.documentBranch = selectedBranches;
        }

        if (selectedTypes.length > 0) {
            filters.documentTypes = selectedTypes;
        }

        onApplyFilters(filters);
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
                                returnKeyType="search"
                            />
                            {searchText.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchText('')}>
                                    <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Filtro por Data */}
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
                                        keyboardType="numeric"
                                        maxLength={10}
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
                                        keyboardType="numeric"
                                        maxLength={10}
                                    />
                                </View>
                            </View>
                        </View>

                        <Text style={styles.helpText}>
                            Formato: DD/MM/AAAA (ex: 25/12/2024)
                        </Text>
                    </View>

                    {/* Filtro por Filial */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Filiais</Text>
                            <TouchableOpacity onPress={selectAllBranches}>
                                <Text style={styles.selectAllText}>
                                    {selectedBranches.length === availableBranches.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {isLoadingBranches ? (
                            <View style={styles.loadingContainer}>
                                <Text style={styles.loadingText}>Carregando filiais...</Text>
                            </View>
                        ) : (
                            <View style={styles.checkboxContainer}>
                                {availableBranches.map(branch => (
                                    <CheckboxItem
                                        key={branch}
                                        title={branch}
                                        isChecked={selectedBranches.includes(branch)}
                                        onToggle={() => toggleBranch(branch)}
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
                                    {selectedTypes.length === Object.keys(DOCUMENT_TYPES).length ? 'Desmarcar Todos' : 'Selecionar Todos'}
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
                                    <Ionicons name="document-text" size={16} color={theme.colors.primary} />
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

    checkboxItem: {
        paddingVertical: 4,
    },

    checkboxContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    checkboxText: {
        flex: 1,
        marginRight: 12,
    },

    checkboxTitle: {
        fontSize: 16,
        fontWeight: '500',
    },

    checkboxSubtitle: {
        fontSize: 12,
        marginTop: 2,
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