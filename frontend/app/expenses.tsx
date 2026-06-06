import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar } from '../components/ui/AppBar';
import { Btn } from '../components/ui/Btn';
import { FAB } from '../components/ui/FAB';
import { IconBtn } from '../components/ui/IconBtn';
import { Pill } from '../components/ui/Pill';
import { colors, fontSize, fontWeight, radius, spacing, tones } from '../constants/theme';
import {
  createExpense,
  Expense,
  ExpenseCategory,
  EXPENSE_CATEGORIES_MAP,
  fetchExpenses,
  fetchTowerSummary,
  TowerSummary,
  updateExpense,
} from '../data/expenses';
import { API_BASE_URL } from '../services/api';

const TOWERS = ['TODOS', 'Torre A-1', 'Torre B-1', 'Torre C-1', 'Torre C-2', 'Torre D-1', 'Torre E-1'];
const MONTHS = [
  { value: 1, label: 'Ene' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Abr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Ago' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dic' },
];
const YEARS = [2025, 2026];

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { value: 'SEGURIDAD', label: 'Seguridad' },
  { value: 'SERVICIOS', label: 'Servicios' },
  { value: 'ADMINISTRACION', label: 'Administración' },
  { value: 'OTROS', label: 'Otros' },
];

function getCategoryTone(cat: ExpenseCategory) {
  switch (cat) {
    case 'MANTENIMIENTO':
      return 'warning';
    case 'SEGURIDAD':
      return 'danger';
    case 'SERVICIOS':
      return 'info';
    case 'ADMINISTRACION':
      return 'primary';
    default:
      return 'neutral';
  }
}

export default function ExpensesScreen() {
  const router = useRouter();

  // Filters
  const [selectedTower, setSelectedTower] = useState('TODOS');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'TODOS'>('TODOS');
  const [showFilters, setShowFilters] = useState(false);
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Data State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<TowerSummary>({
    torre: 'TODOS',
    mes: now.getMonth() + 1,
    ano: now.getFullYear(),
    ingresos_mes: 0,
    gastos_mes: 0,
    balance_disponible: 0,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Modal Fields
  const [modalCategory, setModalCategory] = useState<ExpenseCategory>('OTROS');
  const [modalDescription, setModalDescription] = useState('');
  const [modalAmount, setModalAmount] = useState('');
  const [modalDate, setModalDate] = useState('');
  const [modalTower, setModalTower] = useState('Torre A-1');
  const [modalReceipt, setModalReceipt] = useState<{ uri: string; name: string; type: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        torre: selectedTower,
        categoria: selectedCategory === 'TODOS' ? undefined : selectedCategory,
        mes: selectedMonth,
        ano: selectedYear,
      };

      const [list, sum] = await Promise.all([
        fetchExpenses(filters),
        fetchTowerSummary(selectedTower, selectedMonth, selectedYear),
      ]);

      setExpenses(list);
      setSummary(sum);
    } catch (err) {
      console.log('Error loading expenses data:', err);
      Alert.alert('Error', 'No se pudieron cargar los datos de gastos.');
    } finally {
      setLoading(false);
    }
  }, [selectedTower, selectedCategory, selectedMonth, selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Modal for Create
  const handleNewExpense = () => {
    setEditingExpense(null);
    setModalCategory('OTROS');
    setModalDescription('');
    setModalAmount('');
    setModalDate(new Date().toISOString().split('T')[0]);
    setModalTower(selectedTower === 'TODOS' ? 'Torre A-1' : selectedTower);
    setModalReceipt(null);
    setModalVisible(true);
  };

  // Open Modal for Edit
  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setModalCategory(expense.categoria);
    setModalDescription(expense.descripcion);
    setModalAmount(expense.monto.toString());
    setModalDate(expense.fecha);
    setModalTower(expense.torre);
    setModalReceipt(null); // Wait to replace if they upload another one
    setModalVisible(true);
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permiso requerido', 'Necesitas permitir el acceso a la galería para adjuntar un comprobante.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]?.uri) {
        return;
      }

      const asset = result.assets[0];
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1000 } }],
        { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
      );

      setModalReceipt({
        uri: manipulated.uri,
        name: `receipt-${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
    } catch (e) {
      console.log('Error picking image:', e);
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  const handleSubmit = async () => {
    const amountNum = parseFloat(modalAmount.replace(',', '.'));
    if (!modalDescription.trim() || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Campos inválidos', 'Por favor, ingresa una descripción y un monto mayor a cero.');
      return;
    }

    if (!modalDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(modalDate)) {
      Alert.alert('Fecha inválida', 'La fecha debe estar en formato YYYY-MM-DD.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('categoria', modalCategory);
      formData.append('descripcion', modalDescription.trim());
      formData.append('monto', amountNum.toString());
      formData.append('fecha', modalDate);
      formData.append('torre', modalTower);

      if (modalReceipt) {
        formData.append('comprobante', {
          uri: modalReceipt.uri,
          name: modalReceipt.name,
          type: modalReceipt.type,
        } as any);
      }

      if (editingExpense) {
        await updateExpense(editingExpense.id, formData);
        Alert.alert('Gasto actualizado', 'El egreso ha sido modificado con éxito.');
      } else {
        await createExpense(formData);
        Alert.alert('Gasto registrado', 'El nuevo egreso ha sido registrado con éxito.');
      }

      setModalVisible(false);
      loadData();
    } catch (err) {
      console.log('Error submitting expense:', err);
      Alert.alert('Error', 'No se pudo guardar el gasto. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const getFullMediaUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}${url}`;
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <AppBar
        title="Gastos"
        subtitle="Egresos y balance del condominio"
        back
        onBack={() => router.back()}
      />

      {/* Selector de Torres Horizontal */}
      <View style={{ marginBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.towersScroll}>
          {TOWERS.map((t) => (
            <Pressable
              key={t}
              onPress={() => setSelectedTower(t)}
              style={[styles.towerPill, selectedTower === t && styles.towerPillActive]}
            >
              <Text style={[styles.towerPillText, selectedTower === t && styles.towerPillTextActive]}>
                {t === 'TODOS' ? 'Todas las Torres' : t}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Tarjetas de Resumen Financiero de la Torre */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: '#f0f9ff' }]}>
            <Text style={[styles.summaryLabel, { color: '#0369a1' }]}>INGRESOS MES</Text>
            <Text style={[styles.summaryValue, { color: '#0c4a6e' }]}>
              Bs. {summary.ingresos_mes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: '#fff7ed' }]}>
            <Text style={[styles.summaryLabel, { color: '#c2410c' }]}>GASTOS MES</Text>
            <Text style={[styles.summaryValue, { color: '#7c2d12' }]}>
              Bs. {summary.gastos_mes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: '#f0fdf4', width: '100%', marginTop: 8 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.summaryLabel, { color: '#15803d' }]}>BALANCE DISPONIBLE</Text>
              <Ionicons name="pie-chart" size={16} color="#15803d" />
            </View>
            <Text style={[styles.summaryValueLarge, { color: '#14532d' }]}>
              Bs. {summary.balance_disponible.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={{ fontSize: 10, color: '#166534', marginTop: 2, fontWeight: '500' }}>
              Histórico acumulado de la torre
            </Text>
          </View>
        </View>

        {/* Botón de Filtros */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', paddingHorizontal: spacing.screen, marginBottom: 8, marginTop: 4 }}>
          <Pressable 
            onPress={() => setShowFilters(!showFilters)}
            style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
          >
            <Ionicons name="options-outline" size={16} color={showFilters ? '#fff' : colors.text} />
            <Text style={[styles.filterBtnText, showFilters && styles.filterBtnTextActive]}>Filtros</Text>
          </Pressable>
        </View>

        {showFilters && (
          <View style={styles.collapsibleFilters}>
            {/* Sección de Filtros */}
            <View style={styles.filtersHeader}>
              <Ionicons name="funnel-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.filtersTitle}>Filtros de Período y Categoría</Text>
            </View>

            {/* Meses Horizontal */}
            <View style={{ marginBottom: spacing.sectionBottom }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthsScroll}>
                {MONTHS.map((m) => (
                  <Pressable
                    key={m.value}
                    onPress={() => setSelectedMonth(m.value)}
                    style={[styles.monthItem, selectedMonth === m.value && styles.monthItemActive]}
                  >
                    <Text style={[styles.monthText, selectedMonth === m.value && styles.monthTextActive]}>{m.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Segmented Años & Categorías */}
            <View style={styles.segmentedFilters}>
              {/* Año */}
              <View style={{ flex: 1 }}>
                <View style={styles.segmentedRow}>
                  {YEARS.map((yr) => (
                    <Pressable
                      key={yr}
                      onPress={() => setSelectedYear(yr)}
                      style={[styles.segmentedCell, selectedYear === yr && styles.segmentedCellActive]}
                    >
                      <Text style={[styles.segmentedText, selectedYear === yr && styles.segmentedTextActive]}>{yr}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              
              {/* Categoría Selector */}
              <View style={{ flex: 2, marginLeft: 12 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  <Pressable
                    onPress={() => setSelectedCategory('TODOS')}
                    style={[styles.catFilterPill, selectedCategory === 'TODOS' && styles.catFilterPillActive]}
                  >
                    <Text style={[styles.catFilterText, selectedCategory === 'TODOS' && styles.catFilterTextActive]}>Todas</Text>
                  </Pressable>
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat.value}
                      onPress={() => setSelectedCategory(cat.value)}
                      style={[styles.catFilterPill, selectedCategory === cat.value && styles.catFilterPillActive]}
                    >
                      <Text style={[styles.catFilterText, selectedCategory === cat.value && styles.catFilterTextActive]}>{cat.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        )}

        {/* Lista de Gastos */}
        <View style={styles.listContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.listTitle}>Historial de Egresos</Text>
            <Pill tone="expense">{expenses.length} gastos</Pill>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 32 }} />
          ) : expenses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={36} color={colors.textSubtle} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyText}>No hay gastos registrados para este período.</Text>
            </View>
          ) : (
            expenses.map((exp) => {
              const toneKey = getCategoryTone(exp.categoria);
              const t = tones[toneKey];
              return (
                <Pressable
                  key={exp.id}
                  onPress={() => handleEditExpense(exp)}
                  style={({ pressed }) => [styles.expenseRow, pressed && { opacity: 0.8 }]}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: t.bgStrong }]}>
                    <Ionicons
                      name={
                        exp.categoria === 'MANTENIMIENTO'
                          ? 'construct'
                          : exp.categoria === 'SEGURIDAD'
                          ? 'shield'
                          : exp.categoria === 'SERVICIOS'
                          ? 'flash'
                          : exp.categoria === 'ADMINISTRACION'
                          ? 'document'
                          : 'ellipsis-horizontal'
                      }
                      size={18}
                      color={t.fg}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.expenseDesc} numberOfLines={1}>
                      {exp.descripcion}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <Text style={styles.expenseMeta}>{exp.fecha}</Text>
                      <Text style={styles.dot}>·</Text>
                      <Text style={styles.expenseMeta}>{EXPENSE_CATEGORIES_MAP[exp.categoria]}</Text>
                      {exp.comprobante ? (
                        <>
                          <Text style={styles.dot}>·</Text>
                          <Ionicons name="image-outline" size={12} color={colors.primary} />
                          <Text style={[styles.expenseMeta, { color: colors.primary }]}>Comprobante</Text>
                        </>
                      ) : null}
                    </View>
                  </View>

                  <Text style={styles.expenseAmount}>
                    -Bs. {exp.monto.toFixed(2)}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Botón flotante para registrar gasto */}
      <FAB onPress={handleNewExpense} />

      {/* Modal para Crear/Editar Gasto */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setModalVisible(false)} />
          
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingExpense ? 'Editar Gasto' : 'Registrar Gasto'}</Text>
              <Pressable style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={18} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {/* Categoría */}
              <View style={styles.field}>
                <Text style={styles.label}>Categoría</Text>
                <View style={styles.categoriesRow}>
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat.value}
                      onPress={() => setModalCategory(cat.value)}
                      style={[
                        styles.catCell,
                        modalCategory === cat.value && {
                          backgroundColor: tones[getCategoryTone(cat.value)].bgStrong,
                          borderColor: tones[getCategoryTone(cat.value)].fg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.catCellText,
                          modalCategory === cat.value && {
                            color: tones[getCategoryTone(cat.value)].fgStrong,
                            fontWeight: fontWeight.bold,
                          },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Descripción */}
              <View style={styles.field}>
                <Text style={styles.label}>Descripción</Text>
                <TextInput
                  value={modalDescription}
                  onChangeText={setModalDescription}
                  placeholder="Ej. Compra de bombillos para pasillos"
                  placeholderTextColor={colors.textSubtle}
                  style={styles.textInput}
                />
              </View>

              {/* Monto */}
              <View style={styles.field}>
                <Text style={styles.label}>Monto (Bs.)</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencyPrefix}>Bs.</Text>
                  <TextInput
                    value={modalAmount}
                    onChangeText={setModalAmount}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSubtle}
                    keyboardType="decimal-pad"
                    style={styles.amountInput}
                  />
                </View>
              </View>

              {/* Fecha */}
              <View style={styles.field}>
                <Text style={styles.label}>Fecha (AAAA-MM-DD)</Text>
                <View style={styles.inputWithIconContainer}>
                  <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
                  <TextInput
                    value={modalDate}
                    onChangeText={setModalDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textSubtle}
                    maxLength={10}
                    style={styles.inputWithIcon}
                  />
                </View>
              </View>

              {/* Torre */}
              <View style={styles.field}>
                <Text style={styles.label}>Torre Asociada</Text>
                <View style={styles.towerSelectorGrid}>
                  {TOWERS.map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => setModalTower(t)}
                      style={[styles.modalTowerCell, modalTower === t && styles.modalTowerCellActive]}
                    >
                      <Text style={[styles.modalTowerCellText, modalTower === t && styles.modalTowerCellTextActive]}>
                        {t}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Comprobante */}
              <View style={styles.field}>
                <Text style={styles.label}>Comprobante (Opcional)</Text>
                <Pressable onPress={handlePickImage} style={styles.uploadBox}>
                  {modalReceipt ? (
                    <Image source={{ uri: modalReceipt.uri }} style={styles.receiptPreview} />
                  ) : editingExpense && editingExpense.comprobante ? (
                    <Image source={{ uri: getFullMediaUrl(editingExpense.comprobante) || '' }} style={styles.receiptPreview} />
                  ) : (
                    <View style={styles.uploadBoxContent}>
                      <Ionicons name="camera" size={24} color={colors.primary} />
                      <Text style={styles.uploadText}>Cargar foto de factura o recibo</Text>
                    </View>
                  )}
                </Pressable>
                {(modalReceipt || (editingExpense && editingExpense.comprobante)) && (
                  <Pressable
                    onPress={() => {
                      setModalReceipt(null);
                      if (editingExpense) editingExpense.comprobante = null;
                    }}
                    style={styles.removeReceiptBtn}
                  >
                    <Ionicons name="trash-outline" size={14} color="#dc2626" />
                    <Text style={styles.removeReceiptText}>Quitar comprobante</Text>
                  </Pressable>
                )}
              </View>

              {/* Acciones */}
              <View style={styles.modalFooter}>
                <Btn variant="secondary" full onPress={() => setModalVisible(false)}>
                  Cancelar
                </Btn>
                <Btn variant="primary" full icon="checkmark" onPress={handleSubmit} disabled={submitting}>
                  {submitting ? 'Guardando…' : editingExpense ? 'Actualizar' : 'Guardar'}
                </Btn>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingBottom: spacing.scrollerBottom },

  towersScroll: {
    paddingHorizontal: spacing.screen,
    paddingTop: 4,
    gap: 8,
  },
  towerPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  towerPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  towerPillText: {
    fontSize: 13,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  towerPillTextActive: {
    color: '#fff',
    fontWeight: fontWeight.bold,
  },

  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 12,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  collapsibleFilters: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.xl,
    marginHorizontal: spacing.screen,
    paddingVertical: 12,
    marginBottom: 16,
  },

  summaryContainer: {
    paddingHorizontal: spacing.screen,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.03)',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: fontWeight.bold,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  summaryValueLarge: {
    fontSize: 22,
    fontWeight: fontWeight.bold,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },

  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    gap: 6,
    marginBottom: 8,
  },
  filtersTitle: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  monthsScroll: {
    paddingHorizontal: spacing.screen,
    gap: 6,
  },
  monthItem: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  monthText: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  monthTextActive: {
    color: '#fff',
    fontWeight: fontWeight.bold,
  },

  segmentedFilters: {
    paddingHorizontal: spacing.screen,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 2,
  },
  segmentedCell: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentedCellActive: {
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  segmentedText: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },
  segmentedTextActive: {
    color: colors.text,
  },

  catFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catFilterPillActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  catFilterText: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  catFilterTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },

  listContainer: {
    paddingHorizontal: spacing.screen,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },

  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.xl,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  categoryIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseDesc: {
    fontSize: fontSize.card,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  expenseMeta: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  dot: {
    fontSize: 10,
    color: colors.textSubtle,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: fontWeight.bold,
    color: '#ea580c',
    fontVariant: ['tabular-nums'],
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 24,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catCell: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catCellText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  textInput: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: colors.text,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  currencyPrefix: {
    fontSize: 14,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  inputWithIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    gap: 8,
  },
  inputWithIcon: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  towerSelectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalTowerCell: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
  },
  modalTowerCellActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modalTowerCellText: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  modalTowerCellTextActive: {
    color: '#fff',
    fontWeight: fontWeight.bold,
  },

  uploadBox: {
    height: 120,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surfaceSoft,
    overflow: 'hidden',
  },
  uploadBoxContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  uploadText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  receiptPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 6,
  },
  removeReceiptText: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: fontWeight.semibold,
  },

  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 14,
    marginTop: 14,
  },
});
