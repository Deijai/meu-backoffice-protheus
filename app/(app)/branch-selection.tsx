import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeArea } from '../../src/components/layout/SafeArea';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { Colors } from '../../src/styles/colors';
import type { Branch } from '../../src/types/auth';
import { MOCK_BRANCHES } from '../../src/utils/constants';

export default function BranchSelectionScreen() {
    const { theme } = useThemeStore();
    const { setBranch, user } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

    const filteredBranches = MOCK_BRANCHES.filter(branch =>
        branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        branch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        branch.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectBranch = (branch: Branch) => {
        setSelectedBranch(branch);
    };

    const handleContinue = () => {
        if (selectedBranch) {
            setBranch(selectedBranch);
            router.replace('/(app)/module-selection');
        }
    };

    const BranchItem = ({ branch }: { branch: Branch }) => (
        <TouchableOpacity
            onPress={() => handleSelectBranch(branch)}
            style={styles.branchItem}
        >
            <Card
                variant={selectedBranch?.id === branch.id ? 'elevated' : 'outlined'}
                style={[
                    styles.branchCard,
                    selectedBranch?.id === branch.id && {
                        borderColor: Colors.primary,
                        borderWidth: 2,
                    },
                ]}
            >
                <View style={styles.branchContent}>
                    <View style={styles.branchInfo}>
                        <Text style={[styles.branchCode, { color: Colors.primary }]}>
                            {branch.code}
                        </Text>
                        <Text style={[styles.branchName, { color: theme.colors.text }]}>
                            {branch.name}
                        </Text>
                        <Text style={[styles.branchLocation, { color: theme.colors.textSecondary }]}>
                            {branch.location}
                        </Text>
                    </View>

                    <View style={styles.branchIcon}>
                        <Ionicons
                            name={selectedBranch?.id === branch.id ? 'radio-button-on' : 'radio-button-off'}
                            size={24}
                            color={selectedBranch?.id === branch.id ? Colors.primary : theme.colors.border}
                        />
                    </View>
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
                            <Ionicons name="business-outline" size={24} color="#ffffff" />
                        </View>
                    </View>

                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        Selecionar Filial
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                        Olá, {user?.name || user?.username}! Escolha a filial para continuar.
                    </Text>
                </View>

                <View style={styles.searchContainer}>
                    <Input
                        placeholder="Buscar filial..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        leftIcon="search-outline"
                    />
                </View>

                <ScrollView style={styles.branchList} showsVerticalScrollIndicator={false}>
                    {filteredBranches.map((branch) => (
                        <BranchItem key={branch.id} branch={branch} />
                    ))}

                    {filteredBranches.length === 0 && (
                        <View style={styles.emptyState}>
                            <Ionicons name="search-outline" size={48} color={theme.colors.placeholder} />
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                                Nenhuma filial encontrada
                            </Text>
                        </View>
                    )}
                </ScrollView>

                <View style={styles.footer}>
                    <Button
                        title="Continuar"
                        onPress={handleContinue}
                        disabled={!selectedBranch}
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
    searchContainer: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    branchList: {
        flex: 1,
        paddingHorizontal: 24,
    },
    branchItem: {
        marginBottom: 12,
    },
    branchCard: {
        padding: 16,
    },
    branchContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    branchInfo: {
        flex: 1,
    },
    branchCode: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    branchName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    branchLocation: {
        fontSize: 14,
    },
    branchIcon: {
        marginLeft: 16,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
    },
    footer: {
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    continueButton: {
        marginBottom: 8,
    },
});