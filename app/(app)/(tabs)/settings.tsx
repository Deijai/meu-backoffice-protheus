// app/(app)/(tabs)/settings.tsx - CORREÇÃO SIMPLES DO ERRO DE NULL
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeArea } from '../../../src/components/layout/SafeArea';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { useAuthStore } from '../../../src/store/authStore';
import { useConfigStore } from '../../../src/store/configStore';
import { useThemeStore } from '../../../src/store/themeStore';
import { useToastStore } from '../../../src/store/toastStore';
import { Colors } from '../../../src/styles/colors';

export default function SettingsScreen() {
    const { theme, isDark, toggleTheme } = useThemeStore();
    const { biometricEnabled, logout, selectedBranch, selectedModule, setBranch, setModule } = useAuthStore();
    const { resetConfig } = useConfigStore();
    const { showSuccess, showInfo, showWarning } = useToastStore();

    const handleResetApp = () => {
        Alert.alert(
            'Resetar Aplicativo',
            'Esta ação irá limpar todas as configurações e dados salvos. Deseja continuar?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Resetar',
                    style: 'destructive',
                    onPress: () => {
                        resetConfig();
                        logout();
                        router.replace('/(auth)/onboarding');
                    },
                },
            ]
        );
    };

    const handleChangeBranch = () => {
        // Não limpar nada, apenas navegar
        Alert.alert(
            'Trocar de Filial',
            'Você será redirecionado para selecionar uma nova filial e módulo. Deseja continuar?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Continuar',
                    onPress: () => {
                        showInfo('🏢 Redirecionando para seleção de filial...');
                        setTimeout(() => {
                            router.navigate('/(app)/branch-selection');
                        }, 1000);
                    },
                },
            ]
        );
    };

    const handleChangeModule = () => {
        // Não limpar nada, apenas navegar
        Alert.alert(
            'Trocar de Módulo',
            'Você será redirecionado para selecionar um novo módulo. Deseja continuar?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Continuar',
                    onPress: () => {
                        showInfo('🔧 Redirecionando para seleção de módulo...');
                        setTimeout(() => {
                            router.navigate('/(app)/module-selection');
                        }, 1000);
                    },
                },
            ]
        );
    };

    const SettingItem = ({
        icon,
        title,
        subtitle,
        onPress,
        rightElement,
        variant = 'default'
    }: {
        icon: string;
        title: string;
        subtitle?: string;
        onPress?: () => void;
        rightElement?: React.ReactNode;
        variant?: 'default' | 'danger';
    }) => (
        <TouchableOpacity
            onPress={onPress}
            style={styles.settingItem}
            disabled={!onPress}
        >
            <View style={styles.settingContent}>
                <View style={styles.settingLeft}>
                    <View style={[
                        styles.settingIcon,
                        { backgroundColor: variant === 'danger' ? theme.colors.error : Colors.primary }
                    ]}>
                        <Ionicons
                            name={icon as any}
                            size={20}
                            color="#ffffff"
                        />
                    </View>
                    <View style={styles.settingText}>
                        <Text style={[
                            styles.settingTitle,
                            {
                                color: variant === 'danger' ? theme.colors.error : theme.colors.text
                            }
                        ]}>
                            {title}
                        </Text>
                        {subtitle && (
                            <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                                {subtitle}
                            </Text>
                        )}
                    </View>
                </View>

                {rightElement || (
                    onPress && (
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={theme.colors.textSecondary}
                        />
                    )
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeArea>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        Configurações
                    </Text>
                </View>

                <ScrollView style={styles.content}>
                    {/* Aparência */}
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Aparência
                        </Text>

                        <SettingItem
                            icon="moon-outline"
                            title="Tema escuro"
                            subtitle="Alterar entre tema claro e escuro"
                            rightElement={
                                <Switch
                                    value={isDark}
                                    onValueChange={toggleTheme}
                                    trackColor={{ false: theme.colors.border, true: Colors.primary }}
                                    thumbColor="#ffffff"
                                />
                            }
                        />
                    </Card>

                    {/* Segurança */}
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Segurança
                        </Text>

                        <SettingItem
                            icon="finger-print-outline"
                            title="Autenticação biométrica"
                            subtitle={biometricEnabled ? 'Ativada' : 'Desativada'}
                            onPress={() => {
                                showWarning('⚠️ Configuração de biometria em desenvolvimento');
                            }}
                        />

                        <SettingItem
                            icon="key-outline"
                            title="Alterar senha"
                            subtitle="Alterar senha de acesso"
                            onPress={() => {
                                showWarning('⚠️ Alteração de senha em desenvolvimento');
                            }}
                        />
                    </Card>

                    {/* Conexão */}
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Conexão
                        </Text>

                        <SettingItem
                            icon="server-outline"
                            title="Configuração do servidor"
                            subtitle="Alterar configurações de conexão"
                            onPress={() => {
                                router.push('/(auth)/setup');
                            }}
                        />

                        <SettingItem
                            icon="sync-outline"
                            title="Sincronização"
                            subtitle="Configurar sincronização automática"
                            onPress={() => {
                                showWarning('⚠️ Configurações de sincronização em desenvolvimento');
                            }}
                        />
                    </Card>

                    {/* Filial e Módulo - CORREÇÃO SIMPLES */}
                    <Card variant="outlined" style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="business-outline" size={20} color={Colors.primary} />
                            <Text style={[styles.sectionTitleWithIcon, { color: theme.colors.text }]}>
                                Filial e Módulo
                            </Text>
                        </View>

                        {/* Info Atual - APENAS ADICIONANDO ? PARA EVITAR ERRO */}
                        <View style={[styles.currentContext, { backgroundColor: `${Colors.primary}10` }]}>
                            <View style={styles.contextRow}>
                                <View style={styles.contextItem}>
                                    <Ionicons name="location-outline" size={16} color={Colors.primary} />
                                    <Text style={[styles.contextLabel, { color: theme.colors.textSecondary }]}>
                                        Filial Atual:
                                    </Text>
                                </View>
                                <Text style={[styles.contextValue, { color: theme.colors.text }]}>
                                    {selectedBranch?.name || 'Nenhuma selecionada'}
                                </Text>
                            </View>

                            {selectedBranch?.code && (
                                <View style={styles.contextRow}>
                                    <View style={styles.contextItem}>
                                        <Ionicons name="barcode-outline" size={16} color={Colors.primary} />
                                        <Text style={[styles.contextLabel, { color: theme.colors.textSecondary }]}>
                                            Código:
                                        </Text>
                                    </View>
                                    <Text style={[styles.contextValue, { color: theme.colors.text }]}>
                                        {selectedBranch.code}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.contextRow}>
                                <View style={styles.contextItem}>
                                    <Ionicons name="apps-outline" size={16} color={Colors.primary} />
                                    <Text style={[styles.contextLabel, { color: theme.colors.textSecondary }]}>
                                        Módulo Atual:
                                    </Text>
                                </View>
                                <Text style={[styles.contextValue, { color: theme.colors.text }]}>
                                    {selectedModule?.name || 'Nenhum selecionado'}
                                </Text>
                            </View>

                            {selectedModule?.code && (
                                <View style={styles.contextRow}>
                                    <View style={styles.contextItem}>
                                        <Ionicons name="code-outline" size={16} color={Colors.primary} />
                                        <Text style={[styles.contextLabel, { color: theme.colors.textSecondary }]}>
                                            Código:
                                        </Text>
                                    </View>
                                    <Text style={[styles.contextValue, { color: theme.colors.text }]}>
                                        {selectedModule.code}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Ações */}
                        <SettingItem
                            icon="business-outline"
                            title="Trocar de filial"
                            subtitle="Selecionar uma nova filial e módulo"
                            onPress={handleChangeBranch}
                        />

                        {selectedBranch && (
                            <SettingItem
                                icon="apps-outline"
                                title="Trocar apenas o módulo"
                                subtitle="Manter a filial atual e escolher novo módulo"
                                onPress={handleChangeModule}
                            />
                        )}
                    </Card>

                    {/* Sobre */}
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Sobre
                        </Text>

                        <SettingItem
                            icon="information-circle-outline"
                            title="Versão do aplicativo"
                            subtitle="1.0.0"
                        />

                        <SettingItem
                            icon="help-circle-outline"
                            title="Ajuda e suporte"
                            subtitle="Central de ajuda e contato"
                            onPress={() => {
                                showWarning('⚠️ Central de ajuda em desenvolvimento');
                            }}
                        />
                    </Card>

                    {/* Ações */}
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Ações
                        </Text>

                        <SettingItem
                            icon="refresh-outline"
                            title="Resetar aplicativo"
                            subtitle="Limpar todos os dados e configurações"
                            variant="danger"
                            onPress={handleResetApp}
                        />
                    </Card>

                    <View style={styles.footer}>
                        <Button
                            title="Sair da conta"
                            variant="outline"
                            onPress={logout}
                            leftIcon={<Ionicons name="log-out-outline" size={20} color={Colors.primary} />}
                        />
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
        marginBottom: 16,
    },
    sectionTitleWithIcon: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    settingItem: {
        paddingVertical: 12,
    },
    settingContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    settingText: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 14,
    },
    currentContext: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    contextRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    contextItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    contextLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 6,
    },
    contextValue: {
        fontSize: 14,
        fontWeight: '600',
        maxWidth: '60%',
        textAlign: 'right',
    },
    footer: {
        paddingVertical: 24,
    },
});