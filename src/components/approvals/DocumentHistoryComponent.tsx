// src/components/approvals/DocumentHistoryComponent.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { documentDetailService } from '../../services/api/documentDetailService';
import { useThemeStore } from '../../store/themeStore';
import type { DocumentHistory } from '../../types/documentDetails';

interface DocumentHistoryComponentProps {
    scrId: number;
}

export function DocumentHistoryComponent({ scrId }: DocumentHistoryComponentProps) {
    const { theme } = useThemeStore();
    const [history, setHistory] = useState<DocumentHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadHistory();
    }, [scrId]);

    const loadHistory = async (refresh = false) => {
        try {
            if (refresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }
            setError(null);

            const data = await documentDetailService.getDocumentHistory(scrId);
            setHistory(data);
        } catch (err) {
            setError('Falha ao carregar histórico');
            console.error('Erro ao carregar histórico:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const getActionIcon = (action: string) => {
        const actionLower = action.toLowerCase();

        if (actionLower.includes('criado') || actionLower.includes('gerado')) {
            return <Ionicons name="add-circle" size={20} color="#3B82F6" />;
        }
        if (actionLower.includes('aprovado')) {
            return <Ionicons name="checkmark-circle" size={20} color="#10B981" />;
        }
        if (actionLower.includes('reprovado') || actionLower.includes('rejeitado')) {
            return <Ionicons name="close-circle" size={20} color="#EF4444" />;
        }
        if (actionLower.includes('enviado')) {
            return <Ionicons name="paper-plane" size={20} color="#8B5CF6" />;
        }
        if (actionLower.includes('modificado') || actionLower.includes('alterado')) {
            return <Ionicons name="create" size={20} color="#F59E0B" />;
        }
        if (actionLower.includes('cancelado')) {
            return <Ionicons name="ban" size={20} color="#6B7280" />;
        }

        return <Ionicons name="ellipse" size={20} color={theme.colors.primary} />;
    };

    const getActionColor = (action: string) => {
        const actionLower = action.toLowerCase();

        if (actionLower.includes('criado') || actionLower.includes('gerado')) {
            return '#3B82F6';
        }
        if (actionLower.includes('aprovado')) {
            return '#10B981';
        }
        if (actionLower.includes('reprovado') || actionLower.includes('rejeitado')) {
            return '#EF4444';
        }
        if (actionLower.includes('enviado')) {
            return '#8B5CF6';
        }
        if (actionLower.includes('modificado') || actionLower.includes('alterado')) {
            return '#F59E0B';
        }
        if (actionLower.includes('cancelado')) {
            return '#6B7280';
        }

        return theme.colors.primary;
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    const renderHistoryItem = ({ item, index }: { item: DocumentHistory; index: number }) => {
        const isLast = index === history.length - 1;

        return (
            <View style={styles.historyItem}>
                <View style={styles.timeline}>
                    <View style={[styles.timelineIcon, { backgroundColor: getActionColor(item.action) + '20' }]}>
                        {getActionIcon(item.action)}
                    </View>
                    {!isLast && <View style={[styles.timelineLine, { backgroundColor: theme.colors.border }]} />}
                </View>

                <View style={[styles.historyContent, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.historyHeader}>
                        <Text style={[styles.historyAction, { color: theme.colors.text }]}>
                            {item.action}
                        </Text>
                        <Text style={[styles.historyDate, { color: theme.colors.textSecondary }]}>
                            {formatDate(item.date)}
                        </Text>
                    </View>

                    <Text style={[styles.historyUser, { color: theme.colors.textSecondary }]}>
                        por {item.user}
                    </Text>

                    {item.comments && (
                        <View style={[styles.commentsContainer, { backgroundColor: theme.colors.background }]}>
                            <Text style={[styles.commentsLabel, { color: theme.colors.textSecondary }]}>
                                Comentários:
                            </Text>
                            <Text style={[styles.commentsText, { color: theme.colors.text }]}>
                                {item.comments}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                    Carregando histórico...
                </Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {error}
                </Text>
                <TouchableOpacity
                    style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => loadHistory()}
                >
                    <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (history.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                    Nenhum histórico encontrado
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                    O histórico de movimentações aparecerá aqui
                </Text>
            </View>
        );
    }

    return (
        <FlatList
            data={history}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.historyList}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={() => loadHistory(true)}
                    colors={[theme.colors.primary]}
                />
            }
        />
    );
}

const styles = StyleSheet.create({
    historyList: {
        padding: 16,
    },
    historyItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    timeline: {
        alignItems: 'center',
        marginRight: 16,
    },
    timelineIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        marginTop: -8,
    },
    historyContent: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        elevation: 1,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    historyAction: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    historyDate: {
        fontSize: 12,
        fontWeight: '500',
    },
    historyUser: {
        fontSize: 14,
        marginBottom: 8,
    },
    commentsContainer: {
        marginTop: 8,
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#3B82F6',
    },
    commentsLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    commentsText: {
        fontSize: 14,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
        textAlign: 'center',
    },
});