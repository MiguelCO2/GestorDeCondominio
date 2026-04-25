import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar } from '../components/ui/AppBar';
import { Avatar } from '../components/ui/Avatar';
import { Btn } from '../components/ui/Btn';
import { SectionHead } from '../components/ui/SectionHead';
import { colors, radius, severityTone, spacing } from '../constants/theme';
import { DEBTORS } from '../data/debtors';
import { fmtNum } from '../data/format';
import type { Debtor, DebtorSeverity } from '../data/types';

// Etiqueta visible del badge según severidad.
const severityLabel: Record<DebtorSeverity, string> = {
  baja: 'BAJA',
  media: 'MEDIA',
  alta: 'ALTA',
  critica: 'CRÍTICA',
};

export default function DebtorsScreen() {
  const router = useRouter();

  const total = DEBTORS.reduce((a, d) => a + d.amount, 0);

  const handleContact = (d: Debtor) => Alert.alert('Contactar', d.name);
  const handleRegisterPayment = (d: Debtor) =>
    Alert.alert('Registrar pago', d.name);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroller}>
        <AppBar
          title="Morosos"
          subtitle="Seguimiento de cobranza"
          back
          onBack={() => router.back()}
        />

        {/* Hero card de total morosidad */}
        <View style={styles.heroWrap}>
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <Ionicons name="alert-circle" size={15} color="#dc2626" />
              <Text style={styles.heroLabel}>TOTAL MOROSIDAD</Text>
            </View>
            <View style={styles.heroAmountRow}>
              <Text style={styles.heroCurrency}>Bs.</Text>
              <Text style={styles.heroAmount}>{fmtNum(total, 2)}</Text>
            </View>
            <Text style={styles.heroFoot}>
              {DEBTORS.length} unidades con saldo vencido
            </Text>
          </View>
        </View>

        <SectionHead title="Residentes morosos" />

        {/* Lista de morosos */}
        <View style={styles.list}>
          {DEBTORS.map((d) => {
            const sev = severityTone[d.severity];
            return (
              <View key={d.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Avatar text={d.avatar} color={d.color} size={44} />
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.name}>{d.name}</Text>
                    <Text style={styles.unit}>{d.unit}</Text>
                  </View>
                  <View
                    style={[styles.badge, { backgroundColor: sev.bg }]}
                  >
                    <Text style={[styles.badgeText, { color: sev.fg }]}>
                      {severityLabel[d.severity]}
                    </Text>
                  </View>
                </View>

                <View style={styles.info}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>MESES</Text>
                    <Text style={styles.infoValue}>{d.months}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>DEUDA</Text>
                    <Text style={[styles.infoValue, styles.infoDebt]}>
                      {d.amount.toFixed(0)}
                    </Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>ÚLTIMO</Text>
                    <Text style={styles.infoLast}>{d.lastPayment}</Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <Btn
                    size="sm"
                    variant="secondary"
                    icon="call"
                    onPress={() => handleContact(d)}
                  >
                    Contactar
                  </Btn>
                  <Btn
                    size="sm"
                    variant="primary"
                    icon="send"
                    onPress={() => handleRegisterPayment(d)}
                  >
                    Registrar pago
                  </Btn>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroller: { paddingBottom: spacing.scrollerBottom },

  // Hero
  heroWrap: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 14,
  },
  heroCard: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: radius['3xl'],
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#991b1b',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 4,
  },
  heroCurrency: {
    fontSize: 13,
    fontWeight: '500',
    color: '#991b1b',
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '300',
    color: '#7f1d1d',
    letterSpacing: -0.7,
    fontVariant: ['tabular-nums'],
  },
  heroFoot: {
    fontSize: 13,
    fontWeight: '500',
    color: '#991b1b',
  },

  // Lista
  list: {
    paddingHorizontal: spacing.screen,
    gap: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.xl,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cardHeaderText: { flex: 1, minWidth: 0 },
  name: {
    fontSize: 14.5,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  unit: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Bloque info 3 columnas
  info: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
    borderRadius: radius.sm,
    marginBottom: 12,
    gap: 10,
  },
  infoCol: { flex: 1 },
  infoLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 1,
    letterSpacing: -0.2,
  },
  infoDebt: {
    color: '#dc2626',
    fontVariant: ['tabular-nums'],
  },
  infoLast: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginTop: 3,
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
  },
});
