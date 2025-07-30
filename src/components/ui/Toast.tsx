import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';

const { width } = Dimensions.get('window');

interface ToastProps {
    visible: boolean;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    position?: 'top' | 'bottom';
    onHide?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
    visible,
    message,
    type = 'info',
    duration = 4000,
    position = 'top',
    onHide,
}) => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Show toast
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto hide
            if (duration > 0) {
                const timer = setTimeout(() => {
                    hideToast();
                }, duration);

                return () => clearTimeout(timer);
            }
        } else {
            hideToast();
        }
    }, [visible, duration]);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: position === 'top' ? -100 : 100,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            if (onHide) {
                onHide();
            }
        });
    };

    const getToastStyle = () => {
        switch (type) {
            case 'success':
                return {
                    backgroundColor: '#10b981',
                    borderColor: '#059669',
                };
            case 'error':
                return {
                    backgroundColor: '#ef4444',
                    borderColor: '#dc2626',
                };
            case 'warning':
                return {
                    backgroundColor: '#f59e0b',
                    borderColor: '#d97706',
                };
            case 'info':
            default:
                return {
                    backgroundColor: '#3b82f6',
                    borderColor: '#2563eb',
                };
        }
    };

    const getToastIcon = () => {
        switch (type) {
            case 'success':
                return 'checkmark-circle';
            case 'error':
                return 'alert-circle';
            case 'warning':
                return 'warning';
            case 'info':
            default:
                return 'information-circle';
        }
    };

    const topOffset = position === 'top' ? insets.top + 16 : undefined;
    const bottomOffset = position === 'bottom' ? insets.bottom + 16 : undefined;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    ...getToastStyle(),
                    transform: [{ translateY }],
                    opacity,
                    top: topOffset,
                    bottom: bottomOffset,
                },
            ]}
            pointerEvents={visible ? 'auto' : 'none'}
        >
            <View style={styles.content}>
                <Ionicons
                    name={getToastIcon()}
                    size={20}
                    color="#ffffff"
                    style={styles.icon}
                />

                <Text style={styles.message}>
                    {message}
                </Text>

                <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
                    <Ionicons name="close" size={18} color="#ffffff" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
        borderRadius: 12,
        borderWidth: 1,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    icon: {
        marginRight: 12,
    },
    message: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: '#ffffff',
        lineHeight: 20,
    },
    closeButton: {
        marginLeft: 8,
        padding: 4,
    },
});