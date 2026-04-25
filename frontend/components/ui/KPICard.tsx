import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tone, fontWeight, radius, tones } from '../../constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  icon: IconName;
  label: string;
  value: string;
  sub?: string;
  tone?: Tone;
  onPress?: () => void;
}

// Mapeo de tono → color del icono. Reusamos `tones` pero queremos contraste
// fuerte en el icono.
const accents: Record<Tone, { card: string; iconBg: string; iconFg: string; text: string }> = {
  primary: { card: '#eff6ff', iconBg: '#dbeafe', iconFg: '#2563eb', text: '#1e3a8a' },
  info:    { card: '#f0f9ff', iconBg: '#e0f2fe', iconFg: '#0284c7', text: '#0c4a6e' },
  success: { card: '#f0fdf4', iconBg: '#dcfce7', iconFg: '#16a34a', text: '#14532d' },
  warning: { card: '#fffbeb', iconBg: '#fef3c7', iconFg: '#a16207', text: '#713f12' },
  danger:  { card: '#fef2f2', iconBg: '#fee2e2', iconFg: '#dc2626', text: '#7f1d1d' },
  expense: { card: '#fff7ed', iconBg: '#ffedd5', iconFg: '#ea580c', text: '#7c2d12' },
  neutral: { card: '#f8fafc', iconBg: '#eef2ff', iconFg: '#2563eb', text: '#0f172a' },
};

export function KPICard({ icon, label, value, sub, tone = 'neutral', onPress }: Props) {
  const a = accents[tone];
  const Wrapper: React.ComponentType<any> = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      style={[styles.card, { backgroundColor: a.card }]}
    >
      <View style={[styles.iconBox, { backgroundColor: a.iconBg }]}>
        <Ionicons name={icon} size={18} color={a.iconFg} />
      </View>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <Text style={[styles.value, { color: a.text }]}>{value}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </Wrapper>
  );
}

// Toques requieren al menos 16px de gap interno y aspecto cuadrado-ish.
const styles = StyleSheet.create({
  card: {
    borderRadius: radius['2xl'],
    padding: 14,
    paddingTop: 16,
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: 'rgba(15,23,42,0.55)',
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 22,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
    marginTop: -4,
  },
  sub: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: 'rgba(15,23,42,0.5)',
  },
});
