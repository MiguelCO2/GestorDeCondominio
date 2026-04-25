import { StyleSheet, Text, View } from 'react-native';
import { fontWeight } from '../../constants/theme';

interface Props {
  text: string;
  color?: string;
  size?: number;
}

// Pequeño helper local: añade alpha hex (00–ff) a un color #rrggbb.
const withAlpha = (hex: string, alphaHex: string) => hex + alphaHex;

export function Avatar({ text, color = '#2563eb', size = 40 }: Props) {
  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: withAlpha(color, '1a'),
        },
      ]}
    >
      <Text
        style={{
          color,
          fontSize: Math.round(size * 0.36),
          fontWeight: fontWeight.bold,
          letterSpacing: -0.3,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
});
