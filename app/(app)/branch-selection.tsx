// app/(app)/branch-selection.tsx - VERSÃO SIMPLIFICADA COM HOOK
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeArea } from '../../src/components/layout/SafeArea';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { useBranches } from '../../src/hooks/useBranches';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { useToastStore } from '../../src/store/toastStore';
import { Colors } from '../../src/styles/colors';
import type { AppBranch } from '../../src/types/protheus';

export default function BranchSelectionScreen() {
    const { theme } = useThemeStore();
    const { setBranch, user } = useAuthStore();
    const { visible, message, type, hideToast, showSuccess, showError } = useToastStore();

    // Hook das filiais - faz tudo automaticamente!
    const {
        filteredBranches,
        selectedBranch,
        isLoading,
        isRefreshing,
        isLoadingMore,
        hasNextPage,
        error,
        searchQuery,
        totalBranches,
        refreshBranches,
        loadMoreBranches,
        setSearchQuery,
        selectBranch,
    } = useBranches({
        autoLoad: true,
        pageSize: 20,
        showToasts: true,
    });

    /**
     * Continuar para próxima etapa
     */
    const handleContinue = async () => {
        if (!selectedBranch) {
            showError('❌ Selecione uma filial para continuar');
            return;
        }

        console.log('➡️ Salvando filial selecionada:', selectedBranch.name);

        try {
            // Salvar no store (que persiste automaticamente)
            setBranch({
                id: selectedBranch.id,
                code: selectedBranch.code,
                name: selectedBranch.name,
                location: selectedBranch.location,
                description: selectedBranch.description,
            });

            showSuccess(`✅ Filial "${selectedBranch.name}" selecionada!`);

            // Aguardar um pouco para mostrar o sucesso
            setTimeout(() => {
                router.replace('/(app)/module-selection');
            }, 1000);

        } catch (error: any) {
            console.error('❌ Erro ao salvar filial:', error);
            showError('❌ Erro ao salvar filial selecionada');
        }
    };

    /**
     * Renderizar item da lista
     */
    const renderBranchItem = ({ item }: { item: AppBranch }) => (
        <TouchableOpacity
            onPress={() => selectBranch(item)}
            style={styles.branchItem}
        >
            <Card
                variant={selectedBranch?.id === item.id ? 'elevated' : 'outlined'}
                style={[
                    styles.branchCard,
                    selectedBranch?.id === item.id && {
                        borderColor: Colors.primary,
                        borderWidth: 2,
                    },
                ]}
            >
                <View style={styles.branchContent}>
                    <View style={styles.branchInfo}>
                        <Text style={[styles.branchCode, { color: Colors.primary }]}>
                            {item.code}
                        </Text>
                        <Text style={[styles.branchName, { color: theme.colors.text }]}>
                            {item.name}
                        </Text>
                        <Text style={[styles.branchLocation, { color: theme.colors.textSecondary }]}>
                            📍 {item.location}
                        </Text>
                        {item.description && (
                            <Text style={[styles.branchDescription, { color: theme.colors.textSecondary }]}>
                                {item.description}
                            </Text>
                        )}
                    </View>

                    <View style={styles.branchIcon}>
                        <Ionicons
                            name={selectedBranch?.id === item.id ? 'radio-button-on' : 'radio-button-off'}
                            size={24}
                            color={selectedBranch?.id === item.id ? Colors.primary : theme.colors.border}
                        />
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );

    /**
     * Renderizar rodapé da lista (loading more)
     */
    const renderFooter = () => {
        if (!isLoadingMore) return null;
        return (
            <View style={styles.footerLoading}>
                <LoadingSpinner size="small" text="Carregando mais..." />
            </View>
        );
    };

    /**
     * Renderizar estado vazio
     */
    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <Ionicons
                name={searchQuery ? 'search-outline' : 'business-outline'}
                size={64}
                color={theme.colors.placeholder}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                {searchQuery ? 'Nenhuma filial encontrada' : 'Nenhuma filial disponível'}
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {searchQuery
                    ? `Não encontramos filiais que correspondam a "${searchQuery}"`
                    : 'Carregando filiais do Protheus...'
                }
            </Text>
        </View>
    );

    /**
     * Renderizar estado de erro
     */
    const renderError = () => (
        <View style={styles.errorState}>
            <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
            <Text style={[styles.errorTitle, { color: '#ef4444' }]}>
                Erro ao carregar filiais
            </Text>
            <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
                {error}
            </Text>
            <Button
                title="🔄 Tentar novamente"
                onPress={refreshBranches}
                style={styles.errorButton}
            />
        </View>
    );

    return (
        <SafeArea>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
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
                        Olá, {user?.name || user?.username}! Escolha sua filial do Protheus.
                    </Text>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <Input
                        placeholder="Buscar filial..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        leftIcon="search-outline"
                        rightIcon={searchQuery ? 'close-circle' : undefined}
                        onRightIconPress={searchQuery ? () => setSearchQuery('') : undefined}
                    />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {isLoading && !isRefreshing ? (
                        <LoadingSpinner text="Carregando filiais do Protheus..." />
                    ) : error ? (
                        renderError()
                    ) : (
                        <FlatList
                            data={filteredBranches}
                            renderItem={renderBranchItem}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl
                                    refreshing={isRefreshing}
                                    onRefresh={refreshBranches}
                                    tintColor={Colors.primary}
                                />
                            }
                            onEndReached={loadMoreBranches}
                            onEndReachedThreshold={0.1}
                            ListFooterComponent={renderFooter}
                            ListEmptyComponent={renderEmpty}
                            contentContainerStyle={
                                filteredBranches.length === 0 ? styles.emptyContainer : undefined
                            }
                        />
                    )}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    {/* Info sobre seleção */}
                    {selectedBranch && (
                        <View style={[styles.selectionInfo, { backgroundColor: `${Colors.primary}15` }]}>
                            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                            <Text style={[styles.selectionText, { color: theme.colors.text }]}>
                                {selectedBranch.name} selecionada
                            </Text>
                        </View>
                    )}

                    <Button
                        title="Continuar"
                        onPress={handleContinue}
                        disabled={!selectedBranch}
                        style={styles.continueButton}
                        leftIcon={<Ionicons name="arrow-forward" size={20} color="#ffffff" />}
                    />

                    {/* Stats */}
                    {totalBranches > 0 && (
                        <Text style={[styles.statsText, { color: theme.colors.textSecondary }]}>
                            {filteredBranches.length} de {totalBranches} filiais
                            {hasNextPage && ' (mais disponíveis)'}
                        </Text>
                    )}
                </View>

                {/* Toast */}
                {/* <Toast
                    visible={visible}
                    message={message}
                    type={type}
                    onHide={hideToast}
                /> */}
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
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
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
        marginBottom: 5,
    },
    content: {
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
        marginBottom: 2,
    },
    branchDescription: {
        fontSize: 13,
        fontStyle: 'italic',
    },
    branchIcon: {
        marginLeft: 16,
    },
    emptyContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    errorState: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 32,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    errorButton: {
        minWidth: 200,
    },
    footerLoading: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    footer: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        gap: 12,
    },
    selectionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    selectionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    continueButton: {
        height: 56,
    },
    statsText: {
        fontSize: 12,
        textAlign: 'center',
    },
});