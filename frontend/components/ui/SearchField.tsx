import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  onFilter?: () => void;
}

export function SearchField({
  value,
  onChangeText,
  placeholder = 'Buscar…',
  onFilter,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.box}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
        />
      </View>
      {onFilter ? (
        <Pressable onPress={onFilter} style={styles.filter}>
          <Ionicons name="options" size={18} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  box: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 42,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
  },
  filter: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
