// src/components/dashboard/ConfigModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useDashboardConfigStore } from '../../store/dashboardConfigStore';
import { useThemeStore } from '../../store/themeStore';
import type { DocumentType } from '../../types/approvals';
import {
    DOCUMENT_TYPES,
    getDocumentTypeIcon,
    getModuleInfo,
    hasDocumentsForApproval
} from '../../types/approvals';

interface ConfigModalProps {
    visible: boolean;
    onClose: () => void;
}

interface CardOptionProps {
    documentType: DocumentType;
    isEnabled: boolean;
    onToggle: () => void;
}

const CardOption: React.FC<CardOptionProps> = ({
    documentType,
    isEnabled,
    onToggle
}) => {
    const { theme } = useThemeStore();
    const icon = getDocumentTypeIcon(documentType);

    const cardOptionStyles = StyleSheet.create({
        container: {
            borderRadius: 12,
            borderWidth: 2,
            overflow: 'hidden',
            backgroundColor: theme.colors.surface,
            borderColor: isEnabled ? theme.colors.primary : theme.colors.border,
        },
        content: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
        },
        left: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        textContainer: {
            marginLeft: 16,
            flex: 1,
        },
        title: {
            fontSize: 16,
            fontWeight: '600',
            marginBottom: 2,
            color: isEnabled ? theme.colors.text : theme.colors.textSecondary,
        },
        subtitle: {
            fontSize: 12,
            fontWeight: '500',
            color: theme.colors.textSecondary,
        },
    });

    return (
        <TouchableOpacity
            style={cardOptionStyles.container}
            onPress={onToggle}
            activeOpacity={0.7}
        >
            <View style={cardOptionStyles.content}>
                <View style={cardOptionStyles.left}>
                    <Ionicons
                        name={icon as any}
                        size={24}
                        color={isEnabled ? theme.colors.primary : theme.colors.textSecondary}
                    />
                    <View style={cardOptionStyles.textContainer}>
                        <Text style={cardOptionStyles.title}>
                            {DOCUMENT_TYPES[documentType]}
                        </Text>
                        <Text style={cardOptionStyles.subtitle}>
                            {documentType}
                        </Text>
                    </View>
                </View>

                <Ionicons
                    name={isEnabled ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={isEnabled ? theme.colors.primary : theme.colors.textSecondary}
                />
            </View>
        </TouchableOpacity>
    );
};

export const ConfigModal: React.FC<ConfigModalProps> = ({
    visible,
    onClose
}) => {
    const { theme } = useThemeStore();
    const { selectedModule } = useAuthStore();
    const {
        enabledCards,
        toggleCard,
        resetToDefault,
        isCardEnabled,
        getAvailableCards,
        getCurrentModuleCode
    } = useDashboardConfigStore();

    const [localEnabledCards, setLocalEnabledCards] = useState<DocumentType[]>(enabledCards);

    useEffect(() => {
        setLocalEnabledCards(enabledCards);
    }, [enabledCards]);

    const moduleCode = getCurrentModuleCode();
    const moduleInfo = moduleCode ? getModuleInfo(moduleCode) : null;
    const availableCards = getAvailableCards();
    const hasDocuments = moduleCode ? hasDocumentsForApproval(moduleCode) : false;

    const handleToggleCard = (cardType: DocumentType) => {
        const newCards = localEnabledCards.includes(cardType)
            ? localEnabledCards.filter(type => type !== cardType)
            : [...localEnabledCards, cardType];

        setLocalEnabledCards(newCards);
    };

    const handleSave = async () => {
        // Aplica as mudanças
        for (const cardType of availableCards) {
            const shouldBeEnabled = localEnabledCards.includes(cardType);
            const isCurrentlyEnabled = isCardEnabled(cardType);

            if (shouldBeEnabled !== isCurrentlyEnabled) {
                await toggleCard(cardType);
            }
        }

        onClose();
    };

    const handleReset = async () => {
        await resetToDefault();
        setLocalEnabledCards(availableCards);
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
                Para acessar documentos de aprovação, selecione um dos seguintes módulos:
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
                Selecione um módulo primeiro para configurar o dashboard.
            </Text>
        </View>
    );

    const styles = createStyles(theme, moduleInfo?.color);

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

                    <Text style={styles.title}>Configurar Cards</Text>

                    {hasDocuments && (
                        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
                            <Text style={styles.resetText}>Padrão</Text>
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
                            <View style={styles.section}>
                                <View style={styles.moduleHeader}>
                                    <Ionicons
                                        name={moduleInfo!.icon as any}
                                        size={24}
                                        color={moduleInfo!.color}
                                    />
                                    <View style={styles.moduleHeaderText}>
                                        <Text style={styles.sectionTitle}>
                                            {moduleInfo!.name}
                                        </Text>
                                        <Text style={styles.moduleCode}>
                                            {moduleCode}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.sectionSubtitle}>
                                    Selecione os cards que deseja exibir na tela inicial para o módulo {moduleInfo!.name}.
                                    Você pode personalizar quais tipos de documento aparecerão no seu dashboard.
                                </Text>
                            </View>

                            {/* Cards do módulo */}
                            <View style={styles.cardsContainer}>
                                {availableCards.map(cardType => (
                                    <CardOption
                                        key={cardType}
                                        documentType={cardType}
                                        isEnabled={localEnabledCards.includes(cardType)}
                                        onToggle={() => handleToggleCard(cardType)}
                                    />
                                ))}
                            </View>

                            {/* Informações adicionais */}
                            <View style={styles.infoSection}>
                                <View style={styles.infoItem}>
                                    <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
                                    <Text style={styles.infoText}>
                                        Cards desabilitados não aparecerão na tela inicial, mas você ainda poderá
                                        acessar esses documentos pela página de aprovações.
                                    </Text>
                                </View>

                                <View style={styles.infoItem}>
                                    <Ionicons name="refresh" size={20} color={theme.colors.primary} />
                                    <Text style={styles.infoText}>
                                        Use "Padrão" para restaurar a configuração original com todos os
                                        cards do módulo {moduleInfo!.name}.
                                    </Text>
                                </View>

                                <View style={styles.infoItem}>
                                    <Ionicons name="layers" size={20} color={theme.colors.primary} />
                                    <Text style={styles.infoText}>
                                        A configuração é salva individualmente para cada módulo. Se você trocar
                                        de módulo, as configurações de cards serão específicas para cada um.
                                    </Text>
                                </View>
                            </View>
                        </>
                    )}
                </ScrollView>

                {/* Footer com ações */}
                {hasDocuments && (
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
                            style={[styles.button, styles.saveButton, { backgroundColor: theme.colors.primary }]}
                            onPress={handleSave}
                        >
                            <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                                Salvar Configuração
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Footer simples para módulos sem documentos */}
                {!hasDocuments && (
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

    title: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
    },

    resetButton: {
        padding: 8,
    },

    resetText: {
        fontSize: 16,
        color: theme.colors.primary,
        fontWeight: '500',
    },

    content: {
        flex: 1,
    },

    section: {
        padding: 20,
        paddingBottom: 12,
    },

    moduleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },

    moduleHeaderText: {
        marginLeft: 12,
        flex: 1,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
    },

    moduleCode: {
        fontSize: 12,
        fontWeight: '500',
        color: theme.colors.textSecondary,
    },

    sectionSubtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        lineHeight: 20,
    },

    cardsContainer: {
        paddingHorizontal: 20,
        gap: 12,
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

    infoSection: {
        padding: 20,
        gap: 16,
    },

    infoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },

    infoText: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.textSecondary,
        lineHeight: 20,
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

    saveButton: {
        // backgroundColor definido dinamicamente
    },

    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});