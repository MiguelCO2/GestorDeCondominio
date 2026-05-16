import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors, fontWeight, radius, shadow } from "../../constants/theme";
import { Btn } from "../ui/Btn";

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" = eliminar / acción destructiva */
  confirmVariant?: "primary" | "danger";
  confirmLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmVariant = "primary",
  confirmLoading = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.wrap}>
        <Pressable style={styles.backdropFill} onPress={onCancel} />
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Btn
              variant="secondary"
              full
              onPress={onCancel}
              disabled={confirmLoading}
            >
              {cancelLabel}
            </Btn>
            <Btn
              variant={confirmVariant === "danger" ? "danger" : "primary"}
              full
              onPress={onConfirm}
              loading={confirmLoading}
            >
              {confirmLabel}
            </Btn>
          </View>
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
  actions: {
    flexDirection: "row",
    gap: 10,
  },
});
