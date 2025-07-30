import { Stack } from 'expo-router';
import { useThemeStore } from '../../src/store/themeStore';

export default function AuthLayout() {
    const { theme } = useThemeStore();

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.colors.background },
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="setup" />
            <Stack.Screen name="login" />
        </Stack>
    );
}