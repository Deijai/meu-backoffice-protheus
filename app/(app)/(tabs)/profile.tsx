import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeArea } from '../../../src/components/layout/SafeArea';
import { Card } from '../../../src/components/ui/Card';
import { useAuthStore } from '../../../src/store/authStore';
import { useThemeStore } from '../../../src/store/themeStore';
import { Colors } from '../../../src/styles/colors';

export default function ProfileScreen() {
    const { theme } = useThemeStore();
    const { user, selectedBranch, selectedModule } = useAuthStore();

    const InfoCard = ({ title, value, icon }: { title: string; value: string; icon: string }) => (
        <Card variant="outlined" style={styles.infoCard}>
            <View style={styles.infoContent}>
                <View style={[styles.infoIcon, { backgroundColor: Colors.primary }]}>
                    <Ionicons name={icon as any} size={20} color="#ffffff" />
                </View>
                <View style={styles.infoText}>
                    <Text style={[styles.infoTitle, { color: theme.colors.textSecondary }]}>
                        {title}
                    </Text>
                    <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                        {value}
                    </Text>
                </View>
            </View>
        </Card>
    );

    return (
        <SafeArea>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        Perfil
                    </Text>
                </View>

                <ScrollView style={styles.content}>
                    {/* User Avatar */}
                    <Card variant="elevated" style={styles.profileCard}>
                        <View style={styles.profileHeader}>
                            <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
                                <Text style={styles.avatarText}>
                                    {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={[styles.userName, { color: theme.colors.text }]}>
                                    {user?.name || user?.username}
                                </Text>
                                {user?.email && (
                                    <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
                                        {user.email}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </Card>

                    {/* User Information */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Informações do Usuário
                        </Text>

                        <InfoCard
                            title="Nome de usuário"
                            value={user?.username || 'N/A'}
                            icon="person-outline"
                        />

                        <InfoCard
                            title="Nome completo"
                            value={user?.name || 'N/A'}
                            icon="card-outline"
                        />

                        {user?.email && (
                            <InfoCard
                                title="E-mail"
                                value={user.email}
                                icon="mail-outline"
                            />
                        )}
                    </View>

                    {/* Current Context */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Contexto Atual
                        </Text>

                        <InfoCard
                            title="Filial"
                            value={selectedBranch?.name || 'Nenhuma selecionada'}
                            icon="business-outline"
                        />

                        <InfoCard
                            title="Módulo"
                            value={selectedModule?.name || 'Nenhum selecionado'}
                            icon="apps-outline"
                        />
                    </View>

                    {/* Statistics */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Estatísticas
                        </Text>

                        <Card variant="outlined" style={styles.statsCard}>
                            <View style={styles.statsGrid}>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: theme.colors.text }]}>
                                        0
                                    </Text>
                                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                                        Sessões
                                    </Text>
                                </View>

                                <View style={styles.statDivider} />

                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: theme.colors.text }]}>
                                        0
                                    </Text>
                                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                                        Relatórios
                                    </Text>
                                </View>

                                <View style={styles.statDivider} />

                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: theme.colors.text }]}>
                                        0
                                    </Text>
                                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                                        Sync
                                    </Text>
                                </View>
                            </View>
                        </Card>
                    </View>
                </ScrollView>
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    profileCard: {
        marginBottom: 24,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    profileInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    infoCard: {
        marginBottom: 12,
    },
    infoContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    infoText: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '500',
    },
    statsCard: {
        padding: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 16,
    },
});