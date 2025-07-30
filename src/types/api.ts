export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface ConnectionConfig {
    protocol: 'HTTP' | 'HTTPS';
    address: string;
    port: string;
    environment: string;
}