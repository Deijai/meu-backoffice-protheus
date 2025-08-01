// src/components/providers/PersistenceProvider.tsx - Provider para inicializar persistência
import React, { useEffect } from 'react';
import { useAuthPersistence } from '../../hooks/useAuthPersistence';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface PersistenceProviderProps {
    children: React.ReactNode;
}

export const PersistenceProvider: React.FC<PersistenceProviderProps> = ({ children }) => {
    const { isLoadingPersistence, persistenceLoaded, initializePersistence } = useAuthPersistence();

    useEffect(() => {
        // Inicializar persistência quando o componente montar
        initializePersistence();
    }, []);

    // Mostrar loading enquanto carrega a persistência
    if (isLoadingPersistence || !persistenceLoaded) {
        return (
            <LoadingSpinner
                overlay
                text="Inicializando aplicativo..."
                transparent={false}
            />
        );
    }

    return <>{children}</>;
};