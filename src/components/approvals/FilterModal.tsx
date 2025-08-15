// src/components/approvals/FilterModal.tsx - CORRIGIDO
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
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import type { DocumentType, FilterState } from '../../types/approvals';
import {
    DOCUMENT_TYPES,
    getDocumentTypesForModule,
    getModuleInfo,
    hasDocumentsForApproval
} from '../../types/approvals';

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
                <View style={styles.checkboxTextContainer}>
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
    const { selectedModule } = useAuthStore();

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

    // Informações do módulo atual
    const moduleCode = selectedModule?.code;
    const moduleInfo = moduleCode ? getModuleInfo(moduleCode) : null;
    const hasDocuments = moduleCode ? hasDocumentsForApproval(moduleCode) : false;
    const availableDocumentTypes = moduleCode ? getDocumentTypesForModule(moduleCode) : [];

    // Sincronizar estado local com filtros externos
    useEffect(() => {
        setSearchText(currentFilters.searchkey || '');
        setInitDate(currentFilters.initDate || '');
        setEndDate(currentFilters.endDate || '');
        setSelectedBranches(currentFilters.documentBranch || []);
        setSelectedTypes(currentFilters.documentTypes || []);
    }, [currentFilters]);

    // Handlers
    const toggleDocumentType = (type: DocumentType) => {
        setSelectedTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const toggleBranch = (branch: string) => {
        setSelectedBranches(prev =>
            prev.includes(branch)
                ? prev.filter(b => b !== branch)
                : [...prev, branch]
        );
    };

    const handleSelectAllTypes = () => {
        if (selectedTypes.length === availableDocumentTypes.length) {
            setSelectedTypes([]);
        } else {
            setSelectedTypes([...availableDocumentTypes]);
        }
    };

    const handleClearFilters = () => {
        setSearchText('');
        setInitDate('');
        setEndDate('');
        setSelectedBranches([]);
        setSelectedTypes([]);
    };

    const handleApplyFilters = () => {
        const filters: FilterState = {};

        if (searchText.trim()) {
            filters.searchkey = searchText.trim();
        }
        if (initDate) {
            filters.initDate = initDate;
        }
        if (endDate) {
            filters.endDate = endDate;
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

    const hasActiveFilters = () => {
        return searchText.trim() !== '' ||
            initDate !== '' ||
            endDate !== '' ||
            selectedBranches.length > 0 ||
            selectedTypes.length > 0;
    };

    const renderNoModuleMessage = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                Nenhum Módulo Selecionado
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Selecione um módulo primeiro para filtrar documentos de aprovação.
            </Text>
        </View>
    );

    const renderNoDocumentsMessage = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="information-circle-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                Módulo sem Documentos
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                O módulo {moduleInfo?.name} não possui documentos que necessitem de aprovação.
            </Text>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={theme.colors.text} />
                    </TouchableOpacity>

                    <View style={styles.titleContainer}>
                        <Text style={[styles.title, { color: theme.colors.text }]}>Filtros</Text>
                        {moduleInfo && (
                            <Text style={[styles.moduleSubtitle, { color: theme.colors.textSecondary }]}>
                                {moduleInfo.name}
                            </Text>
                        )}
                    </View>

                    {hasActiveFilters() && hasDocuments && (
                        <TouchableOpacity onPress={handleClearFilters} style={styles.clearButton}>
                            <Text style={[styles.clearText, { color: theme.colors.primary }]}>
                                Limpar
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Conteúdo */}
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {!moduleCode ? (
                        renderNoModuleMessage()
                    ) : !hasDocuments ? (
                        renderNoDocumentsMessage()
                    ) : (
                        <>
                            {/* Info do módulo atual */}
                            <View style={[styles.moduleSection, { backgroundColor: theme.colors.surface }]}>
                                <View style={styles.moduleHeader}>
                                    <Ionicons
                                        name={moduleInfo!.icon as any}
                                        size={20}
                                        color={moduleInfo!.color}
                                    />
                                    <Text style={[styles.moduleHeaderText, { color: theme.colors.text }]}>
                                        Filtrando documentos do módulo {moduleInfo!.name}
                                    </Text>
                                </View>
                            </View>

                            {/* Busca por texto */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                    Busca
                                </Text>
                                <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
                                    <Ionicons
                                        name="search"
                                        size={20}
                                        color={theme.colors.textSecondary}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={[styles.textInput, { color: theme.colors.text }]}
                                        placeholder="Digite para buscar..."
                                        placeholderTextColor={theme.colors.textSecondary}
                                        value={searchText}
                                        onChangeText={setSearchText}
                                    />
                                </View>
                            </View>

                            {/* Período */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                    Período
                                </Text>
                                <View style={styles.dateContainer}>
                                    <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, flex: 1 }]}>
                                        <Ionicons
                                            name="calendar"
                                            size={20}
                                            color={theme.colors.textSecondary}
                                            style={styles.inputIcon}
                                        />
                                        <TextInput
                                            style={[styles.textInput, { color: theme.colors.text }]}
                                            placeholder="Data inicial"
                                            placeholderTextColor={theme.colors.textSecondary}
                                            value={initDate}
                                            onChangeText={setInitDate}
                                        />
                                    </View>

                                    <Text style={[styles.dateSeparator, { color: theme.colors.textSecondary }]}>
                                        até
                                    </Text>

                                    <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, flex: 1 }]}>
                                        <Ionicons
                                            name="calendar"
                                            size={20}
                                            color={theme.colors.textSecondary}
                                            style={styles.inputIcon}
                                        />
                                        <TextInput
                                            style={[styles.textInput, { color: theme.colors.text }]}
                                            placeholder="Data final"
                                            placeholderTextColor={theme.colors.textSecondary}
                                            value={endDate}
                                            onChangeText={setEndDate}
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Tipos de Documento */}
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                        Tipos de Documento
                                    </Text>
                                    <TouchableOpacity onPress={handleSelectAllTypes}>
                                        <Text style={[styles.selectAllText, { color: theme.colors.primary }]}>
                                            {selectedTypes.length === availableDocumentTypes.length
                                                ? 'Desmarcar Todos'
                                                : 'Selecionar Todos'
                                            }
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.checkboxContainer}>
                                    {availableDocumentTypes.map(type => (
                                        <CheckboxItem
                                            key={type}
                                            title={DOCUMENT_TYPES[type]}
                                            subtitle={type}
                                            isChecked={selectedTypes.includes(type)}
                                            onToggle={() => toggleDocumentType(type)}
                                        />
                                    ))}
                                </View>

                                {availableDocumentTypes.length === 0 && (
                                    <View style={styles.emptyTypesContainer}>
                                        <Text style={[styles.emptyTypesText, { color: theme.colors.textSecondary }]}>
                                            Nenhum tipo de documento disponível para este módulo.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </>
                    )}
                </ScrollView>

                {/* Footer com botões */}
                {hasDocuments && (
                    <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
                        <TouchableOpacity
                            style={[styles.footerButton, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
                                Cancelar
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.footerButton, styles.applyButton, { backgroundColor: theme.colors.primary }]}
                            onPress={handleApplyFilters}
                        >
                            <Text style={styles.applyButtonText}>
                                Aplicar Filtros
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    closeButton: {
        padding: 8,
        marginRight: 8,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    moduleSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    clearButton: {
        padding: 8,
    },
    clearText: {
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    moduleSection: {
        margin: 16,
        padding: 16,
        borderRadius: 8,
    },
    moduleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    moduleHeaderText: {
        fontSize: 14,
        fontWeight: '500',
    },
    section: {
        marginHorizontal: 16,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    selectAllText: {
        fontSize: 14,
        fontWeight: '600',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    inputIcon: {
        marginRight: 8,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dateSeparator: {
        fontSize: 14,
        fontWeight: '500',
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
    checkboxTextContainer: {
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    emptyTypesContainer: {
        padding: 16,
        alignItems: 'center',
    },
    emptyTypesText: {
        fontSize: 14,
        textAlign: 'center',
    },
    footer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
    },
    footerButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.2)',
    },
    applyButton: {
        // backgroundColor é definido inline
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    applyButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});