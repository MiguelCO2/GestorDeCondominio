import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors, radius, shadow } from '../../constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  onPress?: () => void;
  icon?: IconName;
}

export function FAB({ onPress, icon = 'add' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        shadow.fab,
        { opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <Ionicons name={icon} size={26} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    right: 20,
    bottom: 92,
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
});
