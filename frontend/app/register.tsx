import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { Btn } from '../components/ui/Btn';
import { colors, fontWeight, radius } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
    const router = useRouter();
    const { signUp } = useAuth();

    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [role] = useState('resident');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isValidEmail = (value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value.trim().toLowerCase());

    };

    const isValidUsername = (value: string) => {
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        const cleanUsername = value.trim();
      
        return (
          cleanUsername.length >= 3 &&
          cleanUsername.length <= 30 &&
          usernameRegex.test(cleanUsername)
        );
      };

    const isValidPhone = (value: string) => {
        const cleanPhone = value.replace(/\D/g, '');
        return cleanPhone.length >= 10 && cleanPhone.length <= 15;

    };

    const isValidPassword = (value: string) => {
        const hasUppercase = /[A-Z]/.test(value);
        const hasSpecialCharacter = /[^A-Za-z0-9]/.test(value);
      
        return value.length >= 6 && hasUppercase && hasSpecialCharacter;
      };

    const handleRegister = async () => {
        if (
            !fullName.trim() ||
            !username.trim() ||
            !email.trim() ||
            !password ||
            !passwordConfirm
        ) {
            setError('Completar todos los campos es obligatorio.');
            return;
        }

        if (!isValidEmail(email)) {
            setError('Ingresa un correo electrónico válido.');
            return;
        }

        if (!isValidUsername(username)) {
            setError(
              'El nombre de usuario debe tener entre 3 y 30 caracteres. Solo puede contener letras, números y guion bajo.');
            return;
        }
        
        const cleanPhone = phone.replace(/\D/g, '');

        if (cleanPhone.length < 10 || cleanPhone.length > 15) {
            setError('Ingresa un número de teléfono válido. Debe tener entre 10 y 15 dígitos.');
            return;
        }

        if (!isValidPassword(password)) {
            setError(
              'La contraseña debe tener al menos 6 caracteres, una mayúscula y un carácter especial.');
            return;
        }

        if (password !== passwordConfirm) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        try {
            setError(null);
            setLoading(true);

            const result = await signUp({
                full_name: fullName.trim(),
                username: username.trim(),
                phone: cleanPhone,
                email: email.trim().toLowerCase(),
                role,
                password,
                password_confirm: passwordConfirm,
              });
              
              if (result.ok) {
                router.replace({
                  pathname: '/verify-email',
                  params: {
                    email: result.email || email.trim().toLowerCase(),
                  },
                });
              } else {
                setError(result.message || 'No se pudo crear la cuenta. Verifica los datos.');
              }
        } catch (error) {
            console.log('Register screen error:', error);
            setError('Ocurrió un error al crear la cuenta.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAwareScrollView
            style={styles.flex}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            enableOnAndroid
            extraScrollHeight={70}
            extraHeight={210}
        >
            <View style={styles.brandWrap}>
                <View style={styles.logo}>
                    <Ionicons name="person-add-outline" size={32} color="#fff" />
                </View>
                <Text style={styles.brand}>Crear cuenta</Text>
                <Text style={styles.brandLight}>Condominio Los Robles</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.title}>Registro de usuario</Text>
                <Text style={styles.hint}>
                    Crea una cuenta para acceder a la aplicación.
                </Text>

                <Text style={styles.label}>Nombre completo</Text>
                <View style={styles.inputBox}>
                    <Ionicons name="person-outline" size={18} color={colors.textMuted} />
                    <TextInput
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Nombre completo"
                        placeholderTextColor={colors.textSubtle}
                        style={styles.input}
                    />
                </View>

                <Text style={styles.label}>Usuario</Text>
                <View style={styles.inputBox}>
                    <Ionicons name="at-outline" size={18} color={colors.textMuted} />
                    <TextInput
                        value={username}
                        onChangeText={setUsername}
                        placeholder="usuario01"
                        placeholderTextColor={colors.textSubtle}
                        autoCapitalize="none"
                        style={styles.input}
                    />
                </View>

                <Text style={styles.label}>Teléfono</Text>
                <View style={styles.inputBox}>
                    <Ionicons name="call-outline" size={18} color={colors.textMuted} />
                    <TextInput
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="04121234567"
                        placeholderTextColor={colors.textSubtle}
                        keyboardType="phone-pad"
                        style={styles.input}
                    />
                </View>

                <Text style={styles.label}>Correo electrónico</Text>
                <View style={styles.inputBox}>
                    <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="correo@ejemplo.com"
                        placeholderTextColor={colors.textSubtle}
                        autoCapitalize="none"
                        autoComplete="email"
                        style={styles.input}
                    />
                </View>

                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.inputBox}>
                    <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••••"
                        placeholderTextColor={colors.textSubtle}
                        secureTextEntry={!showPass}
                        autoCapitalize="none"
                        style={styles.input}
                    />
                    <Pressable onPress={() => setShowPass((v) => !v)} hitSlop={8}>
                        <Ionicons
                            name={showPass ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color={colors.textMuted}
                        />
                    </Pressable>
                </View>

                <Text style={styles.label}>Confirmar contraseña</Text>
                <View style={styles.inputBox}>
                    <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                    <TextInput
                        value={passwordConfirm}
                        onChangeText={setPasswordConfirm}
                        placeholder="••••••••"
                        placeholderTextColor={colors.textSubtle}
                        secureTextEntry={!showPass}
                        autoCapitalize="none"
                        style={styles.input}
                    />
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <View style={{ marginTop: 18 }}>
                    <Btn full loading={loading} onPress={handleRegister}>
                        Crear cuenta
                    </Btn>
                </View>

                <Pressable
                    style={{ marginTop: 14, alignItems: 'center' }}
                    onPress={() => router.replace('/login')}
                >
                    <Text style={styles.link}>Ya tengo cuenta</Text>
                </Pressable>
            </View>
        </KeyboardAwareScrollView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.surfaceSoft },
    scroll: {
        flexGrow: 1,
        padding: 22,
        paddingTop: 48,
        paddingBottom: 100,
        gap: 22,
    },
    brandWrap: { alignItems: 'center', marginBottom: 8 },
    logo: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    brand: {
        fontSize: 24,
        fontWeight: fontWeight.bold,
        color: colors.text,
        letterSpacing: -0.5,
    },
    brandLight: {
        fontSize: 20,
        fontWeight: fontWeight.light,
        color: colors.textMuted,
        letterSpacing: -0.4,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: radius['3xl'],
        padding: 22,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    title: {
        fontSize: 22,
        fontWeight: fontWeight.bold,
        color: colors.text,
        letterSpacing: -0.5,
    },
    hint: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 4,
        marginBottom: 18,
    },
    label: {
        fontSize: 12,
        fontWeight: fontWeight.semibold,
        color: colors.textSecondary,
        marginBottom: 6,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: colors.surfaceSoft,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 14,
        height: 48,
        marginBottom: 14,
    },
    input: {
        flex: 1,
        fontSize: 14.5,
        color: colors.text,
        fontWeight: fontWeight.medium,
        paddingVertical: 0,
    },
    error: {
        fontSize: 12,
        color: '#dc2626',
        fontWeight: fontWeight.semibold,
        marginTop: -4,
    },
    link: {
        fontSize: 13,
        color: colors.primary,
        fontWeight: fontWeight.semibold,
    },
});