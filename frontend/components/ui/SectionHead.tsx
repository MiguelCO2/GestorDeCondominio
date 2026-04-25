import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, fontWeight, spacing } from '../../constants/theme';

interface Props {
  title: string;
  action?: string;
  onAction?: () => void;
  compact?: boolean;
}

export function SectionHead({ title, action, onAction, compact = false }: Props) {
  return (
    <View
      style={[
        styles.row,
        {
          paddingTop: compact ? spacing.sectionTopCompact : spacing.sectionTop,
          paddingBottom: compact ? 8 : spacing.sectionBottom,
        },
      ]}
    >
      <Text style={styles.title}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.screen,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: fontSize.section,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.2,
  },
  action: {
    fontSize: 13,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});
