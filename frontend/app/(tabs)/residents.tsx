import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ResidentModal } from '../../components/modals/ResidentModal';
import { AppBar } from '../../components/ui/AppBar';
import { Avatar } from '../../components/ui/Avatar';
import { Btn } from '../../components/ui/Btn';
import { FAB } from '../../components/ui/FAB';
import { IconBtn } from '../../components/ui/IconBtn';
import { Pill } from '../../components/ui/Pill';
import { SearchField } from '../../components/ui/SearchField';
import { Segmented } from '../../components/ui/Segmented';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from '../../constants/theme';
import type { Resident, ResidentStatus } from '../../data/types';
import { api } from '../../services/api';

type Filter = 'todos' | 'aldia' | 'moroso' | 'pendiente';

const TOWERS = ['Torre A-1', 'Torre B-1', 'Torre C-1', 'Torre C-2', 'Torre D-1', 'Torre E-1'];

function statusPill(status: ResidentStatus) {
  if (status === 'al-dia') return <Pill tone="success">Al día</Pill>;
  if (status === 'moroso') return <Pill tone="danger">Moroso</Pill>;
  return <Pill tone="warning">Pendiente</Pill>;
}

// Mapea la respuesta del backend a la interfaz del frontend
function mapPropertyToResident(prop: any): Resident {
  const activeUser = prop.owner || prop.tenant; // El principal es el owner
  const name = activeUser?.full_name || activeUser?.email || 'Desconocido';
  const initial = name.charAt(0).toUpperCase();
  
  return {
    ...prop,
    name,
    unit: prop.unit_number,
    phone: activeUser?.phone || 'Sin teléfono',
    email: activeUser?.email || 'Sin correo',
    since: prop.owner_start_date || prop.tenant_start_date || 'N/A',
    status: prop.payment_status || 'pendiente',
    avatar: initial,
    color: '#2563eb', // Can add random color generator if needed
  };
}

export default function ResidentsScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('todos');
  const [towerFilter, setTowerFilter] = useState<string | null>(null);
  const [showTowers, setShowTowers] = useState(false);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selected, setSelected] = useState<Resident | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [loading, setLoading] = useState(true);

  const fetchResidents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/properties/');
      const mapped = res.data.map(mapPropertyToResident);
      setResidents(mapped);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudieron cargar los residentes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  const filtered = residents.filter((r) => {
    if (filter === 'aldia' && r.status !== 'al-dia') return false;
    if (filter === 'moroso' && r.status !== 'moroso') return false;
    if (filter === 'pendiente' && r.status !== 'pendiente') return false;
    if (towerFilter && r.building !== towerFilter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleNew = () => {
    setModalMode('add');
    setShowModal(true);
  };
  
  const handleEdit = () => {
    setModalMode('edit');
    setShowModal(true);
  };
  
  const closeDetail = () => setSelected(null);

  const handleDelete = () => {
    if (!selected) return;
    Alert.alert(
      'Eliminar',
      `¿Seguro que deseas eliminar a ${selected.name} y la unidad ${selected.unit}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/properties/${selected.id}/`);
              closeDetail();
              fetchResidents();
            } catch (err) {
              Alert.alert('Error', 'No se pudo eliminar el residente.');
            }
          },
        },
      ]
    );
  };

  const handleModalSubmit = async (payload: any) => {
    try {
      if (modalMode === 'add') {
        await api.post('/properties/', payload);
      } else if (modalMode === 'edit' && selected) {
        await api.put(`/properties/${selected.id}/`, payload);
        closeDetail();
      }
      fetchResidents();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Hubo un problema al guardar el residente.');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <AppBar
          title="Residentes"
          subtitle={`${residents.length} activos`}
          large
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.screen }}>
          <View style={{ flex: 1 }}>
            <SearchField
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por nombre…"
            />
          </View>
          <Pressable 
            onPress={() => setShowTowers(!showTowers)}
            style={[styles.filterBtn, showTowers && styles.filterBtnActive]}
          >
            <Ionicons name="options-outline" size={20} color={showTowers ? '#fff' : colors.text} />
            <Text style={[styles.filterBtnText, showTowers && styles.filterBtnTextActive]}>Filtros</Text>
          </Pressable>
        </View>

        {showTowers && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.towersScroll}>
            <Pressable 
              onPress={() => setTowerFilter(null)}
              style={[styles.towerPill, !towerFilter && styles.towerPillActive]}
            >
              <Text style={[styles.towerPillText, !towerFilter && styles.towerPillTextActive]}>Todas las Torres</Text>
            </Pressable>
            {TOWERS.map(t => (
              <Pressable 
                key={t}
                onPress={() => setTowerFilter(t)}
                style={[styles.towerPill, towerFilter === t && styles.towerPillActive]}
              >
                <Text style={[styles.towerPillText, towerFilter === t && styles.towerPillTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={styles.segmentWrap}>
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'aldia', label: 'Al día' },
              { value: 'moroso', label: 'Morosos' },
              { value: 'pendiente', label: 'Pendiente' },
            ]}
          />
        </View>

        <View style={styles.list}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : filtered.length === 0 ? (
            <Text style={styles.empty}>Sin resultados</Text>
          ) : (
            filtered.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => setSelected(r)}
                style={({ pressed }) => [
                  styles.card,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Avatar text={r.avatar} color={r.color} size={44} />
                <View style={styles.cardMid}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {r.name}
                  </Text>
                  <View style={styles.cardUnit}>
                    <Ionicons
                      name="business"
                      size={12}
                      color={colors.textMuted}
                    />
                    <Text style={styles.cardUnitText} numberOfLines={1}>
                      {r.unit}
                    </Text>
                  </View>
                </View>
                {statusPill(r.status)}
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      <FAB onPress={handleNew} />

      <Modal
        visible={selected !== null && !showModal}
        transparent
        animationType="slide"
        onRequestClose={closeDetail}
      >
        <View style={styles.backdrop}>
          <Pressable style={styles.backdropTouch} onPress={closeDetail} />
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Detalle de residente</Text>
              <Pressable onPress={closeDetail} style={styles.closeBtn}>
                <Ionicons name="close" size={18} color={colors.text} />
              </Pressable>
            </View>

            {selected && (
              <>
                <View style={styles.detailHead}>
                  <Avatar
                    text={selected.avatar}
                    color={selected.color}
                    size={64}
                  />
                  <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                    <Text style={styles.detailName} numberOfLines={1}>
                      {selected.name}
                    </Text>
                    <Text style={styles.detailUnit}>{selected.unit}</Text>
                    <View style={{ flexDirection: 'row' }}>
                      {statusPill(selected.status)}
                    </View>
                  </View>
                </View>

                <InfoRow
                  icon="call"
                  label="Teléfono"
                  value={selected.phone}
                />
                <InfoRow icon="mail" label="Correo" value={selected.email} />
                <InfoRow
                  icon="calendar"
                  label="Residente desde"
                  value={selected.since}
                />
                {selected.monthly_fee && (
                   <InfoRow
                    icon="cash"
                    label="Monto mensual"
                    value={`Bs ${selected.monthly_fee}`}
                  />
                )}

                <View style={styles.footer}>
                  <Btn
                    variant="subtleDanger"
                    icon="trash"
                    onPress={handleDelete}
                  >
                    Eliminar
                  </Btn>
                  <Btn
                    variant="primary"
                    full
                    icon="create"
                    onPress={handleEdit}
                  >
                    Editar
                  </Btn>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <ResidentModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        initialData={modalMode === 'edit' ? selected : null}
        existingResidents={residents}
        onSubmit={handleModalSubmit}
      />
    </SafeAreaView>
  );
}

// Fila de info dentro del modal de detalle.
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={17} color={colors.textMuted} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.infoLabel}>{label.toUpperCase()}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingBottom: spacing.scrollerBottom },

  segmentWrap: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 14,
    paddingTop: 8,
  },

  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    marginLeft: 8,
    marginBottom: 16,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBtnText: {
    fontSize: 14,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  towersScroll: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 14,
    gap: 8,
  },
  towerPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  towerPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  towerPillText: {
    fontSize: 13,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  towerPillTextActive: {
    color: '#fff',
    fontWeight: fontWeight.bold,
  },

  list: {
    paddingHorizontal: spacing.screen,
    gap: 8,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.xl,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  cardMid: { flex: 1, minWidth: 0, gap: 2 },
  cardName: {
    fontSize: fontSize.card,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  cardUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardUnitText: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },

  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.medium,
    paddingVertical: 32,
  },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouch: { ...StyleSheet.absoluteFillObject },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 28,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  detailName: {
    fontSize: 18,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.25,
  },
  detailUnit: {
    fontSize: 13,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textSubtle,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },

  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
});
