import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

interface BiometricResult {
    success: boolean;
    error?: string;
    biometryType?: string;
}

interface BiometricCapabilities {
    isAvailable: boolean;
    isEnrolled: boolean;
    supportedTypes: LocalAuthentication.AuthenticationType[];
    securityLevel: LocalAuthentication.SecurityLevel;
}

export class BiometricService {
    private static instance: BiometricService;

    private constructor() { }

    static getInstance(): BiometricService {
        if (!BiometricService.instance) {
            BiometricService.instance = new BiometricService();
        }
        return BiometricService.instance;
    }

    async getCapabilities(): Promise<BiometricCapabilities> {
        try {
            const [isAvailable, isEnrolled, supportedTypes, securityLevel] = await Promise.all([
                LocalAuthentication.hasHardwareAsync(),
                LocalAuthentication.isEnrolledAsync(),
                LocalAuthentication.supportedAuthenticationTypesAsync(),
                LocalAuthentication.getEnrolledLevelAsync(),
            ]);

            return {
                isAvailable,
                isEnrolled,
                supportedTypes,
                securityLevel,
            };
        } catch (error) {
            console.error('Erro ao obter capacidades biométricas:', error);
            return {
                isAvailable: false,
                isEnrolled: false,
                supportedTypes: [],
                securityLevel: LocalAuthentication.SecurityLevel.NONE,
            };
        }
    }

    async authenticate(options?: {
        promptMessage?: string;
        subtitle?: string;
        fallbackLabel?: string;
        cancelLabel?: string;
        disableDeviceFallback?: boolean;
    }): Promise<BiometricResult> {
        try {
            const capabilities = await this.getCapabilities();

            if (!capabilities.isAvailable) {
                return {
                    success: false,
                    error: 'Autenticação biométrica não está disponível neste dispositivo',
                };
            }

            if (!capabilities.isEnrolled) {
                return {
                    success: false,
                    error: 'Nenhuma biometria cadastrada no dispositivo',
                };
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: options?.promptMessage || 'Autentique-se para continuar',
                // subtitle: options?.subtitle || 'Use sua biometria para acessar o aplicativo',
                fallbackLabel: options?.fallbackLabel || 'Usar senha',
                cancelLabel: options?.cancelLabel || 'Cancelar',
                disableDeviceFallback: options?.disableDeviceFallback || false,
            });

            if (result.success) {
                return {
                    success: true,
                    biometryType: this.getBiometryTypeName(capabilities.supportedTypes),
                };
            } else {
                return {
                    success: false,
                    error: result.error || 'Autenticação cancelada ou falhou',
                };
            }
        } catch (error) {
            console.error('Erro na autenticação biométrica:', error);
            return {
                success: false,
                error: 'Erro inesperado na autenticação biométrica',
            };
        }
    }

    getBiometryTypeName(supportedTypes: LocalAuthentication.AuthenticationType[]): string {
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            return Platform.OS === 'ios' ? 'Face ID' : 'Reconhecimento Facial';
        }

        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            return Platform.OS === 'ios' ? 'Touch ID' : 'Impressão Digital';
        }

        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
            return 'Reconhecimento de Íris';
        }

        return 'Biometria';
    }

    async canUseBiometrics(): Promise<boolean> {
        const capabilities = await this.getCapabilities();
        return capabilities.isAvailable && capabilities.isEnrolled;
    }

    async requestPermissions(): Promise<boolean> {
        try {
            // No Android, as permissões são solicitadas automaticamente
            // No iOS, não é necessário solicitar permissões para biometria
            return true;
        } catch (error) {
            console.error('Erro ao solicitar permissões:', error);
            return false;
        }
    }
}

export const biometricService = BiometricService.getInstance();