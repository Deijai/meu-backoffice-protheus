import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeArea } from '../src/components/layout/SafeArea';
import { Button } from '../src/components/ui/Button';
import { useThemeStore } from '../src/store/themeStore';
import { Colors } from '../src/styles/colors';

export default function NotFoundScreen() {
    const { theme } = useThemeStore();

    const handleGoHome = () => {
        router.replace('/(auth)');
    };

    const handleGoBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            handleGoHome();
        }
    };

    return (
        <SafeArea>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={styles.content}>
                    <View style={[styles.iconContainer, { backgroundColor: Colors.primary }]}>
                        <Ionicons name="alert-circle-outline" size={64} color="#ffffff" />
                    </View>

                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        Página não encontrada
                    </Text>

                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                        Ops! A página que você está procurando não existe ou foi movida.
                    </Text>

                    <View style={styles.actions}>
                        <Button
                            title="Voltar"
                            variant="outline"
                            onPress={handleGoBack}
                            leftIcon={<Ionicons name="arrow-back" size={20} color={Colors.primary} />}
                            style={styles.button}
                        />

                        <Button
                            title="Ir para o início"
                            onPress={handleGoHome}
                            leftIcon={<Ionicons name="home" size={20} color="#ffffff" />}
                            style={styles.button}
                        />
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.errorCode, { color: theme.colors.textSecondary }]}>
                        Erro 404
                    </Text>
                </View>
            </View>
        </SafeArea>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 48,
    },
    actions: {
        width: '100%',
        gap: 16,
    },
    button: {
        width: '100%',
    },
    footer: {
        alignItems: 'center',
        paddingBottom: 32,
    },
    errorCode: {
        fontSize: 14,
        fontWeight: '500',
    },
});