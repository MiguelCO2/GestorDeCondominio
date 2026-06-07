import { Image, StyleSheet, Text, View } from 'react-native';
import { fontWeight } from '../../constants/theme';

interface Props {
  text: string;
  color?: string;
  size?: number;
  image?: string | null;
}

const withAlpha = (hex: string, alphaHex: string) => hex + alphaHex;

export function Avatar({ text, color = '#2563eb', size = 40, image }: Props) {
  if (image) {
    return (
      <Image
        source={{ uri: image }}
        style={[
          styles.box,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#e5e7eb',
          },
        ]}
      />
    );
  }

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
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});