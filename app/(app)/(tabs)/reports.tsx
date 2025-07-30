import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeArea } from '../../../src/components/layout/SafeArea';
import { Card } from '../../../src/components/ui/Card';
import { useThemeStore } from '../../../src/store/themeStore';

export default function ReportsScreen() {
    const { theme } = useThemeStore();

    return (
        <SafeArea>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        Relatórios
                    </Text>
                </View>

                <ScrollView style={styles.content}>
                    <Card variant="outlined" style={styles.emptyCard}>
                        <View style={styles.emptyState}>
                            <Ionicons name="document-text-outline" size={64} color={theme.colors.placeholder} />
                            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                                Em Desenvolvimento
                            </Text>
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                                A funcionalidade de relatórios estará disponível em breve.
                            </Text>
                        </View>
                    </Card>
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
    emptyCard: {
        padding: 48,
    },
    emptyState: {
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
});