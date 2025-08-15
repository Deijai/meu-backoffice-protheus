// app/_layout.tsx - ATUALIZADO COM PERSISTÊNCIA E i18n
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// IMPORTANTE: Importar configuração do i18n ANTES de qualquer componente que use traduções
import '../src/i18n/resources';

import { PersistenceProvider } from '../src/components/providers/PersistenceProvider';
import { Toast } from '../src/components/ui/Toast';
import { useI18nStore } from '../src/store/i18nStore';
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
    const { initializeLanguage, isInitialized: isI18nInitialized } = useI18nStore();

    const [loaded] = useFonts({
        PoppinsRegular: require("../assets/fonts/Poppins-Regular.ttf"),
        PoppinsBold: require("../assets/fonts/Poppins-Bold.ttf"),
    });

    useEffect(() => {
        // Inicializar sistema de idiomas
        initializeLanguage();
    }, []);

    useEffect(() => {
        // Só esconder splash quando fontes E i18n estiverem carregados
        if (loaded && isI18nInitialized) {
            SplashScreen.hideAsync();
        }
    }, [loaded, isI18nInitialized]);

    // Aguardar carregamento de fontes E i18n
    if (!loaded || !isI18nInitialized) {
        return null;
    }

    return <RootLayoutNav />;
}