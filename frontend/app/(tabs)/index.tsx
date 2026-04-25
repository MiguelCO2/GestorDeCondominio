import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconBtn } from '../../components/ui/IconBtn';
import { KPICard } from '../../components/ui/KPICard';
import { Pill } from '../../components/ui/Pill';
import { SectionHead } from '../../components/ui/SectionHead';
import { Sparkline } from '../../components/ui/Sparkline';
import { colors, fontWeight, radius, spacing, tones } from '../../constants/theme';
import { ANNOUNCEMENTS } from '../../data/announcements';
import { FINANCE_KPIS, EXPENSE_TREND, INCOME_TREND } from '../../data/finance';
import { fmt, fmtNum } from '../../data/format';
import { PAYMENTS } from '../../data/payments';
import { useAuth } from '../../hooks/useAuth';

// Saludo según hora local. Es un detalle pequeño pero suma al feel de dashboard.
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

const QUICK_ACTIONS = [
  { icon: 'qr-code',   label: 'Registrar\nvisita',   color: '#2563eb' },
  { icon: 'calendar',  label: 'Nueva\nreserva',      color: '#0891b2' },
  { icon: 'megaphone', label: 'Publicar\nanuncio',   color: '#ea580c' },
  { icon: 'download',  label: 'Exportar\nreporte',   color: '#16a34a' },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? 'Andrea';
  const pinned = ANNOUNCEMENTS.find((a) => a.pinned);
  const recentPayments = PAYMENTS.slice(0, 3);

  const handleQuickAction = (label: string) => {
    // Sin modales todavía: solo confirmamos el tap.
    Alert.alert(label.replace('\n', ' '));
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero greeting + balance */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{getGreeting()}, {firstName}</Text>
              <Text style={styles.heroTitle}>
                Condominio{'\n'}
                <Text style={styles.heroTitleLight}>Los Robles</Text>
              </Text>
            </View>
            <View style={styles.heroActions}>
              <IconBtn icon="search" />
              <IconBtn icon="notifications" badge />
            </View>
          </View>

          {/* Balance card oscuro */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceGlow} />
            <Text style={styles.balanceLabel}>Balance del condominio</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceCurrency}>Bs.</Text>
              <Text style={styles.balanceAmount}>{fmtNum(FINANCE_KPIS.balance)}</Text>
            </View>
            <View style={styles.balanceFooter}>
              <View style={styles.balanceCol}>
                <Text style={styles.balanceColLabel}>INGRESOS</Text>
                <View style={styles.balanceColRow}>
                  <Text style={[styles.balanceColValue, { color: colors.incomeOnDark }]}>
                    +{fmtNum(FINANCE_KPIS.incomeMonth)}
                  </Text>
                  <Sparkline
                    data={INCOME_TREND}
                    color={colors.incomeOnDark}
                    width={44}
                    height={18}
                    fill={false}
                  />
                </View>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceCol}>
                <Text style={styles.balanceColLabel}>EGRESOS</Text>
                <View style={styles.balanceColRow}>
                  <Text style={[styles.balanceColValue, { color: colors.expenseOnDark }]}>
                    −{fmtNum(FINANCE_KPIS.expenseMonth)}
                  </Text>
                  <Sparkline
                    data={EXPENSE_TREND}
                    color={colors.expenseOnDark}
                    width={44}
                    height={18}
                    fill={false}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Grid 2x2 de KPIs */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCol}>
            <KPICard
              icon="people"
              label="Residentes"
              value="152"
              sub="71 unidades ocupadas"
              tone="primary"
            />
          </View>
          <View style={styles.kpiCol}>
            <KPICard
              icon="alert-circle"
              label="Morosos"
              value={String(FINANCE_KPIS.overdue)}
              sub={fmt(FINANCE_KPIS.overdueAmount)}
              tone="danger"
              onPress={() => router.push('/debtors')}
            />
          </View>
          <View style={styles.kpiCol}>
            <KPICard
              icon="checkmark-circle"
              label="Cobranza"
              value={`${FINANCE_KPIS.collectionRate}%`}
              sub="+5% vs mes pasado"
              tone="success"
            />
          </View>
          <View style={styles.kpiCol}>
            <KPICard
              icon="key"
              label="Visitas hoy"
              value="2"
              sub="5 registros totales"
              tone="neutral"
            />
          </View>
        </View>

        {/* Pagos recientes */}
        <SectionHead
          title="Pagos recientes"
          action="Ver todos"
          onAction={() => router.push('/(tabs)/payments')}
        />
        <View style={styles.paymentList}>
          {recentPayments.map((p) => {
            const isMonthly = p.type === 'Mensualidad';
            const tone = isMonthly ? tones.primary : tones.success;
            return (
              <View key={p.id} style={styles.paymentRow}>
                <View style={[styles.paymentIcon, { backgroundColor: tone.bgStrong }]}>
                  <Ionicons name="wallet" size={18} color={tone.fgStrong} />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentName} numberOfLines={1}>
                    {p.resident}
                  </Text>
                  <Text style={styles.paymentMeta}>
                    {p.unit} · {p.type} · {p.date}
                  </Text>
                </View>
                <Text style={styles.paymentAmount}>+{p.amount.toFixed(2)}</Text>
              </View>
            );
          })}
        </View>

        {/* Acciones rápidas */}
        <SectionHead title="Acciones rápidas" />
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((a) => (
            <Pressable
              key={a.label}
              onPress={() => handleQuickAction(a.label)}
              style={({ pressed }) => [styles.actionTile, pressed && { opacity: 0.7 }]}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.color + '15' }]}>
                <Ionicons name={a.icon} size={19} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Último anuncio */}
        <SectionHead
          title="Último anuncio"
          action="Ver todos"
          onAction={() => router.push('/(tabs)/announcements')}
        />
        {pinned ? (
          <View style={styles.announcementWrap}>
            <View style={styles.announcementCard}>
              <View style={styles.announcementHead}>
                <Ionicons name="pin" size={14} color="#ca8a04" />
                <Pill tone="warning">{pinned.category}</Pill>
                <Text style={styles.announcementDate}>{pinned.date}</Text>
              </View>
              <Text style={styles.announcementTitle}>{pinned.title}</Text>
              <Text style={styles.announcementBody} numberOfLines={2}>
                {pinned.body}
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    paddingBottom: spacing.scrollerBottom,
  },

  // Hero
  hero: {
    paddingHorizontal: spacing.screen,
    paddingTop: 14,
    paddingBottom: 18,
    // Aproximación al degradé azul claro → blanco del prototipo.
    backgroundColor: '#eff6ff',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 13,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.7,
    lineHeight: 29,
  },
  heroTitleLight: {
    fontWeight: fontWeight.light,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 6,
  },

  // Balance card
  balanceCard: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius['3xl'],
    paddingVertical: 18,
    paddingHorizontal: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  balanceGlow: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(37,99,235,0.25)',
    opacity: 0.8,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 10,
  },
  balanceCurrency: {
    fontSize: 16,
    fontWeight: fontWeight.medium,
    color: 'rgba(255,255,255,0.6)',
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: fontWeight.light,
    color: '#fff',
    letterSpacing: -0.7,
    fontVariant: ['tabular-nums'],
  },
  balanceFooter: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'stretch',
  },
  balanceCol: {
    flex: 0,
  },
  balanceColLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  balanceColRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceColValue: {
    fontSize: 15,
    fontWeight: fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
  balanceDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // KPI grid
  kpiGrid: {
    paddingHorizontal: spacing.screen,
    paddingTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCol: {
    width: '48%',
    flexGrow: 1,
  },

  // Pagos
  paymentList: {
    paddingHorizontal: spacing.screen,
    gap: 6,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSoft,
  },
  paymentIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentInfo: {
    flex: 1,
    minWidth: 0,
  },
  paymentName: {
    fontSize: 14,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  paymentMeta: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
    marginTop: 1,
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: fontWeight.bold,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },

  // Quick actions
  actionsGrid: {
    paddingHorizontal: spacing.screen,
    flexDirection: 'row',
    gap: 10,
  },
  actionTile: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 13,
  },

  // Anuncio
  announcementWrap: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 8,
  },
  announcementCard: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: radius.xl,
    padding: 16,
  },
  announcementHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  announcementDate: {
    fontSize: 11,
    color: '#78716c',
    fontWeight: fontWeight.medium,
    marginLeft: 'auto',
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.15,
    marginBottom: 4,
  },
  announcementBody: {
    fontSize: 13,
    color: '#44403c',
    lineHeight: 18,
  },
});
