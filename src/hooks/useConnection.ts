import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useConfigStore } from '../store/configStore';

export const useConnection = () => {
    const { connection, setConnection, testConnection } = useConfigStore();
    const { setLoading, setError } = useAppStore();
    const [isTestingConnection, setIsTestingConnection] = useState(false);

    const handleTestConnection = async (): Promise<boolean> => {
        setIsTestingConnection(true);
        setLoading(true);
        setError(null);

        try {
            const success = await testConnection();

            if (success) {
                setError(null);
            } else {
                setError('Falha ao conectar com o servidor. Verifique as configurações.');
            }

            return success;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            setError(`Erro na conexão: ${errorMessage}`);
            return false;
        } finally {
            setIsTestingConnection(false);
            setLoading(false);
        }
    };

    const updateConnection = (config: Partial<typeof connection>) => {
        setConnection(config);
    };

    const getConnectionUrl = (): string => {
        return `${connection.protocol.toLowerCase()}://${connection.address}:${connection.port}/${connection.environment}`;
    };

    return {
        connection,
        isTestingConnection,
        updateConnection,
        testConnection: handleTestConnection,
        getConnectionUrl,
    };
};