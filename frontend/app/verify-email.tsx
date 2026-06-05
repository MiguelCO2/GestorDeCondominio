import { Ionicons } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { Btn } from '../components/ui/Btn';
import { colors, fontWeight, radius } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { user, verifyEmail, resendVerificationCode } = useAuth();

  const email = typeof params.email === 'string' ? params.email : '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleVerify = async () => {
    const cleanCode = code.replace(/\D/g, '');

    if (!email) {
      setError('No se encontró el correo a verificar.');
      return;
    }

    if (cleanCode.length !== 6) {
      setError('Ingresa el código de 6 dígitos.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const result = await verifyEmail({
        email,
        code: cleanCode,
      });

      if (result.ok) {
        router.replace('/(tabs)');
      } else {
        setError(result.message || 'No se pudo verificar el correo.');
      }
    } catch (err) {
      console.log('Verify email screen error:', err);
      setError('Ocurrió un error al verificar el correo.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('No se encontró el correo para reenviar el código.');
      return;
    }

    try {
      setResending(true);
      setError(null);
      setMessage(null);

      const result = await resendVerificationCode(email);

      if (result.ok) {
        setMessage(result.message || 'Te enviamos un nuevo código.');
      } else {
        setError(result.message || 'No se pudo reenviar el código.');
      }
    } catch (err) {
      console.log('Resend code screen error:', err);
      setError('Ocurrió un error al reenviar el código.');
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandWrap}>
          <View style={styles.logo}>
            <Ionicons name="mail-unread-outline" size={32} color="#fff" />
          </View>

          <Text style={styles.brand}>Verifica tu correo</Text>
          <Text style={styles.brandLight}>Condominio Los Robles</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Código de verificación</Text>

          <Text style={styles.hint}>
            Enviamos un código de 6 dígitos a:
          </Text>

          <Text style={styles.email}>{email || 'Correo no disponible'}</Text>

          <Text style={styles.label}>Código</Text>
          <View style={styles.inputBox}>
            <Ionicons name="keypad-outline" size={18} color={colors.textMuted} />
            <TextInput
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              placeholderTextColor={colors.textSubtle}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.input}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.success}>{message}</Text> : null}

          <View style={{ marginTop: 18 }}>
            <Btn full loading={loading} onPress={handleVerify}>
              Verificar correo
            </Btn>
          </View>

          <Pressable
            style={styles.resendButton}
            onPress={handleResend}
            disabled={resending}
          >
            <Ionicons name="refresh-outline" size={18} color={colors.primary} />
            <Text style={styles.resendText}>
              {resending ? 'Reenviando código...' : 'Reenviar código'}
            </Text>
          </Pressable>

          <Pressable
            style={{ marginTop: 16, alignItems: 'center' }}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.link}>Volver al inicio de sesión</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
  },
  scroll: {
    flexGrow: 1,
    padding: 22,
    paddingTop: 64,
    gap: 22,
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
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
    marginBottom: 8,
  },
  email: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    marginBottom: 20,
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
    height: 52,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    fontSize: 20,
    color: colors.text,
    fontWeight: fontWeight.bold,
    paddingVertical: 0,
    letterSpacing: 4,
  },
  error: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: fontWeight.semibold,
    marginTop: -4,
  },
  success: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: fontWeight.semibold,
    marginTop: -4,
  },
  resendButton: {
    marginTop: 16,
    height: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  resendText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  link: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
  },
});