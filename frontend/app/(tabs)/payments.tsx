import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PaymentModal } from '../../components/modals/PaymentModal';
import { AppBar } from '../../components/ui/AppBar';
import { FAB } from '../../components/ui/FAB';
import { IconBtn } from '../../components/ui/IconBtn';
import { Pill } from '../../components/ui/Pill';
import { SearchField } from '../../components/ui/SearchField';
import { Segmented } from '../../components/ui/Segmented';
import { colors, fontWeight, radius, spacing } from '../../constants/theme';
import { PAYMENTS, PAYMENTS_SUMMARY } from '../../data/payments';
import type { Payment } from '../../data/types';

type Filter = 'todos' | 'mensualidad' | 'abono' | 'pendiente';

// Formato corto sin decimales para la banda de resumen (es-VE usa "." como separador de miles).
const fmtSummary = (n: number) => 'Bs. ' + n.toLocaleString('es-VE');

// Tono del tile de fecha según estado/tipo del pago
function getDateTileTone(p: Payment) {
  if (p.status === 'pendiente') return { bg: '#fef3c7', fg: '#a16207' };
  if (p.type === 'Mensualidad') return { bg: '#dbeafe', fg: '#1d4ed8' };
  return { bg: '#dcfce7', fg: '#15803d' };
}

export default function PaymentsScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('todos');
  const [showNewPayment, setShowNewPayment] = useState(false);

  const filtered = PAYMENTS.filter((p) => {
    if (filter === 'mensualidad' && p.type !== 'Mensualidad') return false;
    if (filter === 'abono' && p.type !== 'Abono') return false;
    if (filter === 'pendiente' && p.status !== 'pendiente') return false;
    if (search && !p.resident.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleNewPayment = () => setShowNewPayment(true);
  const handleExport = () => {
    // TODO: abrir modal de exportar reportes
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroller}>
        <AppBar
          title="Pagos"
          large
          right={<IconBtn icon="download" tone="primary" onPress={handleExport} />}
        />

        {/* Banda de resumen */}
        <View style={styles.summary}>
          <View style={[styles.summaryCard, { backgroundColor: '#f0f9ff' }]}>
            <Text style={[styles.summaryLabel, { color: '#0369a1' }]}>COBRADO</Text>
            <Text style={[styles.summaryValue, { color: '#0c4a6e' }]}>
              {fmtSummary(PAYMENTS_SUMMARY.cobrado)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#fefce8' }]}>
            <Text style={[styles.summaryLabel, { color: '#a16207' }]}>PENDIENTE</Text>
            <Text style={[styles.summaryValue, { color: '#713f12' }]}>
              {fmtSummary(PAYMENTS_SUMMARY.pendiente)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#fef2f2' }]}>
            <Text style={[styles.summaryLabel, { color: '#b91c1c' }]}>MOROSO</Text>
            <Text style={[styles.summaryValue, { color: '#7f1d1d' }]}>
              {fmtSummary(PAYMENTS_SUMMARY.moroso)}
            </Text>
          </View>
        </View>

        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar residente…"
        />

        <View style={styles.segmentedWrap}>
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'mensualidad', label: 'Mensualidad' },
              { value: 'abono', label: 'Abonos' },
              { value: 'pendiente', label: 'Pendientes' },
            ]}
          />
        </View>

        {/* Lista */}
        <View style={styles.list}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Sin resultados</Text>
            </View>
          ) : (
            filtered.map((p) => {
              const tone = getDateTileTone(p);
              const day = p.date.split(' ')[0];
              const isPending = p.status === 'pendiente';
              return (
                <Pressable key={p.id} style={styles.item}>
                  <View style={[styles.dateTile, { backgroundColor: tone.bg }]}>
                    <Text style={[styles.dateText, { color: tone.fg }]}>{day}</Text>
                  </View>
                  <View style={styles.middle}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name} numberOfLines={1}>
                        {p.resident}
                      </Text>
                      {isPending && <Pill tone="warning">Pendiente</Pill>}
                    </View>
                    <Text style={styles.meta} numberOfLines={1}>
                      {p.unit} · {p.type} · {p.method}
                    </Text>
                  </View>
                  <View style={styles.amountWrap}>
                    <Text
                      style={[
                        styles.amount,
                        { color: isPending ? '#a16207' : colors.text },
                      ]}
                    >
                      {p.amount.toFixed(2)}
                    </Text>
                    <Text style={styles.currency}>Bs.</Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      <FAB onPress={handleNewPayment} />

      <PaymentModal
        visible={showNewPayment}
        onClose={() => setShowNewPayment(false)}
        onSubmit={(p) =>
          Alert.alert('Pago registrado', `${p.resident} · Bs. ${p.amount.toFixed(2)}`)
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroller: { paddingBottom: spacing.scrollerBottom },

  summary: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screen,
    paddingBottom: 14,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: fontWeight.bold,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },

  segmentedWrap: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 14,
  },

  list: {
    paddingHorizontal: spacing.screen,
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.xl,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  dateTile: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
  },
  middle: { flex: 1, minWidth: 0 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  meta: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  amountWrap: { alignItems: 'flex-end' },
  amount: {
    fontSize: 16,
    fontWeight: fontWeight.bold,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  currency: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: colors.textSubtle,
  },

  empty: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
});
