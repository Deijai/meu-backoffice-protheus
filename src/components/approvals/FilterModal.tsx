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
                    name={isChecked ? 'checkmark-circle' : 'ellipse-outline'}
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
    const [selectedTypes, setSelectedTypes] = useState<DocumentType[]>(
        currentFilters.documentTypes || []
    );





    // Informações do módulo atual
    const moduleCode = selectedModule?.code;
    const moduleInfo = moduleCode ? getModuleInfo(moduleCode) : null;
    const hasDocuments = moduleCode ? hasDocumentsForApproval(moduleCode) : false;
    const availableDocumentTypes = moduleCode ? getDocumentTypesForModule(moduleCode) : [];

    // Carrega dados quando o modal abre
    useEffect(() => {
        if (visible) {
            resetFilters();
        }
    }, [visible]);

    // Filtra tipos de documentos para manter apenas os válidos para o módulo atual
    useEffect(() => {
        if (availableDocumentTypes.length > 0) {
            setSelectedTypes(prev =>
                prev.filter(type => availableDocumentTypes.includes(type))
            );
        }
    }, [availableDocumentTypes]);

    const resetFilters = () => {
        setSearchText(currentFilters.searchkey || '');
        setInitDate(currentFilters.initDate || '');
        setEndDate(currentFilters.endDate || '');

        // Filtra tipos para manter apenas os válidos para o módulo atual
        const validTypes = (currentFilters.documentTypes || [])
            .filter(type => availableDocumentTypes.includes(type));
        setSelectedTypes(validTypes);
    };



    const toggleDocumentType = (type: DocumentType) => {
        // Só permite toggle se o tipo for válido para o módulo atual
        if (!availableDocumentTypes.includes(type)) {
            return;
        }

        setSelectedTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const selectAllTypes = () => {
        setSelectedTypes(
            selectedTypes.length === availableDocumentTypes.length
                ? []
                : [...availableDocumentTypes]
        );
    };

    const handleApplyFilters = () => {
        const newFilters: FilterState = {
            searchkey: searchText.trim() || undefined,
            initDate: initDate || undefined,
            endDate: endDate || undefined,
            documentTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
        };

        onApplyFilters(newFilters);
        onClose();
    };

    const handleClearFilters = () => {
        setSearchText('');
        setInitDate('');
        setEndDate('');
        setSelectedTypes([]);
        onApplyFilters({});
        onClose();
    };

    const hasActiveFilters = () => {
        return searchText.trim() ||
            initDate ||
            endDate ||
            selectedTypes.length > 0;
    };



    const renderNoDocumentsMessage = () => (
        <View style={styles.noDocumentsContainer}>
            <Ionicons
                name="information-circle-outline"
                size={64}
                color={theme.colors.textSecondary}
            />
            <Text style={[styles.noDocumentsTitle, { color: theme.colors.text }]}>
                Módulo sem Documentos de Aprovação
            </Text>
            <Text style={[styles.noDocumentsText, { color: theme.colors.textSecondary }]}>
                O módulo {moduleInfo?.name} não possui documentos que necessitem de aprovação.
                {'\n\n'}
                Para filtrar documentos de aprovação, selecione um dos seguintes módulos:
                {'\n'}• Compras (SIGACOM)
                {'\n'}• Contratos (SIGAGCT)
                {'\n'}• Estoque (SIGAEST)
            </Text>
        </View>
    );

    const renderNoModuleMessage = () => (
        <View style={styles.noDocumentsContainer}>
            <Ionicons
                name="warning-outline"
                size={64}
                color={theme.colors.textSecondary}
            />
            <Text style={[styles.noDocumentsTitle, { color: theme.colors.text }]}>
                Nenhum Módulo Selecionado
            </Text>
            <Text style={[styles.noDocumentsText, { color: theme.colors.textSecondary }]}>
                Selecione um módulo primeiro para aplicar filtros.
            </Text>
        </View>
    );

    const styles = createStyles(theme, moduleInfo?.color);

    return (
        <>
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

                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>Filtros</Text>
                            {moduleInfo && (
                                <Text style={styles.moduleSubtitle}>{moduleInfo.name}</Text>
                            )}
                        </View>

                        {hasActiveFilters() && hasDocuments && (
                            <TouchableOpacity onPress={handleClearFilters} style={styles.clearButton}>
                                <Text style={styles.clearText}>Limpar</Text>
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
                                <View style={styles.moduleSection}>
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



                                {/* Filtro por Tipo de Documento do módulo atual */}
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>
                                            Tipos de Documento - {moduleInfo!.name}
                                        </Text>
                                        <TouchableOpacity onPress={selectAllTypes}>
                                            <Text style={styles.selectAllText}>
                                                {selectedTypes.length === availableDocumentTypes.length ?
                                                    'Desmarcar Todos' : 'Selecionar Todos'}
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
                            </>
                        )}
                    </ScrollView>

                    {/* Footer com ações */}
                    {hasDocuments ? (
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
                    ) : (
                        <View style={styles.simpleFooter}>
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                                onPress={onClose}
                            >
                                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                                    Fechar
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </Modal>
        </>
    );
};

const createStyles = (theme: any, moduleColor?: string) => StyleSheet.create({
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

    titleContainer: {
        flex: 1,
        alignItems: 'center',
    },

    title: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
    },

    moduleSubtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 2,
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

    moduleSection: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: moduleColor ? `${moduleColor}10` : theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
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



    checkboxContainer: {
        gap: 8,
    },

    emptyTypesContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },

    emptyTypesText: {
        fontSize: 14,
        textAlign: 'center',
    },

    noDocumentsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 80,
    },

    noDocumentsTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 16,
        textAlign: 'center',
    },

    noDocumentsText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
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

    simpleFooter: {
        padding: 20,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
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