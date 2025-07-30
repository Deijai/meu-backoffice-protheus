import { useState } from 'react';
import { useConfigStore } from '../store/configStore';
import { useToastStore } from '../store/toastStore';

export const useRestValidation = () => {
    const {
        connection,
        setConnection,
        testConnection,
        isTestingConnection,
        canProceedToLogin
    } = useConfigStore();

    const { showSuccess, showError } = useToastStore();

    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const updateConnectionConfig = (field: keyof typeof connection, value: string) => {
        setConnection({ [field]: value });
        // Limpar erros quando o usuário modifica algo
        setValidationErrors([]);
    };

    const validateAndTestConnection = async (): Promise<boolean> => {
        // Validação básica antes de testar
        const errors: string[] = [];

        if (!connection.address.trim()) {
            errors.push('Endereço é obrigatório');
        }

        if (!connection.endpoint.trim()) {
            errors.push('Endpoint é obrigatório');
        }

        if (errors.length > 0) {
            setValidationErrors(errors);
            showError(errors.join(', '));
            return false;
        }

        // Testar conexão
        try {
            const result = await testConnection();

            if (result.success) {
                showSuccess('Conexão estabelecida com sucesso! ✅');
                setValidationErrors([]);
                return true;
            } else {
                const errorMessage = result.error || 'Falha na conexão com o servidor';
                showError(`❌ ${errorMessage}`);
                setValidationErrors([errorMessage]);
                return false;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro inesperado';
            showError(`❌ ${errorMessage}`);
            setValidationErrors([errorMessage]);
            return false;
        }
    };

    const getConnectionUrl = (): string => {
        if (connection.baseUrl) {
            return connection.baseUrl;
        }

        const portPart = connection.port ? `:${connection.port}` : '';
        return `${connection.protocol.toLowerCase()}://${connection.address}${portPart}/${connection.endpoint}`;
    };

    const isFormValid = (): boolean => {
        return !!(connection.address.trim() && connection.endpoint.trim());
    };

    return {
        connection,
        isTestingConnection,
        validationErrors,
        canProceedToLogin: canProceedToLogin(),
        updateConnectionConfig,
        validateAndTestConnection,
        getConnectionUrl,
        isFormValid,
    };
};