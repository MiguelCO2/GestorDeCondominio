import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
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
import { DEMO_CREDENTIALS, useAuth } from '../hooks/useAuth';

export default function Login() {
  const { user, signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState(DEMO_CREDENTIALS.email);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.password);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Redirect href="/(tabs)" />;

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Completa correo y contraseña');
      return;
    }
    setError(null);
    setLoading(true);
    const ok = await signIn(email, password);
    setLoading(false);
    if (ok) router.replace('/(tabs)');
    else setError('Credenciales incorrectas');
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
            <Ionicons name="business" size={32} color="#fff" />
          </View>
          <Text style={styles.brand}>Condominio</Text>
          <Text style={styles.brandLight}>Los Robles</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Iniciar sesión</Text>
          <Text style={styles.hint}>
            Accede al panel de administración del condominio.
          </Text>

          <Text style={styles.label}>Correo electrónico</Text>
          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="admin@losrobles.com"
              placeholderTextColor={colors.textSubtle}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
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

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={{ marginTop: 18 }}>
            <Btn full loading={loading} onPress={handleSubmit}>
              Entrar
            </Btn>
          </View>

          <Pressable style={{ marginTop: 14, alignItems: 'center' }}>
            <Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text>
          </Pressable>
        </View>

        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>Demo · Universidad</Text>
          <Text style={styles.demoLine}>Correo: {DEMO_CREDENTIALS.email}</Text>
          <Text style={styles.demoLine}>Clave: {DEMO_CREDENTIALS.password}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surfaceSoft },
  scroll: {
    flexGrow: 1,
    padding: 22,
    paddingTop: 64,
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
  forgot: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  demoBox: {
    backgroundColor: '#eff6ff',
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  demoLine: {
    fontSize: 12.5,
    color: '#1e3a8a',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
