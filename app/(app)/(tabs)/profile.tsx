import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeArea } from '../../../src/components/layout/SafeArea';
import { Card } from '../../../src/components/ui/Card';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { authService } from '../../../src/services/api/authService';
import { useAuthStore } from '../../../src/store/authStore';
import { useConfigStore } from '../../../src/store/configStore';
import { useThemeStore } from '../../../src/store/themeStore';
import { useToastStore } from '../../../src/store/toastStore';
import { Colors } from '../../../src/styles/colors';
import { formatters } from '../../../src/utils/formatters';

interface StorageData {
    currentUser?: any;
    savedUsers?: any[];
    connection?: any;
    themeConfig?: any;
    authInfo?: any;
    systemInfo?: any;
}

export default function ProfileScreen() {
    const { theme, isDark } = useThemeStore();
    const { user, selectedBranch, selectedModule } = useAuthStore();
    const { connection } = useConfigStore();
    const { showSuccess, showInfo } = useToastStore();

    const [storageData, setStorageData] = useState<StorageData>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Carregar dados do storage na montagem
    useEffect(() => {
        loadStorageData();
    }, []);

    /**
     * Carrega todos os dados relevantes do storage
     */
    const loadStorageData = useCallback(async (showRefresh = false) => {
        if (showRefresh) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        try {
            console.log('📊 Carregando dados do storage para perfil...');

            // Dados do usuário atual
            const currentUser = await authService.getCurrentUser();

            // Usuários salvos para auto login
            const savedUsers = await authService.listStoredUsers();

            // Informações do sistema de auth
            const systemInfo = authService.getSystemInfo();

            // Dados da conexão
            const connectionData = connection;

            // Configurações do tema
            const themeConfig = {
                isDark: isDark,
                currentTheme: isDark ? 'dark' : 'light',
            };

            // Informações adicionais de autenticação
            const authInfo = {
                isAuthenticated: !!currentUser,
                authType: currentUser?.authType || 'N/A',
                tokenExpiresAt: currentUser?.tokenExpiresAt || null,
                lastLogin: currentUser?.lastLogin || null,
                keepConnected: currentUser?.keepConnected || false,
                hasRefreshToken: !!currentUser?.refresh_token,
            };

            const data: StorageData = {
                currentUser,
                savedUsers,
                connection: connectionData,
                themeConfig,
                authInfo,
                systemInfo,
            };

            setStorageData(data);
            console.log('✅ Dados do storage carregados:', Object.keys(data));

        } catch (error) {
            console.error('❌ Erro ao carregar dados do storage:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [connection, isDark]);

    /**
     * Refresh dos dados
     */
    const handleRefresh = useCallback(() => {
        showInfo('🔄 Atualizando dados do perfil...');
        loadStorageData(true);
    }, [loadStorageData, showInfo]);

    /**
     * Mostrar dados brutos em modal
     */
    const showRawData = (title: string, data: any) => {
        const jsonString = JSON.stringify(data, null, 2);
        Alert.alert(
            title,
            jsonString,
            [{ text: 'Fechar', style: 'cancel' }],
            {
                cancelable: true,
            }
        );
    };

    /**
     * Componente para mostrar informação com ícone
     */
    const InfoItem = ({
        title,
        value,
        icon,
        onPress,
        variant = 'default'
    }: {
        title: string;
        value: string;
        icon: string;
        onPress?: () => void;
        variant?: 'default' | 'success' | 'warning' | 'error';
    }) => {
        const getVariantColor = () => {
            switch (variant) {
                case 'success': return '#22c55e';
                case 'warning': return '#f59e0b';
                case 'error': return '#ef4444';
                default: return Colors.primary;
            }
        };

        return (
            <TouchableOpacity
                onPress={onPress}
                style={styles.infoItem}
                disabled={!onPress}
            >
                <View style={styles.infoContent}>
                    <View style={[styles.infoIcon, { backgroundColor: getVariantColor() }]}>
                        <Ionicons name={icon as any} size={18} color="#ffffff" />
                    </View>
                    <View style={styles.infoText}>
                        <Text style={[styles.infoTitle, { color: theme.colors.textSecondary }]}>
                            {title}
                        </Text>
                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                            {value}
                        </Text>
                    </View>
                    {onPress && (
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={theme.colors.textSecondary}
                        />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (isLoading && !isRefreshing) {
        return (
            <SafeArea>
                <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                    <LoadingSpinner text="Carregando dados do perfil..." />
                </View>
            </SafeArea>
        );
    }

    return (
        <SafeArea>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        Perfil Completo
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                        Todos os dados salvos no dispositivo
                    </Text>
                </View>

                <ScrollView
                    style={styles.content}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor={Colors.primary}
                        />
                    }
                >
                    {/* User Avatar & Basic Info */}
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
                                <View style={styles.statusBadge}>
                                    <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
                                    <Text style={[styles.statusText, { color: '#22c55e' }]}>
                                        Online
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </Card>

                    {/* Dados de Autenticação */}
                    <Card variant="outlined" style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                Informações de Autenticação
                            </Text>
                        </View>

                        <InfoItem
                            title="Tipo de Autenticação"
                            value={storageData.authInfo?.authType || 'N/A'}
                            icon="key-outline"
                            variant="success"
                        />

                        <InfoItem
                            title="Último Login"
                            value={storageData.authInfo?.lastLogin
                                ? formatters.datetime(storageData.authInfo.lastLogin)
                                : 'N/A'
                            }
                            icon="time-outline"
                        />

                        <InfoItem
                            title="Token Expira em"
                            value={storageData.authInfo?.tokenExpiresAt
                                ? formatters.timeAgo(storageData.authInfo.tokenExpiresAt)
                                : 'N/A'
                            }
                            icon="timer-outline"
                            variant={storageData.authInfo?.tokenExpiresAt
                                ? (new Date(storageData.authInfo.tokenExpiresAt) > new Date() ? 'success' : 'error')
                                : 'default'
                            }
                        />

                        <InfoItem
                            title="Manter Conectado"
                            value={storageData.authInfo?.keepConnected ? 'Sim' : 'Não'}
                            icon="link-outline"
                            variant={storageData.authInfo?.keepConnected ? 'success' : 'default'}
                        />

                        <InfoItem
                            title="Refresh Token"
                            value={storageData.authInfo?.hasRefreshToken ? 'Disponível' : 'Não disponível'}
                            icon="refresh-outline"
                            variant={storageData.authInfo?.hasRefreshToken ? 'success' : 'warning'}
                        />
                    </Card>

                    {/* Contexto Atual */}
                    <Card variant="outlined" style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="business-outline" size={20} color={Colors.primary} />
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                Contexto Atual
                            </Text>
                        </View>

                        <InfoItem
                            title="Filial Selecionada"
                            value={selectedBranch?.name || 'Nenhuma'}
                            icon="location-outline"
                            onPress={selectedBranch ? () => showRawData('Dados da Filial', selectedBranch) : undefined}
                        />

                        <InfoItem
                            title="Código da Filial"
                            value={selectedBranch?.code || 'N/A'}
                            icon="barcode-outline"
                        />

                        <InfoItem
                            title="Localização"
                            value={selectedBranch?.location || 'N/A'}
                            icon="map-outline"
                        />

                        <InfoItem
                            title="Módulo Ativo"
                            value={selectedModule?.name || 'Nenhum'}
                            icon="apps-outline"
                            onPress={selectedModule ? () => showRawData('Dados do Módulo', selectedModule) : undefined}
                        />

                        <InfoItem
                            title="Código do Módulo"
                            value={selectedModule?.code || 'N/A'}
                            icon="code-outline"
                        />
                    </Card>

                    {/* Configurações de Conexão */}
                    <Card variant="outlined" style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="server-outline" size={20} color={Colors.primary} />
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                Servidor & Conexão
                            </Text>
                        </View>

                        <InfoItem
                            title="Servidor REST"
                            value={storageData.connection?.baseUrl || 'Não configurado'}
                            icon="globe-outline"
                            onPress={() => showRawData('Configuração de Conexão', storageData.connection)}
                        />

                        <InfoItem
                            title="Status da Conexão"
                            value={storageData.connection?.isConnected ? 'Conectado' : 'Desconectado'}
                            icon="wifi-outline"
                            variant={storageData.connection?.isConnected ? 'success' : 'error'}
                        />

                        <InfoItem
                            title="Protocolo"
                            value={storageData.connection?.protocol || 'N/A'}
                            icon="shield-outline"
                        />

                        <InfoItem
                            title="Porta"
                            value={storageData.connection?.port || 'Padrão'}
                            icon="settings-outline"
                        />
                    </Card>

                    {/* Usuários Salvos */}
                    {storageData.savedUsers && storageData.savedUsers.length > 0 && (
                        <Card variant="outlined" style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="people-outline" size={20} color={Colors.primary} />
                                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                    Usuários Salvos ({storageData.savedUsers.length})
                                </Text>
                            </View>

                            {storageData.savedUsers.map((savedUser, index) => (
                                <InfoItem
                                    key={index}
                                    title={`Usuário ${index + 1}`}
                                    value={savedUser.username}
                                    icon="person-outline"
                                    onPress={() => showRawData(`Usuário Salvo: ${savedUser.username}`, savedUser)}
                                />
                            ))}
                        </Card>
                    )}

                    {/* Informações do Sistema */}
                    <Card variant="outlined" style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                Sistema & Aplicativo
                            </Text>
                        </View>

                        <InfoItem
                            title="Versão do App"
                            value="1.0.0"
                            icon="phone-portrait-outline"
                        />

                        <InfoItem
                            title="Tema Atual"
                            value={isDark ? 'Escuro' : 'Claro'}
                            icon="color-palette-outline"
                        />

                        <InfoItem
                            title="Dados do Sistema"
                            value="Toque para ver detalhes"
                            icon="cog-outline"
                            onPress={() => showRawData('Informações do Sistema', storageData.systemInfo)}
                        />
                    </Card>

                    {/* Actions */}
                    <Card variant="outlined" style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="settings-outline" size={20} color={Colors.primary} />
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                Ações de Desenvolvedor
                            </Text>
                        </View>

                        <InfoItem
                            title="Ver Usuário Atual (Raw)"
                            value="Dados técnicos do storage"
                            icon="code-slash-outline"
                            onPress={() => showRawData('Usuário Atual (Raw)', storageData.currentUser)}
                        />

                        <InfoItem
                            title="Ver Todos os Dados"
                            value="Dump completo do storage"
                            icon="document-text-outline"
                            onPress={() => showRawData('Todos os Dados do Storage', storageData)}
                        />

                        <InfoItem
                            title="Refresh Dados"
                            value="Recarregar do storage"
                            icon="refresh-outline"
                            onPress={handleRefresh}
                        />
                    </Card>

                    {/* Footer Spacer */}
                    <View style={styles.footerSpacer} />
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
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },

    // Profile Card
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
        marginBottom: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
    },

    // Sections
    section: {
        padding: 16,
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },

    // Info Items
    infoItem: {
        marginBottom: 12,
    },
    infoContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
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

    footerSpacer: {
        height: 32,
    },
});