import * as LocalAuthentication from 'expo-local-authentication';

export async function canUseBiometrics() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    return hasHardware && isEnrolled;
}

export async function authenticateWithBiometrics() {
    const available = await canUseBiometrics();

    if (!available) {
        return {
            success: false,
            error: 'La biometría no está disponible o no está configurada en este dispositivo.',
        };
    }

    const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verifica tu identidad',
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar contraseña',
        disableDeviceFallback: false,
    });

    if (result.success) {
        return {
            success: true,
            error: null,
        };
    }

    return {
        success: false,
        error: 'No se pudo verificar la identidad.',
    };
}