import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, fontWeight, radius, spacing } from '../../constants/theme';

interface Props {
  title: string;
  subtitle?: string;
  back?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  large?: boolean;
}

export function AppBar({ title, subtitle, back, onBack, right, large = false }: Props) {
  return (
    <View style={[styles.bar, large && styles.barLarge]}>
      <View style={styles.left}>
        {back && (
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <Text
            numberOfLines={1}
            style={[styles.title, large && styles.titleLarge]}
          >
            {title}
          </Text>
        </View>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: spacing.screen,
    paddingVertical: 14,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  barLarge: {
    paddingTop: 8,
    paddingBottom: 14,
    minHeight: 64,
    alignItems: 'flex-end',
  },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  title: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.4,
  },
  titleLarge: {
    fontSize: fontSize.hero,
    letterSpacing: -0.7,
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
