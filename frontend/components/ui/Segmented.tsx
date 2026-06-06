import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { colors, fontWeight, radius, shadow } from '../../constants/theme';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
}

export function Segmented<T extends string>({ value, onChange, options }: Props<T>) {
  return (
    <View style={styles.wrap}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              style={[styles.opt, active && styles.optActive, active && shadow.segmented]}
            >
              <Text 
                numberOfLines={1} 
                style={[styles.label, { color: active ? colors.text : colors.textMuted }]}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: 3,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 2,
    flexGrow: 1,
  },
  opt: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optActive: {
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    letterSpacing: -0.1,
    textAlign: 'center',
  },
});
