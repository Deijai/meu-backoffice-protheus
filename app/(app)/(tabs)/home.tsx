import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeArea } from '../../../src/components/layout/SafeArea';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { useAuthStore } from '../../../src/store/authStore';
import { useThemeStore } from '../../../src/store/themeStore';
import { Colors } from '../../../src/styles/colors';

export default function HomeScreen() {
    const { theme, toggleTheme, isDark } = useThemeStore();
    const { user, selectedBranch, selectedModule, logout } = useAuthStore();

    const quickActions = [
        {
            id: '1',
            title: 'Consultar Dados',
            description: 'Visualizar informações do sistema',
            icon: 'search-outline',
            color: Colors.primary,
        },
        {
            id: '2',
            title: 'Relatórios',
            description: 'Gerar relatórios personalizados',
            icon: 'document-text-outline',
            color: '#38a169',
        },
        {
            id: '3',
            title: 'Sincronizar',
            description: 'Sincronizar dados offline',
            icon: 'sync-outline',
            color: '#d69e2e',
        },
        {
            id: '4',
            title: 'Configurações',
            description: 'Ajustar preferências',
            icon: 'settings-outline',
            color: '#805ad5',
        },
    ];

    const handleLogout = () => {
        logout();
    };

    return (
        <SafeArea>
            <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <View>
                            <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
                                Olá, {user?.name || user?.username}!
                            </Text>
                            <Text style={[styles.welcomeText, { color: theme.colors.text }]}>
                                Bem-vindo de volta
                            </Text>
                        </View>

                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                onPress={toggleTheme}
                                style={[styles.headerButton, { backgroundColor: theme.colors.surface }]}
                            >
                                <Ionicons
                                    name={isDark ? 'sunny-outline' : 'moon-outline'}
                                    size={20}
                                    color={theme.colors.text}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.headerButton, { backgroundColor: theme.colors.surface }]}
                            >
                                <Ionicons name="notifications-outline" size={20} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Current Context */}
                <Card variant="elevated" style={styles.contextCard}>
                    <View style={styles.contextHeader}>
                        <View style={[styles.moduleIcon, { backgroundColor: selectedModule?.color || Colors.primary }]}>
                            <Ionicons name={selectedModule?.icon as any} size={24} color="#ffffff" />
                        </View>
                        <View style={styles.contextInfo}>
                            <Text style={[styles.contextTitle, { color: theme.colors.text }]}>
                                {selectedModule?.name}
                            </Text>
                            <Text style={[styles.contextSubtitle, { color: theme.colors.textSecondary }]}>
                                {selectedBranch?.name}
                            </Text>
                        </View>
                    </View>

                    <Text style={[styles.contextDescription, { color: theme.colors.textSecondary }]}>
                        {selectedModule?.description}
                    </Text>
                </Card>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Ações Rápidas
                    </Text>

                    <View style={styles.actionsGrid}>
                        {quickActions.map((action) => (
                            <TouchableOpacity key={action.id} style={styles.actionItem}>
                                <Card variant="outlined" style={styles.actionCard}>
                                    <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                                        <Ionicons name={action.icon as any} size={24} color="#ffffff" />
                                    </View>
                                    <Text style={[styles.actionTitle, { color: theme.colors.text }]}>
                                        {action.title}
                                    </Text>
                                    <Text style={[styles.actionDescription, { color: theme.colors.textSecondary }]}>
                                        {action.description}
                                    </Text>
                                </Card>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Atividade Recente
                    </Text>

                    <Card variant="outlined" style={styles.activityCard}>
                        <View style={styles.emptyState}>
                            <Ionicons name="time-outline" size={48} color={theme.colors.placeholder} />
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                                Nenhuma atividade recente
                            </Text>
                        </View>
                    </Card>
                </View>

                {/* Logout Button */}
                <View style={styles.section}>
                    <Button
                        title="Sair"
                        variant="outline"
                        onPress={handleLogout}
                        leftIcon={<Ionicons name="log-out-outline" size={20} color={Colors.primary} />}
                    />
                </View>
            </ScrollView>
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
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: 16,
        marginBottom: 4,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contextCard: {
        marginHorizontal: 24,
        marginBottom: 24,
    },
    contextHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    moduleIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    contextInfo: {
        flex: 1,
    },
    contextTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 2,
    },
    contextSubtitle: {
        fontSize: 14,
    },
    contextDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    section: {
        marginHorizontal: 24,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 16,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionItem: {
        width: '48%',
    },
    actionCard: {
        padding: 16,
        alignItems: 'center',
        minHeight: 120,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 4,
    },
    actionDescription: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 16,
    },
    activityCard: {
        padding: 24,
    },
    emptyState: {
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
    },
});