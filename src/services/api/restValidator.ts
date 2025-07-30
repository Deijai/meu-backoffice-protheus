interface RestValidationResult {
    success: boolean;
    url?: string;
    error?: string;
    statusCode?: number;
    data?: any
}

interface RestConfig {
    protocol: 'HTTP' | 'HTTPS';
    address: string;
    port?: string;
    endpoint: string;
}

export class RestValidatorService {
    private static instance: RestValidatorService;

    private constructor() { }

    static getInstance(): RestValidatorService {
        if (!RestValidatorService.instance) {
            RestValidatorService.instance = new RestValidatorService();
        }
        return RestValidatorService.instance;
    }

    /**
     * Constrói a URL completa do REST
     */
    buildRestUrl(config: RestConfig): string {
        const { protocol, address, port, endpoint } = config;
        const portPart = port ? `:${port}` : '';
        return `${protocol.toLowerCase()}://${address}${portPart}/${endpoint}`;
    }

    /**
     * Valida se a configuração REST está correta
     */
    validateConfig(config: RestConfig): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Validar endereço
        if (!config.address || config.address.trim() === '') {
            errors.push('Endereço é obrigatório');
        } else {
            // Validar formato do endereço (IP ou domínio)
            const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
            const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

            if (!ipRegex.test(config.address) && !domainRegex.test(config.address) && config.address !== 'localhost') {
                errors.push('Formato de endereço inválido');
            }
        }

        // Validar porta (se informada)
        if (config.port && config.port.trim() !== '') {
            const port = parseInt(config.port, 10);
            if (isNaN(port) || port < 1 || port > 65535) {
                errors.push('Porta deve estar entre 1 e 65535');
            }
        }

        // Validar endpoint
        if (!config.endpoint || config.endpoint.trim() === '') {
            errors.push('Endpoint é obrigatório');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Testa a conexão com o servidor REST
     * Espera status 401 para considerar como sucesso (servidor funcionando mas sem auth)
     */
    async testConnection(config: RestConfig, timeout = 10000): Promise<RestValidationResult> {
        const validation = this.validateConfig(config);

        if (!validation.valid) {
            return {
                success: false,
                error: validation.errors.join(', '),
            };
        }

        const url = this.buildRestUrl(config);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            clearTimeout(timeoutId);

            // Status 401 indica que o servidor REST está funcionando (mas precisa de auth)
            // Outros status de sucesso (200, 404, etc) também indicam servidor funcionando
            if (response.status === 401 || (response.status >= 200 && response.status < 500)) {
                return {
                    success: true,
                    url,
                    statusCode: response.status,
                };
            } else {
                return {
                    success: false,
                    url,
                    statusCode: response.status,
                    error: `Servidor retornou status ${response.status}`,
                };
            }
        } catch (error) {
            let errorMessage = 'Erro na conexão';

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    errorMessage = 'Timeout na conexão (mais de 10 segundos)';
                } else if (error.message.includes('fetch')) {
                    errorMessage = 'Não foi possível conectar ao servidor';
                } else {
                    errorMessage = error.message;
                }
            }

            return {
                success: false,
                url,
                error: errorMessage,
            };
        }
    }

    /**
     * Testa múltiplas URLs (com e sem porta padrão) para aumentar chance de sucesso
     */
    async testConnectionWithFallback(config: RestConfig): Promise<RestValidationResult> {
        // Primeiro teste: com a configuração exata do usuário
        let result = await this.testConnection(config);

        if (result.success) {
            return result;
        }

        // Se falhou e não tem porta específica, tenta portas comuns
        if (!config.port || config.port.trim() === '') {
            const commonPorts = ['8080', '8081', '8090', '9090', '3000'];

            for (const port of commonPorts) {
                const configWithPort = { ...config, port };
                result = await this.testConnection(configWithPort);

                if (result.success) {
                    return result;
                }
            }
        }

        // Se ainda falhou, tenta sem porta (porta padrão do protocolo)
        if (config.port) {
            const configWithoutPort = { ...config, port: '' };
            result = await this.testConnection(configWithoutPort);

            if (result.success) {
                return result;
            }
        }

        // Retorna o último erro
        return result;
    }
}

export const restValidator = RestValidatorService.getInstance();