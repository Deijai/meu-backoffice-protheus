import { router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';

export default function AppLayout() {
    const { isAuthenticated } = useAuthStore();
    const { theme } = useThemeStore();

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/(auth)/login');
        }
    }, [isAuthenticated]);

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.colors.background },
            }}
        >
            <Stack.Screen name="branch-selection" />
            <Stack.Screen name="module-selection" />
            <Stack.Screen name="(tabs)" />
        </Stack>
    );
}