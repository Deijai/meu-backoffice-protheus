import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Toast } from '../src/components/ui/Toast';
import { ThemeProvider } from '../src/providers/ThemeProvider';
import { useToastStore } from '../src/store/toastStore';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
    const { visible, message, type, hideToast } = useToastStore();

    return (
        <>
            <Stack
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(app)" />
                <Stack.Screen name="+not-found" />
            </Stack>

            {/* Toast Global */}
            <Toast
                visible={visible}
                message={message}
                type={type}
                onHide={hideToast}
            />
        </>
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