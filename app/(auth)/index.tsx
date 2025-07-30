import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeArea } from '../../src/components/layout/SafeArea';
import { useAuthStore } from '../../src/store/authStore';
import { useConfigStore } from '../../src/store/configStore';
import { useThemeStore } from '../../src/store/themeStore';
import { Colors } from '../../src/styles/colors';

export default function SplashScreen() {
    const { theme } = useThemeStore();
    const { isFirstLaunch, onboardingCompleted } = useConfigStore();
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isFirstLaunch || !onboardingCompleted) {
                router.replace('/(auth)/onboarding');
            } else if (!isAuthenticated) {
                router.replace('/(auth)/login');
            } else {
                router.replace('/(app)/(tabs)/home');
            }
        }, 2500);

        return () => clearTimeout(timer);
    }, [isFirstLaunch, onboardingCompleted, isAuthenticated]);

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