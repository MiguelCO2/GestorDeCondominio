import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, useState } from 'react';
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
import { Btn } from '../ui/Btn';
import { Segmented } from '../ui/Segmented';

type ResidentKind = 'propietario' | 'inquilino';
type IconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (payload: {
    name: string;
    unit: string;
    phone: string;
    email: string;
    kind: ResidentKind;
  }) => void;
}

// Wrapper de campo: label + input.
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

// Input con icono a la izquierda.
function IconInput({
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
}: {
  icon: IconName;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'words' | 'sentences';
}) {
  return (
    <View style={styles.inputBox}>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={styles.input}
      />
    </View>
  );
}

export function ResidentModal({ visible, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [kind, setKind] = useState<ResidentKind>('propietario');

  const handleSubmit = () => {
    if (!name.trim() || !unit.trim()) {
      Alert.alert('Faltan datos', 'Nombre y unidad son obligatorios.');
      return;
    }
    // Validación trivial de email cuando se llena
    if (email.trim() && !email.includes('@')) {
      Alert.alert('Correo inválido', 'Revisa el formato del correo.');
      return;
    }
    onSubmit?.({
      name: name.trim(),
      unit: unit.trim(),
      phone: phone.trim(),
      email: email.trim(),
      kind,
    });
    // Reset
    setName('');
    setUnit('');
    setPhone('');
    setEmail('');
    setKind('propietario');
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
            <Text style={styles.title}>Nuevo residente</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={17} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Field label="Nombre completo">
              <IconInput
                icon="person-outline"
                value={name}
                onChangeText={setName}
                placeholder="Ej. María Fernández"
                autoCapitalize="words"
              />
            </Field>

            <Field label="Unidad / Propiedad">
              <IconInput
                icon="business-outline"
                value={unit}
                onChangeText={setUnit}
                placeholder="Ej. Torre A · 12-B"
              />
            </Field>

            <Field label="Teléfono">
              <IconInput
                icon="call-outline"
                value={phone}
                onChangeText={setPhone}
                placeholder="+58 414 0000000"
                keyboardType="phone-pad"
              />
            </Field>

            <Field label="Correo electrónico">
              <IconInput
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                placeholder="correo@mail.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Field>

            <Field label="Tipo de residente">
              <Segmented<ResidentKind>
                value={kind}
                onChange={setKind}
                options={[
                  { value: 'propietario', label: 'Propietario' },
                  { value: 'inquilino', label: 'Inquilino' },
                ]}
              />
            </Field>
          </ScrollView>

          <View style={styles.footer}>
            <Btn variant="secondary" full onPress={onClose}>
              Cancelar
            </Btn>
            <Btn
              variant="primary"
              full
              icon="person-add"
              onPress={handleSubmit}
            >
              Guardar
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

  label: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
  },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    color: colors.text,
    fontWeight: fontWeight.medium,
    paddingVertical: 0,
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
