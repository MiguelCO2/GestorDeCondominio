import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors, fontWeight, radius, shadow, tones } from "../../constants/theme";
import { Btn } from "../ui/Btn";

interface Props {
  visible: boolean;
  title: string;
  message: string;
  variant?: "success" | "error";
  /** Si no se indica, depende de `variant` */
  emoji?: string;
  buttonLabel?: string;
  onDismiss: () => void;
}

export function NoticeDialog({
  visible,
  title,
  message,
  variant = "success",
  emoji,
  buttonLabel = "Entendido",
  onDismiss,
}: Props) {
  const resolvedEmoji =
    emoji ?? (variant === "error" ? "⚠️" : "✅");
  const tone = variant === "error" ? tones.danger : tones.success;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.wrap}>
        <Pressable style={styles.backdropFill} onPress={onDismiss} />
        <View style={styles.card}>
          <View style={[styles.badge, { backgroundColor: tone.bgStrong }]}>
            <Text style={styles.badgeEmoji}>{resolvedEmoji}</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Btn variant="primary" full onPress={onDismiss}>
            {buttonLabel}
          </Btn>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.5)",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 22,
    paddingHorizontal: 22,
    width: "100%",
    maxWidth: 340,
    ...shadow.card,
  },
  badge: {
    alignSelf: "flex-start",
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  badgeEmoji: {
    fontSize: 26,
    lineHeight: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.25,
    marginBottom: 8,
  },
  message: {
    fontSize: 14.5,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: 20,
  },
});
