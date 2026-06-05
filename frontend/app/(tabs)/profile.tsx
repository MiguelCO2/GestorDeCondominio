import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Btn } from '../../components/ui/Btn';
import { colors, fontWeight, radius } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE_URL } from '../../services/api';

type SelectedImage = {
  uri: string;
  name: string;
  type: string;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, signOut } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);

  const [saving, setSaving] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setSelectedImage(null);
    }
  }, [user]);

  const cleanPhoneNumber = (value: string) => {
    return value.replace(/\D/g, '');
  };

  const isValidEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.trim().toLowerCase());
  };

  const isValidPhone = (value: string) => {
    const cleanPhone = cleanPhoneNumber(value);
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  };

  const hasChanges = useMemo(() => {
    if (!user) return false;

    return (
      fullName.trim() !== (user.full_name || '') ||
      email.trim().toLowerCase() !== (user.email || '') ||
      cleanPhoneNumber(phone) !== (user.phone || '') ||
      selectedImage !== null
    );
  }, [fullName, email, phone, selectedImage, user]);

  const resetForm = () => {
    if (!user) return;

    setFullName(user.full_name || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setSelectedImage(null);
    setError(null);
    setMessage(null);
  };

  const pickImage = async () => {
    try {
      setError(null);
      setMessage(null);
      setPickingImage(true);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setError('Necesitas permitir acceso a la galería para cambiar tu foto.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      if (!asset?.uri) {
        setError('No se pudo seleccionar la imagen.');
        return;
      }

      const manipulatedImage = await ImageManipulator.manipulateAsync(
        asset.uri,
        [
          {
            resize: {
              width: 800,
            },
          },
        ],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      
      setSelectedImage({
        uri: manipulatedImage.uri,
        name: `profile-${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
      
    } catch (err) {
      console.log('Pick image error:', err);
      setError('Ocurrió un error al seleccionar la imagen.');
    } finally {
      setPickingImage(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      setError('No se encontró la sesión del usuario.');
      return;
    }

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setError('Completa todos los campos obligatorios.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    if (!isValidPhone(phone)) {
      setError('Ingresa un número de teléfono válido. Debe tener entre 10 y 15 dígitos.');
      return;
    }

    const cleanPhone = cleanPhoneNumber(phone);

    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const formData = new FormData();

      formData.append('full_name', fullName.trim());
      formData.append('email', email.trim().toLowerCase());
      formData.append('phone', cleanPhone);

      if (selectedImage) {
        formData.append('profile_image', {
          uri: selectedImage.uri,
          name: selectedImage.name,
          type: selectedImage.type,
        } as any);
      }

      const result = await updateProfile(formData);

      if (result.ok) {
        setSelectedImage(null);
        setMessage('Perfil actualizado correctamente.');
      } else {
        setError(result.message || 'No se pudo actualizar el perfil.');
      }
    } catch (err) {
      console.log('Save profile error:', err);
      setError('Ocurrió un error al actualizar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  const getMediaUrl = (path?: string | null) => {
    if (!path) return null;
  
    if (path.startsWith('http')) {
      return path;
    }
  
    const baseUrl = API_BASE_URL.replace('/api', '');
  
    return `${baseUrl}${path}`;
  };

  const getRoleLabel = (role?: string | null) => {
    const roles: Record<string, string> = {
      super_admin: 'Super administrador',
      admin: 'Administrador',
      board: 'Junta de condominio',
      resident: 'Residente',
      security: 'Seguridad',
      accountant: 'Contador',
    };
  
    return roles[role || ''] || 'Usuario';
  };

  const profileImageUri = selectedImage?.uri || getMediaUrl(user.profile_image);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>

          <Text style={styles.headerTitle}>Mi perfil</Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.avatarSection}>
          <Pressable style={styles.avatarWrapper} onPress={pickImage} disabled={pickingImage}>
            {profileImageUri ? (
              <Image source={{ uri: profileImageUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{user.initials}</Text>
              </View>
            )}

            <View style={styles.cameraBadge}>
              {pickingImage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera-outline" size={18} color="#fff" />
              )}
            </View>
          </Pressable>

          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.role}>{getRoleLabel(user.role)}</Text>

          <Pressable onPress={pickImage} disabled={pickingImage}>
            <Text style={styles.changePhotoText}>
              {pickingImage ? 'Abriendo galería...' : 'Cambiar foto de perfil'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información personal</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Nombre completo</Text>
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={18} color={colors.textMuted} />
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nombre completo"
                placeholderTextColor={colors.textSubtle}
                style={styles.input}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Correo electrónico</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={colors.textSubtle}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                caretHidden={false}
                cursorColor={colors.primary}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Teléfono de contacto</Text>
            <View style={styles.inputBox}>
              <Ionicons name="call-outline" size={18} color={colors.textMuted} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="04121234567"
                placeholderTextColor={colors.textSubtle}
                style={styles.input}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.success}>{message}</Text> : null}

          <View style={styles.actions}>
            <Btn full loading={saving} onPress={handleSave} disabled={!hasChanges || saving}>
              Guardar cambios
            </Btn>

            {hasChanges ? (
              <Pressable style={styles.undoButton} onPress={resetForm} disabled={saving}>
                <Ionicons name="refresh-outline" size={17} color={colors.textMuted} />
                <Text style={styles.undoText}>Deshacer cambios</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <Pressable style={styles.logoutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#dc2626" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
  },
  center: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  scroll: {
    flexGrow: 1,
    padding: 22,
    paddingTop: 52,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  headerSpacer: {
    width: 42,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    width: 112,
    height: 112,
    borderRadius: 36,
    marginBottom: 14,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 36,
    backgroundColor: colors.borderSubtle,
  },
  avatarFallback: {
    width: 112,
    height: 112,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 32,
    fontWeight: fontWeight.bold,
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  role: {
    marginTop: 3,
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  changePhotoText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius['3xl'],
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: 18,
  },
  field: {
    marginBottom: 15,
  },
  label: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  inputBox: {
    height: 52,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    color: colors.text,
    fontWeight: fontWeight.medium,
    paddingVertical: 0,
  },
  error: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: fontWeight.semibold,
    marginTop: 4,
  },
  success: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: fontWeight.semibold,
    marginTop: 4,
  },
  actions: {
    marginTop: 18,
    gap: 12,
  },
  undoButton: {
    height: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  undoText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
  },
  logoutButton: {
    marginTop: 18,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logoutText: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: fontWeight.semibold,
  },
});