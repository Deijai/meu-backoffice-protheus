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
import { useDashboardConfigStore } from '../../store/dashboardConfigStore';
import { useThemeStore } from '../../store/themeStore';
import type { DocumentType } from '../../types/approvals';
import { DOCUMENT_TYPES, getDocumentTypeIcon } from '../../types/approvals';

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

    // Estilos locais para o CardOption
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
    const {
        enabledCards,
        toggleCard,
        resetToDefault,
        isCardEnabled
    } = useDashboardConfigStore();

    const [localEnabledCards, setLocalEnabledCards] = useState<DocumentType[]>(enabledCards);

    useEffect(() => {
        setLocalEnabledCards(enabledCards);
    }, [enabledCards]);

    const handleToggleCard = (cardType: DocumentType) => {
        const newCards = localEnabledCards.includes(cardType)
            ? localEnabledCards.filter(type => type !== cardType)
            : [...localEnabledCards, cardType];

        setLocalEnabledCards(newCards);
    };

    const handleSave = async () => {
        // Aplica as mudanças
        for (const cardType of Object.keys(DOCUMENT_TYPES) as DocumentType[]) {
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
        setLocalEnabledCards(['PC', 'IP', 'AE', 'SC']);
    };

    const availableCards: DocumentType[] = ['PC', 'IP', 'AE', 'SC', 'MD', 'IM', 'CT', 'SA'];

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

                    <Text style={styles.title}>Configurar Cards</Text>

                    <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
                        <Text style={styles.resetText}>Padrão</Text>
                    </TouchableOpacity>
                </View>

                {/* Conteúdo */}
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Selecione os cards que deseja exibir na tela inicial
                        </Text>
                        <Text style={styles.sectionSubtitle}>
                            Você pode personalizar quais tipos de documento aparecerão no seu dashboard
                        </Text>
                    </View>

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
                                Use "Padrão" para restaurar a configuração original com os
                                cards mais utilizados.
                            </Text>
                        </View>
                    </View>
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
                        style={[styles.button, styles.saveButton, { backgroundColor: theme.colors.primary }]}
                        onPress={handleSave}
                    >
                        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                            Salvar Configuração
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

    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
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