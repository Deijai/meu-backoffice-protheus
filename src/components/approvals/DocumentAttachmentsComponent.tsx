// src/components/approvals/DocumentAttachmentsComponent.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { documentDetailService } from '../../services/api/documentDetailService';
import { useThemeStore } from '../../store/themeStore';
import type { DocumentAttachment } from '../../types/documentDetails';

interface DocumentAttachmentsComponentProps {
    scrId: number;
}

export function DocumentAttachmentsComponent({ scrId }: DocumentAttachmentsComponentProps) {
    const { theme } = useThemeStore();
    const [attachments, setAttachments] = useState<DocumentAttachment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAttachments();
    }, [scrId]);

    const loadAttachments = async (refresh = false) => {
        try {
            if (refresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }
            setError(null);

            const data = await documentDetailService.getDocumentAttachments(scrId);
            setAttachments(data);
        } catch (err) {
            setError('Falha ao carregar anexos');
            console.error('Erro ao carregar anexos:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getFileIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();

        switch (extension) {
            case 'pdf':
                return <Ionicons name="document-text" size={24} color="#DC2626" />;
            case 'doc':
            case 'docx':
                return <Ionicons name="document-text" size={24} color="#2563EB" />;
            case 'xls':
            case 'xlsx':
                return <Ionicons name="grid" size={24} color="#059669" />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return <Ionicons name="image" size={24} color="#7C3AED" />;
            case 'zip':
            case 'rar':
                return <Ionicons name="archive" size={24} color="#F59E0B" />;
            default:
                return <Ionicons name="document" size={24} color={theme.colors.textSecondary} />;
        }
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

    const handleDownload = async (attachment: DocumentAttachment) => {
        try {
            setDownloadingIds(prev => new Set(prev).add(attachment.id));

            // Verificar se há uma URL de download disponível
            if (attachment.downloadUrl) {
                const supported = await Linking.canOpenURL(attachment.downloadUrl);
                if (supported) {
                    await Linking.openURL(attachment.downloadUrl);
                } else {
                    Alert.alert('Erro', 'Não é possível abrir este arquivo');
                }
            } else {
                // Usar o serviço para fazer download
                const blob = await documentDetailService.downloadAttachment(attachment.id);

                // Em uma implementação real do React Native, você utilizaria
                // uma biblioteca como react-native-fs para salvar o arquivo
                Alert.alert(
                    'Download',
                    `Arquivo ${attachment.fileName} baixado com sucesso!`
                );
            }
        } catch (err) {
            console.error('Erro ao fazer download:', err);
            Alert.alert('Erro', 'Falha ao fazer download do arquivo');
        } finally {
            setDownloadingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(attachment.id);
                return newSet;
            });
        }
    };

    const handleShare = (attachment: DocumentAttachment) => {
        // Implementar compartilhamento usando react-native-share
        Alert.alert(
            'Compartilhar',
            `Deseja compartilhar o arquivo ${attachment.fileName}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Compartilhar',
                    onPress: () => {
                        // Implementar compartilhamento
                        console.log('Compartilhar arquivo:', attachment.fileName);
                    }
                }
            ]
        );
    };

    const renderAttachment = ({ item }: { item: DocumentAttachment }) => {
        const isDownloading = downloadingIds.has(item.id);

        return (
            <View style={[styles.attachmentCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.attachmentHeader}>
                    <View style={styles.fileIcon}>
                        {getFileIcon(item.fileName)}
                    </View>

                    <View style={styles.fileInfo}>
                        <Text
                            style={[styles.fileName, { color: theme.colors.text }]}
                            numberOfLines={2}
                        >
                            {item.fileName}
                        </Text>
                        <Text style={[styles.fileDetails, { color: theme.colors.textSecondary }]}>
                            {formatFileSize(item.fileSize)} • {formatDate(item.uploadDate)}
                        </Text>
                    </View>
                </View>

                <View style={styles.attachmentActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.colors.primary + '15' }]}
                        onPress={() => handleDownload(item)}
                        disabled={isDownloading}
                    >
                        {isDownloading ? (
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                        ) : (
                            <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
                        )}
                        <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
                            {isDownloading ? 'Baixando...' : 'Baixar'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.colors.surface + '15' }]}
                        onPress={() => handleShare(item)}
                    >
                        <Ionicons name="share-outline" size={20} color={theme.colors.surface} />
                        <Text style={[styles.actionButtonText, { color: theme.colors.surface }]}>
                            Compartilhar
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                    Carregando anexos...
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
                    onPress={() => loadAttachments()}
                >
                    <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (attachments.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="attach-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                    Nenhum anexo encontrado
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                    Os anexos do documento aparecerão aqui
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Summary */}
            <View style={[styles.summary, { backgroundColor: theme.colors.surface }]}>
                <Ionicons name="attach" size={20} color={theme.colors.primary} />
                <Text style={[styles.summaryText, { color: theme.colors.text }]}>
                    {attachments.length} {attachments.length === 1 ? 'anexo' : 'anexos'} encontrado{attachments.length === 1 ? '' : 's'}
                </Text>
            </View>

            <FlatList
                data={attachments}
                renderItem={renderAttachment}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.attachmentsList}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => loadAttachments(true)}
                        colors={[theme.colors.primary]}
                    />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    summary: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        borderRadius: 8,
        gap: 8,
    },
    summaryText: {
        fontSize: 14,
        fontWeight: '600',
    },
    attachmentsList: {
        padding: 16,
        paddingTop: 0,
    },
    attachmentCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 1,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    attachmentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    fileIcon: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    fileInfo: {
        flex: 1,
    },
    fileName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        lineHeight: 22,
    },
    fileDetails: {
        fontSize: 12,
    },
    attachmentActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 6,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
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