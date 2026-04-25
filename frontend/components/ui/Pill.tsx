import { StyleSheet, Text, View } from 'react-native';
import { Tone, fontWeight, radius, tones } from '../../constants/theme';

interface Props {
  children: React.ReactNode;
  tone?: Tone;
}

export function Pill({ children, tone = 'neutral' }: Props) {
  const t = tones[tone];
  return (
    <View style={[styles.box, { backgroundColor: t.bgStrong }]}>
      <Text style={[styles.text, { color: t.fgStrong }]} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  text: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.2,
  },
});
