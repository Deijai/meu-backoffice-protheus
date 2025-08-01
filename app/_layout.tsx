// app/_layout.tsx - ATUALIZADO COM PERSISTÊNCIA
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { PersistenceProvider } from '../src/components/providers/PersistenceProvider';
import { Toast } from '../src/components/ui/Toast';
import { useToastStore } from '../src/store/toastStore';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
    const { visible, message, type, hideToast } = useToastStore();

    return (
        <PersistenceProvider>
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
        </PersistenceProvider>
    );
}

export default function RootLayout() {
    const [loaded] = useFonts({
        PoppinsRegular: require("../assets/fonts/Poppins-Regular.ttf"),
        PoppinsBold: require("../assets/fonts/Poppins-Bold.ttf"),
    });

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    return <RootLayoutNav />;
}