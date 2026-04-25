import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontWeight, radius } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'subtleDanger';
type Size = 'sm' | 'md' | 'lg';
type IconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  full?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

const variantStyles: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary:      { bg: colors.primary,     fg: '#fff',          border: 'transparent' },
  secondary:    { bg: colors.surfaceMuted, fg: colors.text,    border: 'transparent' },
  outline:      { bg: '#fff',             fg: colors.text,     border: colors.border },
  ghost:        { bg: 'transparent',      fg: colors.primary,  border: 'transparent' },
  danger:       { bg: '#dc2626',          fg: '#fff',          border: 'transparent' },
  subtleDanger: { bg: '#fef2f2',          fg: '#b91c1c',       border: 'transparent' },
};

const sizeStyles: Record<Size, { h: number; px: number; fs: number; r: number; ic: number }> = {
  sm: { h: 36, px: 14, fs: 13,   r: radius.xs, ic: 16 },
  md: { h: 46, px: 20, fs: 14.5, r: radius.md, ic: 18 },
  lg: { h: 52, px: 24, fs: 15,   r: radius.lg, ic: 19 },
};

export function Btn({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  full = false,
  loading = false,
  disabled = false,
}: Props) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height: s.h,
          paddingHorizontal: s.px,
          borderRadius: s.r,
          backgroundColor: v.bg,
          borderColor: v.border,
          width: full ? '100%' : undefined,
          opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={v.fg} />
        ) : (
          <>
            {icon && <Ionicons name={icon} size={s.ic} color={v.fg} />}
            <Text
              style={{
                color: v.fg,
                fontSize: s.fs,
                fontWeight: fontWeight.semibold,
                letterSpacing: -0.1,
              }}
            >
              {children}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 1,
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
