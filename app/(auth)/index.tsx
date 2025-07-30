import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeArea } from '../../src/components/layout/SafeArea';
import { useAuthStore } from '../../src/store/authStore';
import { useConfigStore } from '../../src/store/configStore';
import { Colors } from '../../src/styles/colors';

export default function SplashScreen() {
    const { isFirstLaunch, onboardingCompleted, canProceedToLogin } = useConfigStore();
    const { isAuthenticated, selectedBranch, selectedModule } = useAuthStore();

    useEffect(() => {
        const timer = setTimeout(() => {
            // Fluxo de navegação seguindo as regras
            if (isFirstLaunch || !onboardingCompleted) {
                // Se é primeira vez, vai para onboarding
                router.replace('/(auth)/onboarding');
            } else if (!canProceedToLogin()) {
                // Se REST não está configurado, vai para setup
                router.replace('/(auth)/setup');
            } else if (!isAuthenticated) {
                // Se REST OK mas não está logado, vai para login
                router.replace('/(auth)/login');
            } else if (!selectedBranch) {
                // Se logado mas sem filial, vai para seleção de filial
                router.replace('/(app)/branch-selection');
            } else if (!selectedModule) {
                // Se tem filial mas sem módulo, vai para seleção de módulo
                router.replace('/(app)/module-selection');
            } else {
                // Tudo configurado, vai para a página principal
                router.replace('/(app)/(tabs)/home');
            }
        }, 2500);

        return () => clearTimeout(timer);
    }, [isFirstLaunch, onboardingCompleted, canProceedToLogin, isAuthenticated, selectedBranch, selectedModule]);

    return (
        <SafeArea>
            <View style={[styles.container, { backgroundColor: Colors.primary }]}>
                <View style={styles.content}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logo}>
                            <Text style={styles.logoText}>P</Text>
                        </View>
                        <Text style={styles.title}>Meu Backoffice</Text>
                        <Text style={styles.subtitle}>Protheus</Text>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.version}>v1.0.0</Text>
                    </View>
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
    logoContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 48,
    },
    version: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
    },
});