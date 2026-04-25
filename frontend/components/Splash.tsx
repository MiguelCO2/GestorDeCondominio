import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, fontWeight } from '../constants/theme';

// Splash con branding del condominio. Se muestra mientras el AuthProvider
// está en `loading: true`. Fuerza el statusbar en modo claro porque el
// fondo oscuro pisa el `dark` global del root layout.
export function Splash() {
  return (
    <View style={styles.wrap}>
      <StatusBar style="light" />
      <View style={styles.logo}>
        <Ionicons name="business" size={44} color="#fff" />
      </View>
      <Text style={styles.brand}>Condominio</Text>
      <Text style={styles.brandLight}>Los Robles</Text>
      <ActivityIndicator color={colors.primary} style={{ marginTop: 28 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 86,
    height: 86,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  brand: {
    color: '#fff',
    fontSize: 28,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.6,
  },
  brandLight: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 22,
    fontWeight: fontWeight.light,
    letterSpacing: -0.5,
    marginTop: 2,
  },
});
