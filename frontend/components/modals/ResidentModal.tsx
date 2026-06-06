import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native';

import { colors, fontWeight, radius } from '../../constants/theme';
import type { Resident } from '../../data/types';
import { api, API_BASE_URL } from '../../services/api';
import { Btn } from '../ui/Btn';

const TOWERS = ['Torre A-1', 'Torre B-1', 'Torre C-1', 'Torre C-2', 'Torre D-1', 'Torre E-1'];
const FLOORS = ['1', '2', '3'];

const getAptsForTowerAndFloor = (tower: string, floor: string) => {
  if (tower === 'Torre C-1') {
    if (floor === '1') return ['Apto. 1-D', 'Apto. 2-D', 'Apto. 3-D', 'Apto. 4-D', 'Apto. 5-D'];
    if (floor === '2') return ['Apto. 1-E', 'Apto. 2-E', 'Apto. 3-E', 'Apto. 4-E', 'Apto. 5-E'];
    if (floor === '3') return ['Apto. 1-F', 'Apto. 2-F', 'Apto. 3-F', 'Apto. 4-F', 'Apto. 5-F'];
  } else {
    if (floor === '1') return ['Apto. 1-A', 'Apto. 2-A', 'Apto. 3-A', 'Apto. 4-A', 'Apto. 5-A'];
    if (floor === '2') return ['Apto. 1-B', 'Apto. 2-B', 'Apto. 3-B', 'Apto. 4-B', 'Apto. 5-B'];
    if (floor === '3') return ['Apto. 1-C', 'Apto. 2-C', 'Apto. 3-C', 'Apto. 4-C', 'Apto. 5-C'];
  }
  return [];
};

type IconName = ComponentProps<typeof Ionicons>['name'];

type UserSuggestion = {
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  profile_image?: string | null;
  document_id?: string;
};

function getMediaUrl(path?: string | null) {
  if (!path) return null;

  if (path.startsWith('http')) {
    return path;
  }

  const baseUrl = API_BASE_URL.replace('/api', '');

  return `${baseUrl}${path}`;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  initialData?: Resident | null;
  existingResidents?: Resident[];
  onSubmit?: (payload: any) => void;
  submitting?: boolean;
}

function SelectableRow({ options, selected, onSelect, disabledOptions = [] }: { options: string[], selected: string, onSelect: (val: string) => void, disabledOptions?: string[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
      {options.map(opt => {
        const isDisabled = disabledOptions.includes(opt);
        return (
          <Pressable 
            key={opt}
            onPress={() => !isDisabled && onSelect(opt)}
            style={[styles.pill, selected === opt && styles.pillActive, isDisabled && styles.pillDisabled]}
          >
            <Text style={[styles.pillText, selected === opt && styles.pillTextActive, isDisabled && styles.pillTextDisabled]}>{opt}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
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

export function ResidentModal({ visible, onClose, initialData, existingResidents = [], onSubmit, submitting = false }: Props) {
  const isEdit = !!initialData;

  // Ubicación
  const [tower, setTower] = useState('');
  const [floor, setFloor] = useState('');
  const [unit, setUnit] = useState('');

  // Campos para propietario / crear
  const [name, setName] = useState('');
  const [cedula, setCedula] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Cuota mensual
  const [monthlyFee, setMonthlyFee] = useState('');

  // Campos para inquilino
  const [hasTenant, setHasTenant] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [tenantCedula, setTenantCedula] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');

  useEffect(() => {
    if (visible && initialData) {
      setName(initialData.owner?.full_name || initialData.name || '');
      // Extraemos la cédula del owner_profile o document_id si viene en el API
      setCedula(initialData.owner?.document_id || '');
      setPhone(initialData.owner?.phone || initialData.phone || '');
      setEmail(initialData.owner?.email || initialData.email || '');
      setUsername(initialData.owner?.username || '');
      setSelectedUserId(initialData.owner?.id || null);
      setMonthlyFee(initialData.monthly_fee ? String(initialData.monthly_fee) : '');
      
      setTower(initialData.building || '');
      setFloor(initialData.floor || '');
      setUnit(initialData.unit_number || initialData.unit || '');
      
      if (initialData.tenant && initialData.tenant.email) {
        setHasTenant(true);
        setTenantName(initialData.tenant.full_name || '');
        setTenantCedula(initialData.tenant.document_id || '');
        setTenantPhone(initialData.tenant.phone || '');
        setTenantEmail(initialData.tenant.email || '');
      } else {
        setHasTenant(false);
        setTenantName('');
        setTenantCedula('');
        setTenantPhone('');
        setTenantEmail('');
      }
    } else if (visible && !initialData) {
      // Reset
      setName('');
      setCedula('');
      setTower('');
      setFloor('');
      setUnit('');
      setPhone('');
      setEmail('');
      setUsername('');
      setSelectedUserId(null);
      setSuggestions([]);
      setShowSuggestions(false);
      setMonthlyFee('');
      setHasTenant(false);
      setTenantName('');
      setTenantCedula('');
      setTenantPhone('');
      setTenantEmail('');
    }
  }, [visible, initialData]);

  const handleCedulaChange = (text: string, setter: (val: string) => void) => {
    // Permitir letras V, E, J, P, números, puntos y guiones
    const filtered = text.replace(/[^vVeEjJpP0-9.\-]/g, '').toUpperCase();
    setter(filtered);
  };

  const handleNumberChange = (text: string, setter: (val: string) => void) => {
    // Solo números enteros
    const filtered = text.replace(/[^0-9]/g, '');
    setter(filtered);
  };

  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      isSubmittingRef.current = false;
    }
  }, [visible]);

  const handleSelectUser = (user: UserSuggestion) => {
    setSelectedUserId(user.id);
    setName(user.full_name || '');
    setUsername(user.username || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setCedula(user.document_id || '');
    setShowSuggestions(false);
  };

  useEffect(() => {
    if (!visible || isEdit) return;
  
    const cleanQuery = name.trim();
  
    if (cleanQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
  
    const timeout = setTimeout(async () => {
      try {
        setSuggestionsLoading(true);
  
        const res = await api.get('/auth/users/suggestions/', {
          params: {
            q: cleanQuery,
          },
        });
  
        setSuggestions(res.data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.log('User suggestions error:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);
  
    return () => clearTimeout(timeout);
  }, [name, visible, isEdit]);

  const handleSubmit = () => {
    if (isSubmittingRef.current || submitting) return;
    
    if (!name.trim() || (!isEdit && !unit.trim())) {
      Alert.alert('Faltan datos', 'Nombre y unidad son obligatorios.');
      return;
    }
    
    if (!isEdit && !selectedUserId) {
      Alert.alert(
        'Usuario no seleccionado',
        'Debes seleccionar un usuario registrado de la lista de sugerencias. Si escribiste los datos manualmente, deben coincidir con una cuenta existente.'
      );
      return;
    }

    isSubmittingRef.current = true;

    const todayDate = new Date().toISOString().split('T')[0];
    const payload: any = {
      building: tower,
      floor: floor,
      unit_number: isEdit ? (initialData?.unit_number || initialData?.unit) : unit.trim(),
      monthly_fee: monthlyFee ? parseFloat(monthlyFee) : null,
      rent_fee: null,
      owner_start_date: isEdit ? (initialData?.owner_start_date || todayDate) : todayDate,
      tenant_start_date: hasTenant ? (isEdit && initialData?.tenant ? (initialData.tenant_start_date || todayDate) : todayDate) : null,
      owner: {
        id: selectedUserId,
        username: username.trim(),
        full_name: name.trim(),
        document_id: cedula.trim(),
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
        document_id: tenantCedula.trim(),
        email: tenantEmail.trim(),
        phone: tenantPhone.trim(),
      };
    } else {
      payload.tenant = null;
    }

    onSubmit?.(payload);
    // Don't close immediately here if submitting is handled by parent,
    // but the original code did onClose() here. We'll let the parent handle the close
    // or rely on the previous behavior.
    onClose();
  };

  // Cálculo de disponibilidad
  const occupiedUnits = existingResidents.filter(r => r.building === tower && r.floor === floor).map(r => r.unit);
  const occupiedTowers = TOWERS.filter(t => {
    let occupiedCount = 0;
    const residentsInTower = existingResidents.filter(r => r.building === t);
    // Para simplificar, suponemos 15 aptos por torre. (3 pisos x 5 aptos)
    if (residentsInTower.length >= 15) return true;
    return false;
  });
  const aptOptions = getAptsForTowerAndFloor(tower, floor);

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
                onChangeText={(value) => {
                  setName(value);
                  setSelectedUserId(null);
                  setUsername('');
                  setEmail('');
                  setPhone('');
                  setCedula('');
                }}
                placeholder="Ej. María Fernández"
                autoCapitalize="words"
              />
              {!isEdit && showSuggestions ? (
                <View style={styles.suggestionsBox}>
                  {suggestionsLoading ? (
                    <View style={styles.suggestionLoading}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.suggestionMuted}>Buscando usuarios...</Text>
                  </View>
                ) : suggestions.length > 0 ? (
                  suggestions.map((item) => {
                    const imageUri = getMediaUrl(item.profile_image);

                    return (
                      <Pressable
                        key={item.id}
                        style={styles.suggestionItem}
                        onPress={() => handleSelectUser(item)}
                      >
                        {imageUri ? (
                          <Image source={{ uri: imageUri }} style={styles.suggestionAvatar} />
                        ) : (
                          <View style={styles.suggestionAvatarFallback}>
                            <Text style={styles.suggestionAvatarText}>
                              {(item.full_name || item.username || 'U').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}

                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.suggestionName} numberOfLines={1}>
                          {item.full_name || 'Sin nombre'}
                        </Text>
                        <Text style={styles.suggestionMeta} numberOfLines={1}>
                          @{item.username} · {item.email}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })
              ) : (
                <Text style={styles.suggestionEmpty}>
                  No hay usuarios registrados con ese nombre.
                </Text>
              )}
            </View>
          ) : null}
            </Field>

            <Field label="Nombre de usuario">
              <IconInput
                icon="at-outline"
                value={username}
                onChangeText={(value) => {
                  setUsername(value);
                  setSelectedUserId(null);
                }}
                placeholder="username"
                autoCapitalize="none"
              />
            </Field>

            <Field label="Cédula de Identidad">
              <IconInput
                icon="card-outline"
                value={cedula}
                onChangeText={(val) => handleCedulaChange(val, setCedula)}
                placeholder="V-12.345.678"
                keyboardType="phone-pad"
              />
            </Field>

            {!isEdit && (
              <View style={styles.assignmentBox}>
                <Field label="Torre">
                  <SelectableRow 
                    options={TOWERS} 
                    selected={tower} 
                    onSelect={(val) => { setTower(val); setFloor(''); setUnit(''); }} 
                    disabledOptions={occupiedTowers}
                  />
                </Field>
                {tower ? (
                  <Field label="Piso">
                    <SelectableRow 
                      options={FLOORS} 
                      selected={floor} 
                      onSelect={(val) => { setFloor(val); setUnit(''); }} 
                    />
                  </Field>
                ) : null}
                {tower && floor ? (
                  <Field label="Apartamento">
                    <SelectableRow 
                      options={aptOptions} 
                      selected={unit} 
                      onSelect={setUnit} 
                      disabledOptions={occupiedUnits}
                    />
                  </Field>
                ) : null}
              </View>
            )}

            <Field label="Correo electrónico">
              <IconInput
                icon="mail-outline"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setSelectedUserId(null);
                }}
                placeholder="correo@mail.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Field>

            <Field label="Teléfono">
              <IconInput
                icon="call-outline"
                value={phone}
                onChangeText={(value) => {
                  setPhone(value);
                  setSelectedUserId(null);
                }}
                placeholder="+58 414 0000000"
                keyboardType="phone-pad"
              />
            </Field>

            <Field label="Monto mensual a pagar en el condominio (Bs)">
              <IconInput
                icon="cash-outline"
                value={monthlyFee}
                onChangeText={(val) => handleNumberChange(val, setMonthlyFee)}
                placeholder="Ej. 150"
                keyboardType="phone-pad"
              />
            </Field>

            {isEdit && (
              <>
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

                    <Field label="Cédula de Identidad">
                      <IconInput
                        icon="card-outline"
                        value={tenantCedula}
                        onChangeText={(val) => handleCedulaChange(val, setTenantCedula)}
                        placeholder="V-12.345.678"
                        keyboardType="phone-pad"
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
                  </View>
                )}
              </>
            )}

            <View style={styles.legendBox}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.legendText}>
                  Fecha límite de pago de condominio: del 01 al 09 de cada mes
                </Text>
              </View>
            </View>

          </ScrollView>

          <View style={styles.footer}>
            <Btn variant="secondary" full onPress={onClose}>
              Cancelar
            </Btn>
            <Btn variant="primary" full icon="checkmark" onPress={handleSubmit} disabled={submitting}>
              {submitting ? 'Guardando...' : 'Guardar'}
            </Btn>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  suggestionsBox: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 12,
    overflow: 'hidden',
  },
  
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  
  suggestionAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceSoft,
  },
  
  suggestionAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary + '1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  suggestionAvatarText: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
    fontSize: 13,
  },
  
  suggestionName: {
    fontSize: 13.5,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  
  suggestionMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  
  suggestionLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  
  suggestionMuted: {
    fontSize: 12,
    color: colors.textMuted,
  },
  
  suggestionEmpty: {
    fontSize: 12.5,
    color: colors.textMuted,
    padding: 12,
  },
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
  assignmentBox: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillDisabled: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderSubtle,
    opacity: 0.5,
  },
  pillText: {
    fontSize: 13,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  pillTextActive: {
    color: '#fff',
    fontWeight: fontWeight.bold,
  },
  pillTextDisabled: {
    color: colors.textMuted,
  },
  legendBox: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSoft,
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  legendText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
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
