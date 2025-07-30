// app/(auth)/debug.tsx
import LoginTestScreen from '@/src/components/debug/LoginTestScreen';
import React from 'react';
import { Platform } from 'react-native';

// Só permite acesso em desenvolvimento
const isDevMode = __DEV__ || Platform.OS === 'web';

export default function DebugScreen() {
    // Em produção, poderia redirecionar ou mostrar 404
    if (!isDevMode) {
        return null;
    }

    return <LoginTestScreen />;
}