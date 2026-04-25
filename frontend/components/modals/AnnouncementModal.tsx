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

import { colors, fontWeight, radius, tones } from '../../constants/theme';
import type { AnnouncementCategory } from '../../data/types';
import { Btn } from '../ui/Btn';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (payload: {
    title: string;
    body: string;
    category: AnnouncementCategory;
    pinned: boolean;
  }) => void;
}

// Wrapper local: label arriba + input/control debajo.
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

// Mapeo categoría → tono semántico para el grid de selección.
const CATEGORIES: { value: AnnouncementCategory; tone: keyof typeof tones }[] = [
  { value: 'Mantenimiento', tone: 'warning' },
  { value: 'Asamblea',      tone: 'primary' },
  { value: 'Seguridad',     tone: 'danger' },
  { value: 'Áreas Comunes', tone: 'info' },
];

export function AnnouncementModal({ visible, onClose, onSubmit }: Props) {
  const [category, setCategory] = useState<AnnouncementCategory>('Mantenimiento');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Faltan datos', 'Escribe un título y un mensaje.');
      return;
    }
    onSubmit?.({ title: title.trim(), body: body.trim(), category, pinned });
    // Reset
    setCategory('Mantenimiento');
    setTitle('');
    setBody('');
    setPinned(false);
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
            <Text style={styles.title}>Nuevo anuncio</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={17} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Field label="Categoría">
              <View style={styles.catGrid}>
                {CATEGORIES.map((c) => {
                  const active = c.value === category;
                  const t = tones[c.tone];
                  return (
                    <Pressable
                      key={c.value}
                      onPress={() => setCategory(c.value)}
                      style={[
                        styles.catOpt,
                        { backgroundColor: active ? t.bgStrong : colors.surfaceSoft },
                      ]}
                    >
                      <Text
                        style={[
                          styles.catLabel,
                          { color: active ? t.fgStrong : colors.textMuted },
                        ]}
                      >
                        {c.value}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            <Field label="Título">
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Ej. Mantenimiento de ascensores"
                placeholderTextColor={colors.textSubtle}
                maxLength={80}
                style={styles.input}
              />
            </Field>

            <Field label="Mensaje">
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder="Detalles del anuncio…"
                placeholderTextColor={colors.textSubtle}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={styles.textarea}
              />
            </Field>

            <Pressable style={styles.pinRow} onPress={() => setPinned((p) => !p)}>
              <Ionicons
                name="pin"
                size={18}
                color={pinned ? colors.primary : colors.textMuted}
              />
              <View style={styles.pinText}>
                <Text style={styles.pinTitle}>Fijar en el inicio</Text>
                <Text style={styles.pinSub}>
                  Aparece arriba en la pantalla de Anuncios
                </Text>
              </View>
              <View
                style={[
                  styles.toggle,
                  { backgroundColor: pinned ? colors.primary : '#cbd5e1' },
                ]}
              >
                <View
                  style={[
                    styles.toggleDot,
                    { alignSelf: pinned ? 'flex-end' : 'flex-start' },
                  ]}
                />
              </View>
            </Pressable>
          </ScrollView>

          <View style={styles.footer}>
            <Btn variant="secondary" full onPress={onClose}>
              Cancelar
            </Btn>
            <Btn variant="primary" full icon="megaphone" onPress={handleSubmit}>
              Publicar
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

  // Grid 2x2 de categorías
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catOpt: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  catLabel: {
    fontSize: 13,
    fontWeight: fontWeight.semibold,
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
  textarea: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 110,
    fontSize: 14.5,
    color: colors.text,
  },

  // Toggle "Fijar en el inicio"
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 12,
    marginBottom: 4,
  },
  pinText: { flex: 1 },
  pinTitle: {
    fontSize: 14,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  pinSub: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
    marginTop: 2,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
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
