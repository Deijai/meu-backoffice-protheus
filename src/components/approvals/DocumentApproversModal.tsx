// src/components/approvals/DocumentApproversModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { documentDetailService } from '../../services/api/documentDetailService';
import { useThemeStore } from '../../store/themeStore';

interface Approver {
    id: string;
    name: string;
    email: string;
    department: string;
    position: string;
    approvalLevel: number;
    status: 'pending' | 'approved' | 'rejected';
    approvalDate?: string;
    comments?: string;
}

interface DocumentApproversModalProps {
    visible: boolean;
    scrId: number | null;
    onClose: () => void;
}

const { height } = Dimensions.get('window');

export function DocumentApproversModal({ visible, scrId, onClose }: DocumentApproversModalProps) {
    const { theme } = useThemeStore();
    const [approvers, setApprovers] = useState<Approver[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (visible && scrId) {
            loadApprovers();
        }
    }, [visible, scrId]);

    const loadApprovers = async () => {
        if (!scrId) return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await documentDetailService.getDocumentApprovers(scrId);
            setApprovers(data);
        } catch (err) {
            setError('Falha ao carregar aprovadores');
            console.error('Erro ao carregar aprovadores:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
                return <Ionicons name="checkmark-circle" size={20} color="#10B981" />;
            case 'rejected':
                return <Ionicons name="close-circle" size={20} color="#EF4444" />;
            default:
                return <Ionicons name="time-outline" size={20} color="#F59E0B" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'approved':
                return 'Aprovado';
            case 'rejected':
                return 'Reprovado';
            default:
                return 'Pendente';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return '#10B981';
            case 'rejected':
                return '#EF4444';
            default:
                return '#F59E0B';
        }
    };

    const renderApprover = ({ item }: { item: Approver }) => (
        <View style={[styles.approverCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.approverHeader}>
                <View style={styles.approverInfo}>
                    <Text style={[styles.approverName, { color: theme.colors.text }]}>
                        {item.name}
                    </Text>
                    <Text style={[styles.approverPosition, { color: theme.colors.textSecondary }]}>
                        {item.position} • {item.department}
                    </Text>
                    <Text style={[styles.approverEmail, { color: theme.colors.textSecondary }]}>
                        {item.email}
                    </Text>
                </View>

                <View style={styles.approverStatus}>
                    {getStatusIcon(item.status)}
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {getStatusText(item.status)}
                    </Text>
                </View>
            </View>

            <View style={styles.approverDetails}>
                <View style={styles.approverRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                        Nível de Aprovação:
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                        {item.approvalLevel}
                    </Text>
                </View>

                {item.approvalDate && (
                    <View style={styles.approverRow}>
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                            Data da Aprovação:
                        </Text>
                        <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                            {new Date(item.approvalDate).toLocaleDateString('pt-BR')}
                        </Text>
                    </View>
                )}

                {item.comments && (
                    <View style={styles.commentsSection}>
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
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

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={theme.colors.text} />
                    </TouchableOpacity>

                    <View style={styles.headerContent}>
                        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                            Ver aprovadores
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                            Fluxo de aprovação do documento
                        </Text>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                                Carregando aprovadores...
                            </Text>
                        </View>
                    ) : error ? (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
                            <Text style={[styles.errorText, { color: theme.colors.error }]}>
                                {error}
                            </Text>
                            <TouchableOpacity
                                style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                                onPress={loadApprovers}
                            >
                                <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                            </TouchableOpacity>
                        </View>
                    ) : approvers.length > 0 ? (
                        <FlatList
                            data={approvers}
                            renderItem={renderApprover}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.approversList}
                        />
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={48} color={theme.colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                                Nenhum aprovador encontrado
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    closeButton: {
        padding: 8,
        marginRight: 8,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    content: {
        flex: 1,
    },
    approversList: {
        padding: 16,
        gap: 12,
    },
    approverCard: {
        borderRadius: 12,
        padding: 16,
        elevation: 1,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    approverHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    approverInfo: {
        flex: 1,
    },
    approverName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    approverPosition: {
        fontSize: 14,
        marginBottom: 2,
    },
    approverEmail: {
        fontSize: 12,
    },
    approverStatus: {
        alignItems: 'center',
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    approverDetails: {
        gap: 8,
    },
    approverRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 14,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    commentsSection: {
        marginTop: 8,
    },
    commentsText: {
        fontSize: 14,
        marginTop: 4,
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
        fontSize: 16,
        textAlign: 'center',
    },
});