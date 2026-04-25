import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius } from '../../constants/theme';

type Tone = 'neutral' | 'primary';
type IconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  icon: IconName;
  onPress?: () => void;
  tone?: Tone;
  badge?: boolean;
}

const toneMap: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.surfaceMuted, fg: colors.text },
  primary: { bg: '#eff6ff',          fg: colors.primary },
};

export function IconBtn({ icon, onPress, tone = 'neutral', badge }: Props) {
  const t = toneMap[tone];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: t.bg, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Ionicons name={icon} size={19} color={t.fg} />
      {badge ? <View style={styles.badge} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc2626',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
