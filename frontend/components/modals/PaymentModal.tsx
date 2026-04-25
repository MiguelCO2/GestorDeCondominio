import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, fontWeight, radius } from '../../constants/theme';
import type { PaymentMethod, PaymentType } from '../../data/types';
import { Btn } from '../ui/Btn';
import { Segmented } from '../ui/Segmented';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (payload: {
    type: PaymentType;
    amount: number;
    method: PaymentMethod;
    resident: string;
  }) => void;
}

// Pequeño wrapper para cada campo del formulario (label + input).
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export function PaymentModal({ visible, onClose, onSubmit }: Props) {
  const [type, setType] = useState<PaymentType>('Mensualidad');
  const [amount, setAmount] = useState('85.00');
  const [method, setMethod] = useState<PaymentMethod>('Transferencia');
  const [resident, setResident] = useState('');

  const handleSubmit = () => {
    const n = parseFloat(amount.replace(',', '.'));
    if (!resident.trim() || isNaN(n) || n <= 0) {
      Alert.alert('Faltan datos', 'Completa residente y un monto válido.');
      return;
    }
    onSubmit?.({ type, amount: n, method, resident: resident.trim() });
    // Reset para próxima apertura
    setResident('');
    setAmount('85.00');
    setType('Mensualidad');
    setMethod('Transferencia');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Registrar pago</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={17} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Field label="Residente">
              <TextInput
                value={resident}
                onChangeText={setResident}
                placeholder="Ej. María Fernández"
                placeholderTextColor={colors.textSubtle}
                style={styles.input}
              />
            </Field>

            <Field label="Tipo de pago">
              <Segmented<PaymentType>
                value={type}
                onChange={setType}
                options={[
                  { value: 'Mensualidad', label: 'Mensualidad' },
                  { value: 'Abono', label: 'Abono' },
                ]}
              />
            </Field>

            <Field label="Monto (Bs.)">
              <View style={styles.amountBox}>
                <Text style={styles.prefix}>Bs.</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textSubtle}
                  style={styles.amountInput}
                />
              </View>
            </Field>

            <Field label="Método de pago">
              <Segmented<PaymentMethod>
                value={method}
                onChange={setMethod}
                options={[
                  { value: 'Transferencia', label: 'Transferencia' },
                  { value: 'Pago Móvil', label: 'Pago móvil' },
                  { value: 'Efectivo', label: 'Efectivo' },
                ]}
              />
            </Field>
          </ScrollView>

          <View style={styles.footer}>
            <Btn variant="secondary" full onPress={onClose}>
              Cancelar
            </Btn>
            <Btn variant="primary" full icon="checkmark" onPress={handleSubmit}>
              Confirmar
            </Btn>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 24,
    maxHeight: '88%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  field: { marginBottom: 14 },
  label: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14.5,
    color: colors.text,
  },

  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  prefix: {
    fontSize: 14,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 14.5,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },

  footer: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 14,
    marginTop: 14,
  },
});
