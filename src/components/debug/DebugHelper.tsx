// src/components/debug/DebugHelper.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { authService } from '../../services/api/authService';
import { useAuthStore } from '../../store/authStore';
import { useConfigStore } from '../../store/configStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../styles/colors';

interface DebugHelperProps {
    position?: 'top-right' | 'bottom-right' | 'bottom-left';
    showInProduction?: boolean;
}

export const DebugHelper: React.FC<DebugHelperProps> = ({
    position = 'bottom-right',
    showInProduction = false,
}) => {
    const { theme } = useThemeStore();
    const { isAuthenticated, user } = useAuthStore();
    const { connection } = useConfigStore();
    const [isExpanded, setIsExpanded] = useState(false);

    // Só mostra em desenvolvimento, a menos que explicitamente permitido
    if (!__DEV__ && !showInProduction) {
        return null;
    }

    const getPositionStyle = () => {
        const baseStyle = {
            position: 'absolute' as const,
            zIndex: 9999,
        };

        switch (position) {
            case 'top-right':
                return { ...baseStyle, top: 60, right: 16 };
            case 'bottom-left':
                return { ...baseStyle, bottom: 100, left: 16 };
            case 'bottom-right':
            default:
                return { ...baseStyle, bottom: 100, right: 16 };
        }
    };

    const handleQuickAction = (action: string) => {
        switch (action) {
            case 'debug':
                router.push('/(auth)/debug');
                break;
            case 'setup':
                router.push('/(auth)/setup');
                break;
            case 'login':
                router.push('/(auth)/login');
                break;
            case 'logout':
                Alert.alert(
                    'Logout Debug',
                    'Fazer logout para testar fluxo de auth?',
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                            text: 'Logout',
                            style: 'destructive',
                            onPress: async () => {
                                await authService.signOut();
                                router.replace('/(auth)');
                            },
                        },
                    ]
                );
                break;
            case 'info':
                Alert.alert(
                    'Debug Info',
                    `Auth: ${isAuthenticated ? '✅' : '❌'}\n` +
                    `User: ${user?.username || 'None'}\n` +
                    `REST: ${connection.isConnected ? '✅' : '❌'}\n` +
                    `URL: ${connection.baseUrl || 'Not set'}\n` +
                    `Platform: ${Platform.OS}`,
                    [{ text: 'OK' }]
                );
                break;
        }
        setIsExpanded(false);
    };

    if (!isExpanded) {
        return (
            <View style={[styles.container, getPositionStyle()]}>
                <TouchableOpacity
                    style={[styles.mainButton, { backgroundColor: Colors.primary }]}
                    onPress={() => setIsExpanded(true)}
                >
                    <Ionicons name="bug" size={20} color="#ffffff" />
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, getPositionStyle()]}>
            <View style={[styles.expandedContainer, { backgroundColor: theme.colors.card }]}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        🧪 Debug
                    </Text>
                    <TouchableOpacity
                        onPress={() => setIsExpanded(false)}
                        style={styles.closeButton}
                    >
                        <Ionicons name="close" size={16} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.status}>
                    <View style={styles.statusItem}>
                        <Ionicons
                            name={isAuthenticated ? 'checkmark-circle' : 'close-circle'}
                            size={14}
                            color={isAuthenticated ? '#22c55e' : '#ef4444'}
                        />
                        <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
                            Auth: {isAuthenticated ? user?.username : 'No'}
                        </Text>
                    </View>

                    <View style={styles.statusItem}>
                        <Ionicons
                            name={connection.isConnected ? 'checkmark-circle' : 'close-circle'}
                            size={14}
                            color={connection.isConnected ? '#22c55e' : '#ef4444'}
                        />
                        <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
                            REST: {connection.isConnected ? 'OK' : 'No'}
                        </Text>
                    </View>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: Colors.primary }]}
                        onPress={() => handleQuickAction('debug')}
                    >
                        <Ionicons name="flask" size={14} color="#ffffff" />
                        <Text style={styles.actionText}>Test</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#6b7280' }]}
                        onPress={() => handleQuickAction('setup')}
                    >
                        <Ionicons name="settings" size={14} color="#ffffff" />
                        <Text style={styles.actionText}>Setup</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#059669' }]}
                        onPress={() => handleQuickAction('login')}
                    >
                        <Ionicons name="log-in" size={14} color="#ffffff" />
                        <Text style={styles.actionText}>Login</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#dc2626' }]}
                        onPress={() => handleQuickAction('logout')}
                    >
                        <Ionicons name="log-out" size={14} color="#ffffff" />
                        <Text style={styles.actionText}>Logout</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#7c3aed' }]}
                        onPress={() => handleQuickAction('info')}
                    >
                        <Ionicons name="information" size={14} color="#ffffff" />
                        <Text style={styles.actionText}>Info</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'flex-end',
    },
    mainButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    expandedContainer: {
        borderRadius: 12,
        padding: 12,
        minWidth: 200,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
    },
    closeButton: {
        padding: 4,
    },
    status: {
        marginBottom: 12,
        gap: 4,
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '500',
    },
    actions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    actionText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#ffffff',
    },
});

// Componente de uso mais simples - apenas o botão principal
export const SimpleDebugButton: React.FC<{
    onPress?: () => void;
    position?: 'top-right' | 'bottom-right' | 'bottom-left';
}> = ({
    onPress = () => router.push('/(auth)/debug'),
    position = 'bottom-right'
}) => {
        if (!__DEV__) return null;

        const getPositionStyle = () => {
            const baseStyle = {
                position: 'absolute' as const,
                zIndex: 9999,
            };

            switch (position) {
                case 'top-right':
                    return { ...baseStyle, top: 60, right: 16 };
                case 'bottom-left':
                    return { ...baseStyle, bottom: 100, left: 16 };
                case 'bottom-right':
                default:
                    return { ...baseStyle, bottom: 100, right: 16 };
            }
        };

        return (
            <TouchableOpacity
                style={[
                    {
                        width: 48,
                        height: 48,
                        backgroundColor: Colors.primary,
                        borderRadius: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                        elevation: 4,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 4,
                    },
                    getPositionStyle(),
                ]}
                onPress={onPress}
            >
                <Ionicons name="bug" size={20} color="#ffffff" />
            </TouchableOpacity>
        );
    };