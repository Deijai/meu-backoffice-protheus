import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useAuthStore } from '../../../src/store/authStore';
import { useThemeStore } from '../../../src/store/themeStore';
import { Colors } from '../../../src/styles/colors';

export default function TabLayout() {
    const { theme } = useThemeStore();
    const { selectedModule } = useAuthStore();

    // Por enquanto, vamos trabalhar apenas com o módulo de Compras
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

        // Adicionar tab de aprovações apenas para o módulo de Compras
        if (selectedModule?.code === 'SIGACOM') {
            return [
                commonTabs[0], // home
                {
                    name: 'approvals',
                    title: 'Aprovações',
                    icon: 'checkmark-circle-outline',
                    iconFocused: 'checkmark-circle',
                },
                ...commonTabs.slice(1), // reports, settings, profile
            ];
        }

        // Para outros módulos, mostrar apenas tabs comuns por enquanto
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
                    backgroundColor: theme.colors.surface,
                    borderTopColor: theme.colors.border,
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: 70,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                    marginTop: 4,
                },
                tabBarIconStyle: {
                    marginBottom: 4,
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
                                name={focused ? tab.iconFocused as any : tab.icon as any}
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