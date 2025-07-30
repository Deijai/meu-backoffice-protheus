import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ThemeProvider } from '../src/providers/ThemeProvider';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
            <Stack.Screen name="+not-found" />
        </Stack>
    );
}

export default function RootLayout() {
    const [loaded] = useFonts({
        // Adicione fontes customizadas aqui se necessário
    });

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    return (
        <ThemeProvider>
            <RootLayoutNav />
        </ThemeProvider>
    );
}