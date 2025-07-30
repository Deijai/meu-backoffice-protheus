import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
    ViewProps,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../styles/colors';

interface LoadingSpinnerProps extends ViewProps {
    size?: 'small' | 'large';
    color?: string;
    text?: string;
    overlay?: boolean;
    transparent?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'large',
    color = Colors.primary,
    text,
    overlay = false,
    transparent = false,
    style,
    ...props
}) => {
    const { theme } = useThemeStore();

    if (overlay) {
        return (
            <View style={[styles.overlay, transparent && styles.transparentOverlay]}>
                <View
                    style={[
                        styles.overlayContent,
                        { backgroundColor: theme.colors.card },
                        theme.shadows.lg,
                    ]}
                >
                    <ActivityIndicator size={size} color={color} />
                    {text && (
                        <Text style={[styles.text, { color: theme.colors.text }]}>
                            {text}
                        </Text>
                    )}
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, style]} {...props}>
            <ActivityIndicator size={size} color={color} />
            {text && (
                <Text style={[styles.text, { color: theme.colors.text }]}>
                    {text}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    transparentOverlay: {
        backgroundColor: 'transparent',
    },
    overlayContent: {
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
        minWidth: 120,
    },
    text: {
        marginTop: 12,
        fontSize: 16,
        textAlign: 'center',
    },
});