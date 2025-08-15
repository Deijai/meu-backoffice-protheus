// src/components/ui/LanguageSelector.tsx - VERSÃO CORRIGIDA
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../styles/colors';
import { Language, LanguageCode } from '../../types/i18n';

interface LanguageSelectorProps {
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    style?: any;
    onLanguageChange?: (language: LanguageCode) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    size = 'md',
    showText = true,
    style,
    onLanguageChange,
}) => {
    const { theme } = useThemeStore();
    const {
        currentLanguage,
        supportedLanguages,
        setLanguage,
        isChangingLanguage,
        getCurrentLanguageInfo
    } = useTranslation();

    const [modalVisible, setModalVisible] = useState(false);

    const currentLang = getCurrentLanguageInfo();

    // Configurações de tamanho com tipos corretos
    const sizes = {
        sm: {
            button: 32,
            text: 12,
            icon: 16,
            modalWidth: screenWidth * 0.7
        },
        md: {
            button: 40,
            text: 14,
            icon: 18,
            modalWidth: screenWidth * 0.8
        },
        lg: {
            button: 48,
            text: 16,
            icon: 20,
            modalWidth: screenWidth * 0.85
        },
    };

    const currentSize = sizes[size];

    const handleLanguageSelect = async (language: LanguageCode) => {
        if (language === currentLanguage) {
            setModalVisible(false);
            return;
        }

        try {
            await setLanguage(language);
            onLanguageChange?.(language);
            setModalVisible(false);
        } catch (error) {
            console.error('❌ Erro ao alterar idioma:', error);
            // Aqui você pode mostrar um toast de erro se tiver
        }
    };

    const renderLanguageItem = ({ item }: { item: Language }) => {
        const isSelected = item.code === currentLanguage;

        return (
            <TouchableOpacity
                style={[
                    styles.languageItem,
                    {
                        backgroundColor: isSelected
                            ? `${Colors.primary}15`
                            : 'transparent',
                        borderColor: isSelected
                            ? Colors.primary
                            : theme.colors.border,
                    }
                ]}
                onPress={() => handleLanguageSelect(item.code)}
                disabled={isChangingLanguage}
            >
                <Text style={styles.flag}>{item.flag}</Text>

                <View style={styles.languageInfo}>
                    <Text style={[
                        styles.languageName,
                        {
                            color: isSelected ? Colors.primary : theme.colors.text,
                            fontWeight: isSelected ? '600' : '400'
                        }
                    ]}>
                        {item.name}
                    </Text>
                    <Text style={[
                        styles.languageNative,
                        { color: theme.colors.textSecondary }
                    ]}>
                        {item.nativeName}
                    </Text>
                </View>

                {isSelected && (
                    <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={Colors.primary}
                    />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <>
            {/* Botão do seletor */}
            <TouchableOpacity
                style={[
                    styles.selectorButton,
                    {
                        backgroundColor: theme.colors.background === '#ffffff'
                            ? 'rgba(255, 255, 255, 0.9)'
                            : 'rgba(45, 55, 72, 0.9)',
                        borderColor: theme.colors.border,
                        width: currentSize.button,
                        height: currentSize.button,
                    },
                    style
                ]}
                onPress={() => setModalVisible(true)}
                disabled={isChangingLanguage}
            >
                {isChangingLanguage ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                    <>
                        <Text style={[styles.flag, { fontSize: currentSize.icon - 2 }]}>
                            {currentLang?.flag}
                        </Text>
                        {showText && size !== 'sm' && (
                            <Text style={[
                                styles.languageCode,
                                {
                                    fontSize: currentSize.text,
                                    color: theme.colors.text
                                }
                            ]}>
                                {currentLanguage.toUpperCase()}
                            </Text>
                        )}
                    </>
                )}
            </TouchableOpacity>

            {/* Modal de seleção */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[
                        styles.modalContent,
                        {
                            backgroundColor: theme.colors.background,
                            borderColor: theme.colors.border,
                            width: currentSize.modalWidth, // Agora usando number em vez de string
                        }
                    ]}>
                        {/* Header do modal */}
                        <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                                Selecionar Idioma
                            </Text>
                            <TouchableOpacity
                                style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Ionicons name="close" size={20} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Lista de idiomas */}
                        <FlatList
                            data={supportedLanguages}
                            renderItem={renderLanguageItem}
                            keyExtractor={(item) => item.code}
                            style={styles.languageList}
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        />

                        {/* Indicador de carregamento */}
                        {isChangingLanguage && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color={Colors.primary} />
                                <Text style={[styles.loadingText, { color: theme.colors.text }]}>
                                    Alterando idioma...
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    selectorButton: {
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    flag: {
        fontSize: 16,
    },
    languageCode: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        borderRadius: 20,
        borderWidth: 1,
        maxHeight: '70%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    languageList: {
        padding: 16,
    },
    languageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
    },
    languageInfo: {
        flex: 1,
        marginLeft: 12,
    },
    languageName: {
        fontSize: 16,
        marginBottom: 2,
    },
    languageNative: {
        fontSize: 13,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '500',
    },
});