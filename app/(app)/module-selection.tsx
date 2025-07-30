import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeArea } from '../../src/components/layout/SafeArea';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { Colors } from '../../src/styles/colors';
import type { Module } from '../../src/types/auth';
import { MOCK_MODULES } from '../../src/utils/constants';

const { width } = Dimensions.get('window');
const itemWidth = (width - 72) / 2; // 24px padding + 24px gap

export default function ModuleSelectionScreen() {
    const { theme } = useThemeStore();
    const { setModule, selectedBranch, user } = useAuthStore();
    const [selectedModule, setSelectedModule] = useState<Module | null>(null);

    const handleSelectModule = (module: Module) => {
        setSelectedModule(module);
    };

    const handleContinue = () => {
        if (selectedModule) {
            setModule(selectedModule);
            router.replace('/(app)/(tabs)/home');
        }
    };

    const ModuleItem = ({ module }: { module: Module }) => (
        <TouchableOpacity
            onPress={() => handleSelectModule(module)}
            style={[styles.moduleItem, { width: itemWidth }]}
        >
            <Card
                variant={selectedModule?.id === module.id ? 'elevated' : 'outlined'}
                style={[
                    styles.moduleCard,
                    selectedModule?.id === module.id && {
                        borderColor: Colors.primary,
                        borderWidth: 2,
                    },
                ]}
            >
                <View style={styles.moduleContent}>
                    <View
                        style={[
                            styles.moduleIcon,
                            {
                                backgroundColor: selectedModule?.id === module.id
                                    ? Colors.primary
                                    : module.color || Colors.primary,
                            },
                        ]}
                    >
                        <Ionicons
                            name={module.icon as any}
                            size={32}
                            color="#ffffff"
                        />
                    </View>

                    <Text style={[styles.moduleCode, { color: theme.colors.textSecondary }]}>
                        {module.code}
                    </Text>

                    <Text style={[styles.moduleName, { color: theme.colors.text }]}>
                        {module.name}
                    </Text>

                    <Text style={[styles.moduleDescription, { color: theme.colors.textSecondary }]}>
                        {module.description}
                    </Text>
                </View>
            </Card>
        </TouchableOpacity>
    );

    return (
        <SafeArea>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                        </TouchableOpacity>

                        <View style={[styles.iconContainer, { backgroundColor: Colors.primary }]}>
                            <Ionicons name="apps-outline" size={24} color="#ffffff" />
                        </View>
                    </View>

                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        Selecionar Módulo
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                        {selectedBranch?.name} - Escolha o módulo para começar.
                    </Text>
                </View>

                <ScrollView style={styles.moduleList} showsVerticalScrollIndicator={false}>
                    <View style={styles.moduleGrid}>
                        {MOCK_MODULES.map((module) => (
                            <ModuleItem key={module.id} module={module} />
                        ))}
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <Button
                        title="Continuar"
                        onPress={handleContinue}
                        disabled={!selectedModule}
                        style={styles.continueButton}
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
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backButton: {
        marginRight: 16,
        padding: 8,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 22,
    },
    moduleList: {
        flex: 1,
        paddingHorizontal: 24,
    },
    moduleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        paddingBottom: 24,
    },
    moduleItem: {
        marginBottom: 12,
    },
    moduleCard: {
        padding: 16,
        height: 180,
    },
    moduleContent: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    moduleIcon: {
        width: 64,
        height: 64,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    moduleCode: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
    },
    moduleName: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 8,
    },
    moduleDescription: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 16,
    },
    footer: {
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    continueButton: {
        marginBottom: 8,
    },
});