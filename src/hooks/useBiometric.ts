import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

interface BiometricState {
    isAvailable: boolean;
    isEnrolled: boolean;
    supportedTypes: LocalAuthentication.AuthenticationType[];
}

export const useBiometric = () => {
    const [biometricState, setBiometricState] = useState<BiometricState>({
        isAvailable: false,
        isEnrolled: false,
        supportedTypes: [],
    });

    useEffect(() => {
        checkBiometricAvailability();
    }, []);

    const checkBiometricAvailability = async () => {
        try {
            const isAvailable = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

            setBiometricState({
                isAvailable,
                isEnrolled,
                supportedTypes,
            });
        } catch (error) {
            console.error('Erro ao verificar biometria:', error);
        }
    };

    const authenticate = async (): Promise<boolean> => {
        try {
            if (!biometricState.isAvailable || !biometricState.isEnrolled) {
                Alert.alert(
                    'Biometria não disponível',
                    'Autenticação biométrica não está configurada neste dispositivo.'
                );
                return false;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Autentique-se para continuar',
                //subtitle: 'Use sua biometria para acessar o aplicativo',
                fallbackLabel: 'Usar senha',
                cancelLabel: 'Cancelar',
            });

            return result.success;
        } catch (error) {
            console.error('Erro na autenticação biométrica:', error);
            return false;
        }
    };

    const getBiometricTypeName = (): string => {
        if (biometricState.supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            return 'Face ID';
        }
        if (biometricState.supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            return 'Touch ID';
        }
        if (biometricState.supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
            return 'Íris';
        }
        return 'Biometria';
    };

    return {
        ...biometricState,
        authenticate,
        getBiometricTypeName,
        checkBiometricAvailability,
    };
};