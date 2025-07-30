import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useAuthStore } from '../../../src/store/authStore';
import { useThemeStore } from '../../../src/store/themeStore';
import { Colors } from '../../../src/styles/colors';

export default function TabLayout() {
    const { theme } = useThemeStore();
    const { selectedModule } = useAuthStore();

    // Configurar tabs baseado no módulo selecionado
    const getTabsForModule = () => {
        const commonTabs = [
            {
                name: 'home',
                title: 'Início',
                icon: 'home-outline',
                iconFocused: 'home',
            },
            {
                name: 'reports',
                title: 'Relatórios',
                icon: 'document-text-outline',
                iconFocused: 'document-text',
            },
            {
                name: 'settings',
                title: 'Configurações',
                icon: 'settings-outline',
                iconFocused: 'settings',
            },
            {
                name: 'profile',
                title: 'Perfil',
                icon: 'person-outline',
                iconFocused: 'person',
            },
        ];

        // Adicionar tabs específicos baseado no módulo
        if (selectedModule?.code === 'SIGAFAT') {
            return [
                ...commonTabs.slice(0, 2),
                {
                    name: 'sales',
                    title: 'Vendas',
                    icon: 'card-outline',
                    iconFocused: 'card',
                },
                ...commonTabs.slice(2),
            ];
        }

        if (selectedModule?.code === 'SIGAEST') {
            return [
                ...commonTabs.slice(0, 2),
                {
                    name: 'inventory',
                    title: 'Estoque',
                    icon: 'cube-outline',
                    iconFocused: 'cube',
                },
                ...commonTabs.slice(2),
            ];
        }

        return commonTabs;
    };

    const tabs = getTabsForModule();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: theme.colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: theme.colors.card,
                    borderTopColor: theme.colors.border,
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: 64,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
            }}
        >
            {tabs.map((tab) => (
                <Tabs.Screen
                    key={tab.name}
                    name={tab.name}
                    options={{
                        title: tab.title,
                        tabBarIcon: ({ focused, color }) => (
                            <Ionicons
                                name={(focused ? tab.iconFocused : tab.icon) as any}
                                size={24}
                                color={color}
                            />
                        ),
                    }}
                />
            ))}
        </Tabs>
    );
}