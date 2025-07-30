import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useThemeStore } from '../../store/themeStore';

interface CardProps extends ViewProps {
    children: React.ReactNode;
    variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'default',
    style,
    ...props
}) => {
    const { theme } = useThemeStore();

    const getCardStyle = () => {
        const baseStyle = [
            styles.card,
            { backgroundColor: theme.colors.card },
        ];

        switch (variant) {
            case 'elevated':
                return [...baseStyle, theme.shadows.md];
            case 'outlined':
                return [
                    ...baseStyle,
                    {
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                    },
                ];
            default:
                return [...baseStyle, theme.shadows.sm];
        }
    };

    return (
        <View style={[getCardStyle(), style]} {...props}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        padding: 16,
    },
});