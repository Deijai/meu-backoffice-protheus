import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/themeStore';

interface SafeAreaProps {
    children: React.ReactNode;
    edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export const SafeArea: React.FC<SafeAreaProps> = ({
    children,
    edges = ['top', 'bottom']
}) => {
    const { theme, isDark } = useThemeStore();

    // Verificação de segurança para garantir que theme.colors existe
    const backgroundColor = theme?.colors?.background || '#ffffff';
    const barStyle = isDark ? 'light-content' : 'dark-content';

    return (
        <>
            <StatusBar
                barStyle={barStyle}
                backgroundColor={backgroundColor}
            />
            <SafeAreaView style={[styles.container, { backgroundColor }]}>
                {children}
            </SafeAreaView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});