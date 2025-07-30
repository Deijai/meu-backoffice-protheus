// src/hooks/useRestValidation.ts - VERSÃO OAUTH2 PROTHEUS COM AXIOS
import axios from 'axios';
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

    const { showSuccess, showError, showInfo } = useToastStore();

    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const updateConnectionConfig = (field: keyof typeof connection, value: string) => {
        console.log(`🔧 Atualizando ${field}:`, value);
        setConnection({ [field]: value });
        // Limpar erros quando o usuário modifica algo
        setValidationErrors([]);
    };

    const validateAndTestConnection = async (): Promise<boolean> => {
        console.log('🧪 Iniciando validação e teste OAuth2...');

        // Validação básica antes de testar
        const errors: string[] = [];

        if (!connection.address.trim()) {
            errors.push('Endereço é obrigatório');
        }

        if (!connection.endpoint.trim()) {
            errors.push('Endpoint é obrigatório');
        }

        if (errors.length > 0) {
            console.log('❌ Erros de validação:', errors);
            setValidationErrors(errors);
            showError(`❌ ${errors.join(', ')}`);
            return false;
        }

        console.log('✅ Validação básica passou');

        // Mostrar progresso
        showInfo('🔄 Testando conexão OAuth2...');

        try {
            const result = await testConnection();

            if (result.success) {
                console.log('✅ Teste de conexão OAuth2 bem-sucedido!');
                console.log('📊 Dados do servidor:', result.data);

                // Mensagem detalhada de sucesso
                const serverUrl = result.data?.url || connection.address;
                const statusInfo = result.data?.status ? ` (Status: ${result.data.status})` : '';

                showSuccess(`✅ Servidor OAuth2 Protheus conectado!${statusInfo}\n🔗 ${serverUrl}`);
                setValidationErrors([]);
                return true;
            } else {
                const errorMessage = result.error || 'Falha na conexão OAuth2';
                console.log('❌ Falha no teste:', errorMessage);

                // Dar dicas baseadas no tipo de erro
                let friendlyMessage = errorMessage;

                if (errorMessage.includes('timeout')) {
                    friendlyMessage = '⏱️ Timeout - Servidor demorou para responder\n💡 Verifique se o endereço e porta estão corretos';
                } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network Error')) {
                    friendlyMessage = '🌐 Erro de conexão\n💡 Verifique se o servidor está ligado e acessível';
                } else if (errorMessage.includes('ECONNREFUSED')) {
                    friendlyMessage = '🚫 Conexão recusada\n💡 Verifique se a porta está correta (geralmente 17114 para Protheus)';
                }

                showError(`❌ ${friendlyMessage}`);
                setValidationErrors([errorMessage]);
                return false;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro inesperado na validação OAuth2';
            console.error('❌ Erro durante validação:', error);

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
        const fullUrl = `${connection.protocol.toLowerCase()}://${connection.address}${portPart}/${connection.endpoint}`;

        console.log('🔗 URL construída:', fullUrl);
        return fullUrl;
    };

    const getOAuthUrl = (): string => {
        const baseUrl = getConnectionUrl();
        return `${baseUrl}/api/oauth2/v1/token?grant_type=password`;
    };

    const isFormValid = (): boolean => {
        const valid = !!(connection.address.trim() && connection.endpoint.trim());
        console.log('📝 Formulário válido:', valid, {
            address: !!connection.address.trim(),
            endpoint: !!connection.endpoint.trim(),
        });
        return valid;
    };

    const getConnectionSummary = () => {
        return {
            url: getConnectionUrl(),
            oauthUrl: getOAuthUrl(),
            protocol: connection.protocol,
            address: connection.address,
            port: connection.port || 'Padrão',
            endpoint: connection.endpoint,
            isValid: connection.isValid,
            isConnected: connection.isConnected,
            lastTest: connection.lastConnectionTest,
        };
    };

    // Método para testar credenciais específicas (útil para debug) com axios
    const testCredentials = async (username: string, password: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }> => {
        if (!canProceedToLogin()) {
            return { success: false, error: 'Conexão não configurada' };
        }

        console.log('🧪 Testando credenciais OAuth2 com axios:', username);

        const oauthUrl = getOAuthUrl();

        try {
            const response = await axios.post(oauthUrl, {}, {
                headers: {
                    'Content-Type': 'application/json',
                    'username': username,
                    'password': password,
                },
                timeout: 10000,
                validateStatus: (status) => status < 500, // Aceitar qualquer status < 500
            });

            if (response.status === 200 && response.data?.access_token) {
                console.log('✅ Credenciais válidas');
                return { success: true, data: response.data };
            } else {
                console.log('❌ Credenciais inválidas:', response.status);
                return {
                    success: false,
                    error: response.data?.error || `Status ${response.status}`
                };
            }

        } catch (error: any) {
            console.error('❌ Erro no teste de credenciais:', error);

            let errorMessage = 'Erro na requisição';

            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Timeout na requisição';
            } else if (error.response) {
                errorMessage = error.response.data?.error || `Status ${error.response.status}`;
            } else if (error.request) {
                errorMessage = 'Não foi possível conectar ao servidor';
            } else {
                errorMessage = error.message || 'Erro desconhecido';
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    };

    return {
        connection,
        isTestingConnection,
        validationErrors,
        canProceedToLogin: canProceedToLogin(),
        updateConnectionConfig,
        validateAndTestConnection,
        getConnectionUrl,
        getOAuthUrl,
        isFormValid,
        getConnectionSummary,
        testCredentials,
    };
};