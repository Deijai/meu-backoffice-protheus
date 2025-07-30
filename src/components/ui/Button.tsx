import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableOpacityProps,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../styles/colors';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    style,
    ...props
}) => {
    const { theme } = useThemeStore();

    const getButtonStyle = () => {
        const baseStyle = [styles.button, styles[size]];

        switch (variant) {
            case 'primary':
                return [
                    ...baseStyle,
                    {
                        backgroundColor: disabled ? theme.colors.placeholder : Colors.primary,
                    },
                ];
            case 'secondary':
                return [
                    ...baseStyle,
                    {
                        backgroundColor: disabled ? theme.colors.placeholder : theme.colors.surface,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                    },
                ];
            case 'outline':
                return [
                    ...baseStyle,
                    {
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        borderColor: disabled ? theme.colors.placeholder : Colors.primary,
                    },
                ];
            case 'ghost':
                return [
                    ...baseStyle,
                    {
                        backgroundColor: 'transparent',
                    },
                ];
            default:
                return baseStyle;
        }
    };

    const getTextStyle = () => {
        const baseTextStyle = [styles.text, styles[`text${size.charAt(0).toUpperCase() + size.slice(1)}`]];

        switch (variant) {
            case 'primary':
                return [
                    ...baseTextStyle,
                    { color: '#ffffff' },
                ];
            case 'secondary':
                return [
                    ...baseTextStyle,
                    { color: theme.colors.text },
                ];
            case 'outline':
            case 'ghost':
                return [
                    ...baseTextStyle,
                    { color: disabled ? theme.colors.placeholder : Colors.primary },
                ];
            default:
                return baseTextStyle;
        }
    };

    return (
        <TouchableOpacity
            style={[getButtonStyle(), style]}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' ? '#ffffff' : Colors.primary}
                    size="small"
                />
            ) : (
                <>
                    {leftIcon}
                    <Text style={getTextStyle()}>{title}</Text>
                    {rightIcon}
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        gap: 8,
    },
    sm: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
    },
    md: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
    },
    lg: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 10,
    },
    text: {
        fontWeight: '600',
        textAlign: 'center',
    },
    textSm: {
        fontSize: 14,
        lineHeight: 20,
    },
    textMd: {
        fontSize: 16,
        lineHeight: 24,
    },
    textLg: {
        fontSize: 18,
        lineHeight: 28,
    },
});