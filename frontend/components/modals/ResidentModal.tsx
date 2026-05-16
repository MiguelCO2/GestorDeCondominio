import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, useState, useEffect } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Switch,
} from 'react-native';

import { colors, fontWeight, radius } from '../../constants/theme';
import { Btn } from '../ui/Btn';
import type { Resident } from '../../data/types';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  visible: boolean;
  onClose: () => void;
  initialData?: Resident | null;
  onSubmit?: (payload: any) => void;
}

// Wrapper de campo: label + input.
function Field({ label, children }: { label: string; children: React.ReactNode }) {
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

export function ResidentModal({ visible, onClose, initialData, onSubmit }: Props) {
  const isEdit = !!initialData;

  // Campos para propietario / crear
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ownerStartDate, setOwnerStartDate] = useState('');

  // Cuota mensual
  const [monthlyFee, setMonthlyFee] = useState('');

  // Campos para inquilino
  const [hasTenant, setHasTenant] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantStartDate, setTenantStartDate] = useState('');

  useEffect(() => {
    if (visible && initialData) {
      setName(initialData.owner?.full_name || initialData.name || '');
      setUnit(initialData.unit_number || initialData.unit || '');
      setPhone(initialData.owner?.phone || initialData.phone || '');
      setEmail(initialData.owner?.email || initialData.email || '');
      setOwnerStartDate(initialData.owner_start_date || '');
      setMonthlyFee(initialData.monthly_fee ? String(initialData.monthly_fee) : '');
      
      if (initialData.tenant && initialData.tenant.email) {
        setHasTenant(true);
        setTenantName(initialData.tenant.full_name || '');
        setTenantPhone(initialData.tenant.phone || '');
        setTenantEmail(initialData.tenant.email || '');
        setTenantStartDate(initialData.tenant_start_date || '');
      } else {
        setHasTenant(false);
        setTenantName('');
        setTenantPhone('');
        setTenantEmail('');
        setTenantStartDate('');
      }
    } else if (visible && !initialData) {
      // Reset
      setName('');
      setUnit('');
      setPhone('');
      setEmail('');
      setOwnerStartDate('');
      setMonthlyFee('');
      setHasTenant(false);
      setTenantName('');
      setTenantPhone('');
      setTenantEmail('');
      setTenantStartDate('');
    }
  }, [visible, initialData]);

  const handleSubmit = () => {
    if (!name.trim() || (!isEdit && !unit.trim())) {
      Alert.alert('Faltan datos', 'Nombre y unidad son obligatorios.');
      return;
    }
    
    const payload: any = {
      unit_number: isEdit ? (initialData?.unit_number || initialData?.unit) : unit.trim(),
      monthly_fee: monthlyFee ? parseFloat(monthlyFee) : null,
      owner_start_date: ownerStartDate.trim() || null,
      tenant_start_date: hasTenant ? (tenantStartDate.trim() || null) : null,
      owner: {
        full_name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      },
    };

    if (hasTenant) {
      if (!tenantName.trim() || !tenantEmail.trim()) {
        Alert.alert('Faltan datos', 'Nombre y correo del inquilino son obligatorios.');
        return;
      }
      payload.tenant = {
        full_name: tenantName.trim(),
        email: tenantEmail.trim(),
        phone: tenantPhone.trim(),
      };
    } else {
      payload.tenant = null;
    }

    onSubmit?.(payload);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>{isEdit ? 'Editar residente' : 'Nuevo residente'}</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={17} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            
            <Text style={styles.sectionTitle}>{isEdit ? 'Datos del Propietario' : 'Datos Principales'}</Text>

            <Field label={isEdit ? 'Nombres del residente' : 'Nombre completo'}>
              <IconInput
                icon="person-outline"
                value={name}
                onChangeText={setName}
                placeholder="Ej. María Fernández"
                autoCapitalize="words"
              />
            </Field>

            {!isEdit && (
              <Field label="Unidad / Propiedad">
                <IconInput
                  icon="business-outline"
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="Ej. Torre A · 12-B"
                />
              </Field>
            )}

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

            <Field label="Teléfono">
              <IconInput
                icon="call-outline"
                value={phone}
                onChangeText={setPhone}
                placeholder="+58 414 0000000"
                keyboardType="phone-pad"
              />
            </Field>

            {isEdit && (
              <>
                <Field label="Fecha desde cuando está el residente (YYYY-MM-DD)">
                  <IconInput
                    icon="calendar-outline"
                    value={ownerStartDate}
                    onChangeText={setOwnerStartDate}
                    placeholder="Ej. 2024-01-15"
                  />
                </Field>

                {!hasTenant && (
                  <Field label="Monto mensual a pagar en el condominio ($)">
                    <IconInput
                      icon="cash-outline"
                      value={monthlyFee}
                      onChangeText={setMonthlyFee}
                      placeholder="Ej. 50.00"
                      keyboardType="phone-pad"
                    />
                  </Field>
                )}

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Opción de asignar inquilino</Text>
                  <Switch
                    value={hasTenant}
                    onValueChange={setHasTenant}
                    trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
                  />
                </View>

                {hasTenant && (
                  <View style={styles.tenantSection}>
                    <Text style={styles.sectionTitle}>Datos del Inquilino</Text>
                    
                    <Field label="Nombres">
                      <IconInput
                        icon="person-outline"
                        value={tenantName}
                        onChangeText={setTenantName}
                        placeholder="Nombre del inquilino"
                        autoCapitalize="words"
                      />
                    </Field>

                    <Field label="Correo">
                      <IconInput
                        icon="mail-outline"
                        value={tenantEmail}
                        onChangeText={setTenantEmail}
                        placeholder="inquilino@mail.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </Field>

                    <Field label="Teléfono">
                      <IconInput
                        icon="call-outline"
                        value={tenantPhone}
                        onChangeText={setTenantPhone}
                        placeholder="+58 412 0000000"
                        keyboardType="phone-pad"
                      />
                    </Field>

                    <Field label="Monto mensual a pagar de condominio ($)">
                      <IconInput
                        icon="cash-outline"
                        value={monthlyFee}
                        onChangeText={setMonthlyFee}
                        placeholder="Ej. 50.00"
                        keyboardType="phone-pad"
                      />
                    </Field>
                    
                    <Field label="Fecha desde cuando está el inquilino (YYYY-MM-DD)">
                      <IconInput
                        icon="calendar-outline"
                        value={tenantStartDate}
                        onChangeText={setTenantStartDate}
                        placeholder="Ej. 2024-05-01"
                      />
                    </Field>
                  </View>
                )}
              </>
            )}

          </ScrollView>

          <View style={styles.footer}>
            <Btn variant="secondary" full onPress={onClose}>
              Cancelar
            </Btn>
            <Btn variant="primary" full icon="checkmark" onPress={handleSubmit}>
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
    maxHeight: '90%',
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: 4,
    marginBottom: 12,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSubtle,
    marginVertical: 12,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  tenantSection: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
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
