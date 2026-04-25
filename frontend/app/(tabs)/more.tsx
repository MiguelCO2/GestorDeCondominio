import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBar } from '../../components/ui/AppBar';
import { Avatar } from '../../components/ui/Avatar';
import { Pill } from '../../components/ui/Pill';
import { SectionHead } from '../../components/ui/SectionHead';
import { colors, fontSize, fontWeight, radius, spacing } from '../../constants/theme';
import { DEBTORS } from '../../data/debtors';
import { useAuth } from '../../hooks/useAuth';

// Pantalla "Más": perfil del admin + accesos a las pantallas secundarias.
// Por ahora solo Morosos está implementado; las otras quedan como placeholder.
export default function More() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const items: {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    desc: string;
    color: string;
    badge?: string;
    onPress?: () => void;
  }[] = [
    {
      id: 'debtors',
      icon: 'alert-circle',
      label: 'Morosos',
      desc: `${DEBTORS.length} residentes pendientes`,
      color: '#dc2626',
      badge: String(DEBTORS.length),
      onPress: () => router.push('/debtors'),
    },
  ];

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.scrollerBottom }}>
        <AppBar title="Más" large />

        <View style={styles.profileWrap}>
          <View style={styles.profile}>
            <Avatar text={user?.initials ?? 'AV'} color={colors.primary} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user?.name ?? 'Andrea Vásquez'}</Text>
              <Text style={styles.role}>{user?.role ?? 'Administradora'}</Text>
              <View style={{ marginTop: 4 }}>
                <Pill tone="primary">Los Robles</Pill>
              </View>
            </View>
          </View>
        </View>

        <SectionHead title="Gestión" />
        <View style={{ paddingHorizontal: spacing.screen }}>
          {items.map((it) => (
            <Pressable key={it.id} onPress={it.onPress} style={styles.row}>
              <View style={[styles.iconBox, { backgroundColor: it.color + '15' }]}>
                <Ionicons name={it.icon} size={19} color={it.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{it.label}</Text>
                <Text style={styles.rowDesc}>{it.desc}</Text>
              </View>
              {it.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{it.badge}</Text>
                </View>
              ) : null}
              <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
            </Pressable>
          ))}
        </View>

        <SectionHead title="Configuración" />
        <View style={{ paddingHorizontal: spacing.screen }}>
          <Pressable onPress={signOut} style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="log-out-outline" size={17} color="#dc2626" />
            </View>
            <Text style={[styles.rowLabel, { color: '#dc2626' }]}>Cerrar sesión</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  profileWrap: { paddingHorizontal: spacing.screen, paddingBottom: 18 },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 16,
  },
  name: {
    fontSize: fontSize.section,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.2,
  },
  role: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    width: '100%',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: fontSize.card,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  rowDesc: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  badge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
});
