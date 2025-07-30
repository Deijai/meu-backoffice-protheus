import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeArea } from '../../src/components/layout/SafeArea';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/hooks/useTheme';
import { useConfigStore } from '../../src/store/configStore';
import { Colors } from '../../src/styles/colors';

const { width } = Dimensions.get('window');

const onboardingSteps = [
    {
        icon: 'server-outline' as keyof typeof Ionicons.glyphMap,
        title: 'Conexão Segura',
        description: 'Configure a conexão com seu servidor Protheus de forma rápida e segura.',
    },
    {
        icon: 'shield-checkmark-outline' as keyof typeof Ionicons.glyphMap,
        title: 'Autenticação',
        description: 'Faça login com suas credenciais e ative a autenticação biométrica para mais segurança.',
    },
    {
        icon: 'business-outline' as keyof typeof Ionicons.glyphMap,
        title: 'Multi-Filial',
        description: 'Selecione a filial desejada e acesse os módulos do seu sistema.',
    },
    {
        icon: 'apps-outline' as keyof typeof Ionicons.glyphMap,
        title: 'Módulos Integrados',
        description: 'Acesse todos os módulos do Protheus em um só lugar, de forma rápida e intuitiva.',
    },
];

export default function OnboardingScreen() {
    const { theme } = useTheme();
    const { setOnboardingCompleted, setFirstLaunch } = useConfigStore();
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < onboardingSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleFinish();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        handleFinish();
    };

    const handleFinish = () => {
        setOnboardingCompleted(true);
        setFirstLaunch(false);
        // Sempre vai para setup após onboarding
        router.replace('/(auth)/setup');
    };

    const step = onboardingSteps[currentStep];

    return (
        <SafeArea>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={styles.header}>
                    <Text style={[styles.stepIndicator, { color: theme.colors.textSecondary }]}>
                        {currentStep + 1} de {onboardingSteps.length}
                    </Text>

                    {currentStep < onboardingSteps.length - 1 && (
                        <Button
                            title="Pular"
                            variant="ghost"
                            onPress={handleSkip}
                        />
                    )}
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.stepContainer}>
                        <View style={[styles.iconContainer, { backgroundColor: Colors.primary }]}>
                            <Ionicons name={step.icon} size={48} color="#ffffff" />
                        </View>

                        <Text style={[styles.title, { color: theme.colors.text }]}>
                            {step.title}
                        </Text>

                        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                            {step.description}
                        </Text>
                    </View>

                    <View style={styles.pagination}>
                        {onboardingSteps.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    {
                                        backgroundColor: index === currentStep
                                            ? Colors.primary
                                            : theme.colors.border,
                                    },
                                ]}
                            />
                        ))}
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    {currentStep > 0 && (
                        <Button
                            title="Anterior"
                            variant="outline"
                            onPress={handlePrevious}
                            style={styles.button}
                        />
                    )}

                    <Button
                        title={currentStep === onboardingSteps.length - 1 ? 'Começar' : 'Próximo'}
                        onPress={handleNext}
                        style={[styles.button, currentStep === 0 && styles.singleButton]}
                    />
                </View>
            </View>
        </SafeArea>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    stepIndicator: {
        fontSize: 14,
        fontWeight: '500',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    stepContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 24,
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
    description: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        paddingHorizontal: 16,
    },
    pagination: {
        flexDirection: 'row',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingBottom: 32,
        gap: 12,
    },
    button: {
        flex: 1,
    },
    singleButton: {
        marginLeft: 'auto',
    },
});