import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuthStore } from '../../../src/store/authStore';
import { useThemeStore } from '../../../src/store/themeStore';

export default function TabLayout() {
    const { theme } = useThemeStore();
    const { selectedModule } = useAuthStore();
    const router = useRouter();
    const segments = useSegments();

    /**
     * Verifica se uma tab deve ser visível baseado no módulo selecionado
     */
    const shouldShowTab = (tabName: string): boolean => {
        const moduleCode = (selectedModule?.code || '').toUpperCase();

        switch (tabName) {
            case 'home':
                return true; // Sempre visível

            case 'approvals':
                return moduleCode === 'SIGACOM'; // Apenas para módulo de Compras

            case 'reports':
                return true; // Sempre visível

            case 'settings':
                return true; // Sempre visível

            case 'profile':
                return true; // Sempre visível

            default:
                return false;
        }
    };

    /**
     * Obtém as configurações do ícone para cada tab
     */
    const getTabIcon = (tabName: string, focused: boolean) => {
        const iconMap = {
            home: focused ? 'home' : 'home-outline',
            approvals: focused ? 'checkmark-circle' : 'checkmark-circle-outline',
            reports: focused ? 'document-text' : 'document-text-outline',
            settings: focused ? 'settings' : 'settings-outline',
            profile: focused ? 'person' : 'person-outline',
        };

        return iconMap[tabName as keyof typeof iconMap] || 'help-outline';
    };

    /**
     * Obtém o título de cada tab
     */
    const getTabTitle = (tabName: string): string => {
        const titleMap = {
            home: 'Início',
            approvals: 'Aprovações',
            reports: 'Relatórios',
            settings: 'Configurações',
            profile: 'Perfil',
        };

        return titleMap[tabName as keyof typeof titleMap] || tabName;
    };

    /**
     * Redireciona se a rota atual não for válida para o módulo
     */
    useEffect(() => {
        const currentRoute = segments[segments.length - 1];

        // Se a rota atual não deve ser mostrada para o módulo atual
        if (currentRoute && !shouldShowTab(currentRoute)) {
            router.replace('/home');
        }
    }, [selectedModule]);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.placeholder,
                tabBarStyle: {
                    backgroundColor: theme.colors.background,
                    borderTopColor: theme.colors.border,
                    borderTopWidth: 1,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
            }}
        >
            {/* Tab Home - Sempre visível */}
            <Tabs.Screen
                name="home"
                options={{
                    title: getTabTitle('home'),
                    href: shouldShowTab('home') ? undefined : null,
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={getTabIcon('home', focused) as any}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />

            {/* Tab Aprovações - Apenas para SIGACOM */}
            <Tabs.Screen
                name="approvals"
                options={{
                    title: getTabTitle('approvals'),
                    href: shouldShowTab('approvals') ? undefined : null,
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={getTabIcon('approvals', focused) as any}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />

            {/* Tab Relatórios - Sempre visível */}
            <Tabs.Screen
                name="reports"
                options={{
                    title: getTabTitle('reports'),
                    href: shouldShowTab('reports') ? undefined : null,
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={getTabIcon('reports', focused) as any}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />

            {/* Tab Configurações - Sempre visível */}
            <Tabs.Screen
                name="settings"
                options={{
                    title: getTabTitle('settings'),
                    href: shouldShowTab('settings') ? undefined : null,
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={getTabIcon('settings', focused) as any}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />

            {/* Tab Perfil - Sempre visível */}
            <Tabs.Screen
                name="profile"
                options={{
                    title: getTabTitle('profile'),
                    href: shouldShowTab('profile') ? undefined : null,
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={getTabIcon('profile', focused) as any}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}