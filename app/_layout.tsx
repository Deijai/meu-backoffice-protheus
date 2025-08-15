// app/_layout.tsx - CORRIGIDO COM INICIALIZAÇÃO i18next
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// CORRIGIDO: Importar configuração do i18n (não apenas os resources)
// Este import inicializa o i18next
import '../src/i18n';

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
    const {
        initializeLanguage,
        isInitialized: isI18nInitialized,
        isI18nextReady
    } = useI18nStore();

    const [loaded] = useFonts({
        PoppinsRegular: require("../assets/fonts/Poppins-Regular.ttf"),
        PoppinsBold: require("../assets/fonts/Poppins-Bold.ttf"),
    });

    useEffect(() => {
        // Inicializar sistema de idiomas
        const init = async () => {
            try {
                await initializeLanguage();
            } catch (error) {
                console.error('❌ Erro crítico na inicialização do i18n:', error);
            }
        };

        init();
    }, []);

    useEffect(() => {
        // Só esconder splash quando fontes E i18n estiverem carregados
        if (loaded && isI18nInitialized && isI18nextReady) {
            SplashScreen.hideAsync();
        }
    }, [loaded, isI18nInitialized, isI18nextReady]);

    // Aguardar carregamento de fontes E i18n
    if (!loaded || !isI18nInitialized || !isI18nextReady) {
        return null;
    }

    return <RootLayoutNav />;
}