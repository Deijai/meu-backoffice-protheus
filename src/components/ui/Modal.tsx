import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Dimensions,
    Modal as RNModal,
    ModalProps as RNModalProps,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { Button } from './Button';

const { width, height } = Dimensions.get('window');

interface ModalProps extends Omit<RNModalProps, 'children'> {
    children: React.ReactNode;
    title?: string;
    showCloseButton?: boolean;
    onClose?: () => void;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    position?: 'center' | 'bottom' | 'top';
    showOverlay?: boolean;
    closeOnOverlayPress?: boolean;
    actions?: Array<{
        title: string;
        onPress: () => void;
        variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
        loading?: boolean;
    }>;
}

export const Modal: React.FC<ModalProps> = ({
    children,
    title,
    showCloseButton = true,
    onClose,
    size = 'md',
    position = 'center',
    showOverlay = true,
    closeOnOverlayPress = true,
    actions,
    visible = false,
    ...props
}) => {
    const { theme } = useThemeStore();

    const getModalSize = () => {
        switch (size) {
            case 'sm':
                return { width: width * 0.8, minHeight: 200, maxHeight: height * 0.6 };
            case 'md':
                return { width: width * 0.9, minHeight: 300, maxHeight: height * 0.7 };
            case 'lg':
                return { width: width * 0.95, minHeight: 400, maxHeight: height * 0.8 };
            case 'xl':
                return { width: width * 0.98, minHeight: 500, maxHeight: height * 0.9 };
            case 'full':
                return { width: width, height: height };
            default:
                return { width: width * 0.9, minHeight: 300, maxHeight: height * 0.7 };
        }
    };

    const getModalPosition = () => {
        switch (position) {
            case 'top':
                return { justifyContent: 'flex-start' as const, paddingTop: 50 };
            case 'bottom':
                return { justifyContent: 'flex-end' as const, paddingBottom: 50 };
            case 'center':
            default:
                return { justifyContent: 'center' as const };
        }
    };

    const handleOverlayPress = () => {
        if (closeOnOverlayPress && onClose) {
            onClose();
        }
    };

    return (
        <RNModal
            transparent
            visible={visible}
            animationType="fade"
            statusBarTranslucent
            {...props}
        >
            <TouchableWithoutFeedback onPress={handleOverlayPress}>
                <View style={[styles.overlay, !showOverlay && styles.noOverlay]}>
                    <TouchableWithoutFeedback>
                        <View
                            style={[
                                styles.container,
                                getModalPosition(),
                            ]}
                        >
                            <View
                                style={[
                                    styles.modal,
                                    {
                                        backgroundColor: theme.colors.card,
                                        borderColor: theme.colors.border,
                                        ...getModalSize(),
                                    },
                                    position === 'bottom' && styles.bottomModal,
                                    position === 'top' && styles.topModal,
                                    size === 'full' && styles.fullModal,
                                ]}
                            >
                                {/* Header */}
                                {(title || showCloseButton) && (
                                    <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                                        <View style={styles.headerContent}>
                                            {title && (
                                                <Text style={[styles.title, { color: theme.colors.text }]}>
                                                    {title}
                                                </Text>
                                            )}

                                            {showCloseButton && onClose && (
                                                <TouchableOpacity
                                                    onPress={onClose}
                                                    style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}
                                                >
                                                    <Ionicons name="close" size={20} color={theme.colors.text} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                )}

                                {/* Content */}
                                <View style={styles.content}>
                                    {children}
                                </View>

                                {/* Actions */}
                                {actions && actions.length > 0 && (
                                    <View style={[styles.actions, { borderTopColor: theme.colors.border }]}>
                                        {actions.map((action, index) => (
                                            <Button
                                                key={index}
                                                title={action.title}
                                                variant={action.variant || 'primary'}
                                                onPress={action.onPress}
                                                loading={action.loading}
                                                style={[
                                                    styles.actionButton,
                                                    index < actions.length - 1 && styles.actionButtonSpacing,
                                                ]}
                                            />
                                        ))}
                                    </View>
                                )}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </RNModal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    noOverlay: {
        backgroundColor: 'transparent',
    },
    container: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    modal: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    bottomModal: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    topModal: {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    },
    fullModal: {
        borderRadius: 0,
    },
    header: {
        borderBottomWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    actions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        padding: 16,
        gap: 12,
    },
    actionButton: {
        flex: 1,
    },
    actionButtonSpacing: {
        marginRight: 0,
    },
});