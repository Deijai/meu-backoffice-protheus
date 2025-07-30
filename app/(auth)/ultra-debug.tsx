// app/(auth)/ultra-debug.tsx
import UltraDebugScreen from '@/src/components/debug/UltraDebugScreen';
import React from 'react';

export default function UltraDebugRoute() {
    // Só permite acesso em desenvolvimento
    if (!__DEV__) {
        return null;
    }

    return <UltraDebugScreen />;
}