import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnnouncementModal } from '../../components/modals/AnnouncementModal';
import { AppBar } from '../../components/ui/AppBar';
import { FAB } from '../../components/ui/FAB';
import { IconBtn } from '../../components/ui/IconBtn';
import { Pill } from '../../components/ui/Pill';
import { SearchField } from '../../components/ui/SearchField';
import { SectionHead } from '../../components/ui/SectionHead';
import { colors, fontWeight, radius, spacing } from '../../constants/theme';
import { ANNOUNCEMENTS } from '../../data/announcements';
import type { AnnouncementCategory } from '../../data/types';

// Tono de Pill según categoría del anuncio
const categoryTone = (c: AnnouncementCategory) => {
  switch (c) {
    case 'Mantenimiento': return 'warning';
    case 'Asamblea':      return 'primary';
    case 'Seguridad':     return 'danger';
    case 'Áreas Comunes': return 'info';
  }
};

export default function AnnouncementsScreen() {
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);

  const pinned = ANNOUNCEMENTS.filter((a) => a.pinned);
  const others = ANNOUNCEMENTS.filter((a) => {
    if (a.pinned) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.body.toLowerCase().includes(q)
    );
  });

  const handleNewAnnouncement = () => setShowNew(true);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroller}>
        <AppBar
          title="Anuncios"
          subtitle={`${ANNOUNCEMENTS.length} publicados`}
          large
          right={<IconBtn icon="add" tone="primary" onPress={handleNewAnnouncement} />}
        />

        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar anuncio…"
        />

        {pinned.length > 0 && (
          <>
            <SectionHead title="Fijados" />
            <View style={styles.pinnedList}>
              {pinned.map((a) => (
                <View key={a.id} style={styles.pinnedCard}>
                  <View style={styles.cardTop}>
                    <Ionicons name="pin" size={13} color={colors.primary} />
                    <Pill tone={categoryTone(a.category)}>{a.category}</Pill>
                    <Text style={styles.date}>{a.date}</Text>
                  </View>
                  <Text style={styles.pinnedTitle}>{a.title}</Text>
                  <Text style={styles.pinnedBody}>{a.body}</Text>
                  <View style={styles.pinnedFooter}>
                    <Text style={styles.footerText}>{a.author}</Text>
                    <Text style={styles.footerText}>{a.reads} lecturas</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <SectionHead title="Todos los anuncios" />
        <View style={styles.list}>
          {others.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Sin resultados</Text>
            </View>
          ) : (
            others.map((a) => (
              <View key={a.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Pill tone={categoryTone(a.category)}>{a.category}</Pill>
                  <Text style={styles.date}>{a.date}</Text>
                </View>
                <Text style={styles.title}>{a.title}</Text>
                <Text style={styles.body} numberOfLines={2}>
                  {a.body}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <FAB onPress={handleNewAnnouncement} />

      <AnnouncementModal
        visible={showNew}
        onClose={() => setShowNew(false)}
        onSubmit={(a) => Alert.alert('Anuncio publicado', a.title)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroller: { paddingBottom: spacing.scrollerBottom },

  // Fila superior común (icon/pill + fecha a la derecha)
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  date: {
    marginLeft: 'auto',
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },

  // Fijados
  pinnedList: {
    paddingHorizontal: spacing.screen,
    gap: 10,
  },
  pinnedCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: radius['2xl'],
    padding: 16,
  },
  pinnedTitle: {
    fontSize: 16,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginVertical: 6,
    lineHeight: 20, // ~16 * 1.25
    letterSpacing: -0.2,
  },
  pinnedBody: {
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 20, // ~13.5 * 1.5
    marginBottom: 10,
  },
  pinnedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },

  // Lista general
  list: {
    paddingHorizontal: spacing.screen,
    gap: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.xl,
    padding: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginVertical: 4,
    letterSpacing: -0.15,
  },
  body: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19, // ~13 * 1.45
  },

  empty: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
});
