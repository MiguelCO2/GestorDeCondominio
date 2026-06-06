import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../services/api";

import { AnnouncementModal } from "../../components/modals/AnnouncementModal";
import { ConfirmDialog } from "../../components/modals/ConfirmDialog";
import { NoticeDialog } from "../../components/modals/NoticeDialog";
import { AppBar } from "../../components/ui/AppBar";
import { FAB } from "../../components/ui/FAB";
import { IconBtn } from "../../components/ui/IconBtn";
import { Pill } from "../../components/ui/Pill";
import { SearchField } from "../../components/ui/SearchField";
import { SectionHead } from "../../components/ui/SectionHead";
import {
  colors,
  fontWeight,
  radius,
  shadow,
  spacing,
} from "../../constants/theme";

import type { AnnouncementCategory } from "../../data/types";

type MenuAnchor = { x: number; y: number; width: number; height: number };

const OVERFLOW_MENU_W = 188;
const OVERFLOW_MENU_H = 112;

function computeMenuPosition(anchor: MenuAnchor) {
  const win = Dimensions.get("window");
  const GAP = 6;
  const pad = spacing.screen;

  let left = anchor.x + anchor.width - OVERFLOW_MENU_W;
  left = Math.max(
    pad,
    Math.min(left, win.width - OVERFLOW_MENU_W - pad),
  );

  let top = anchor.y + anchor.height + GAP;
  if (top + OVERFLOW_MENU_H > win.height - 28) {
    top = anchor.y - OVERFLOW_MENU_H - GAP;
  }
  top = Math.max(
    16,
    Math.min(top, win.height - OVERFLOW_MENU_H - 24),
  );

  return { top, left };
}

function OverflowMenuTrigger({
  onOpen,
}: {
  onOpen: (anchor: MenuAnchor) => void;
}) {
  const anchorRef = useRef<View>(null);

  return (
    <View ref={anchorRef} collapsable={false}>
      <IconBtn
        icon="ellipsis-vertical"
        onPress={() => {
          anchorRef.current?.measureInWindow((x, y, width, height) => {
            onOpen({ x, y, width, height });
          });
        }}
      />
    </View>
  );
}

// Tono de Pill según categoría del anuncio
const categoryTone = (c: AnnouncementCategory) => {
  switch (c) {
    case "Mantenimiento":
      return "warning";
    case "Asamblea":
      return "primary";
    case "Seguridad":
      return "danger";
    case "Áreas Comunes":
      return "info";
  }
};

export default function AnnouncementsScreen() {
  const { create: createParam } = useLocalSearchParams<{
    create?: string | string[];
  }>();
  const router = useRouter();
  const createFlag = Array.isArray(createParam)
    ? createParam[0]
    : createParam;

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AnnouncementCategory | "TODOS">("TODOS");
  const [showFilters, setShowFilters] = useState(false);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementEditDraft, setAnnouncementEditDraft] = useState<{
    id: number;
    title: string;
    body: string;
    category: AnnouncementCategory;
    pinned: boolean;
  } | null>(null);

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [cardMenu, setCardMenu] = useState<{
    announcement: any;
    anchor: MenuAnchor;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [notice, setNotice] = useState<{
    title: string;
    message: string;
    variant: "success" | "error";
    emoji?: string;
  } | null>(null);

  const pinned = announcements.filter((a) => {
    if (!a.pinned) return false;
    if (selectedCategory !== "TODOS" && a.category !== selectedCategory) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q)
    );
  });

  const others = announcements.filter((a) => {
    if (a.pinned) return false;
    if (selectedCategory !== "TODOS" && a.category !== selectedCategory) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q)
    );
  });

  const handleNewAnnouncement = () => {
    setAnnouncementEditDraft(null);
    setAnnouncementModalOpen(true);
  };

  useEffect(() => {
    if (createFlag !== "1") {
      return;
    }
    setAnnouncementEditDraft(null);
    setAnnouncementModalOpen(true);
    router.setParams({ create: undefined });
  }, [createFlag, router]);

  const openEditAnnouncement = (announcement: any) => {
    setAnnouncementEditDraft({
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      category: announcement.category,
      pinned: !!announcement.pinned,
    });
    setAnnouncementModalOpen(true);
  };

  const runDeleteAnnouncement = async () => {
    if (!deleteTarget?.id) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/announcements/${deleteTarget.id}/`);
      setDeleteTarget(null);
      await fetchAnnouncements();
      setNotice({
        title: "Listo",
        message: "Anuncio eliminado correctamente.",
        variant: "success",
        emoji: "✅",
      });
    } catch (error) {
      console.log(error);
      setDeleteTarget(null);
      setNotice({
        title: "No se pudo eliminar",
        message:
          "Comprueba tu conexión o inténtalo de nuevo en unos segundos.",
        variant: "error",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get("/announcements/");
      const data = response.data;

      const formatted = data
        .map((item: any) => ({
          id: item.id,
          title: item.title,
          body: item.content,
          category:
            item.category === "maintenance"
              ? "Mantenimiento"
              : item.category === "assembly"
                ? "Asamblea"
                : item.category === "security"
                  ? "Seguridad"
                  : "Áreas Comunes",

          author: "Administración",
          date: "Reciente",
          pinned: !!item.pinned,
          reads: 0,
          createdAt: item.created_at ?? "",
        }))
        .sort(
          (
            a: { pinned: boolean; createdAt: string },
            b: { pinned: boolean; createdAt: string },
          ) => {
            if (a.pinned !== b.pinned) {
              return a.pinned ? -1 : 1;
            }
            const ta = Date.parse(a.createdAt) || 0;
            const tb = Date.parse(b.createdAt) || 0;
            return tb - ta;
          },
        );

      setAnnouncements(formatted);
    } catch (error) {
      console.log("Error cargando anuncios", error);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroller}>
        <AppBar
          title="Anuncios"
          subtitle={`${announcements.length} publicados`}
          large
          right={
            <IconBtn
              icon="add"
              tone="primary"
              onPress={handleNewAnnouncement}
            />
          }
        />

        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar anuncio…"
        />

        {/* Botón de Filtros */}
        <View style={{ flexDirection: "row", justifyContent: "flex-start", paddingHorizontal: spacing.screen, marginBottom: 8, marginTop: 4 }}>
          <Pressable 
            onPress={() => setShowFilters(!showFilters)}
            style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
          >
            <Ionicons name="options-outline" size={16} color={showFilters ? "#fff" : colors.text} />
            <Text style={[styles.filterBtnText, showFilters && styles.filterBtnTextActive]}>Filtros</Text>
          </Pressable>
        </View>

        {showFilters && (
          <View style={styles.collapsibleFilters}>
            <View style={styles.filtersHeader}>
              <Ionicons name="funnel-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.filtersTitle}>Filtrar por Categoría</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
              <Pressable
                onPress={() => setSelectedCategory("TODOS")}
                style={[styles.catFilterPill, selectedCategory === "TODOS" && styles.catFilterPillActive]}
              >
                <Text style={[styles.catFilterText, selectedCategory === "TODOS" && styles.catFilterTextActive]}>Todas</Text>
              </Pressable>
              {(["Mantenimiento", "Asamblea", "Seguridad", "Áreas Comunes"] as AnnouncementCategory[]).map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[styles.catFilterPill, selectedCategory === cat && styles.catFilterPillActive]}
                >
                  <Text style={[styles.catFilterText, selectedCategory === cat && styles.catFilterTextActive]}>{cat}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {pinned.length > 0 && (
          <>
            <SectionHead title="Fijados" />
            <View style={styles.pinnedList}>
              {pinned.map((a) => (
                <View key={a.id} style={styles.pinnedCard}>
                  <View style={styles.cardTop}>
                    <Text
                      style={styles.pinnedEmoji}
                      accessibilityLabel="Anuncio fijado"
                    >
                      📌
                    </Text>
                    <Pill tone={categoryTone(a.category)}>{a.category}</Pill>
                    <Text style={styles.date}>{a.date}</Text>
                    <OverflowMenuTrigger
                      onOpen={(anchor) =>
                        setCardMenu({ announcement: a, anchor })
                      }
                    />
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

                  <OverflowMenuTrigger
                    onOpen={(anchor) =>
                      setCardMenu({ announcement: a, anchor })
                    }
                  />
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

      <Modal
        visible={!!cardMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setCardMenu(null)}
      >
        <View style={styles.overflowModalRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setCardMenu(null)}
          />
          {cardMenu ? (
            <View
              style={[
                styles.overflowMenu,
                {
                  top: computeMenuPosition(cardMenu.anchor).top,
                  left: computeMenuPosition(cardMenu.anchor).left,
                  width: OVERFLOW_MENU_W,
                },
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.overflowItem,
                  { opacity: pressed ? 0.75 : 1 },
                ]}
                onPress={() => {
                  const a = cardMenu.announcement;
                  setCardMenu(null);
                  openEditAnnouncement(a);
                }}
              >
                <Ionicons
                  name="pencil-outline"
                  size={18}
                  color={colors.text}
                />
                <Text style={styles.overflowItemLabel}>Editar</Text>
              </Pressable>
              <View style={styles.overflowDivider} />
              <Pressable
                style={({ pressed }) => [
                  styles.overflowItem,
                  { opacity: pressed ? 0.75 : 1 },
                ]}
                onPress={() => {
                  const a = cardMenu.announcement;
                  setCardMenu(null);
                  setDeleteTarget(a);
                }}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color="#dc2626"
                />
                <Text style={styles.overflowItemLabelDanger}>Eliminar</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </Modal>

      <ConfirmDialog
        visible={!!deleteTarget}
        title="¿Eliminar anuncio?"
        message={
          deleteTarget
            ? `Se eliminará «${deleteTarget.title}». Esta acción no se puede deshacer.`
            : ""
        }
        cancelLabel="Cancelar"
        confirmLabel="Eliminar"
        confirmVariant="danger"
        confirmLoading={deleteLoading}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={runDeleteAnnouncement}
      />

      <NoticeDialog
        visible={!!notice}
        title={notice?.title ?? ""}
        message={notice?.message ?? ""}
        variant={notice?.variant ?? "success"}
        emoji={notice?.emoji}
        onDismiss={() => setNotice(null)}
      />

      <AnnouncementModal
        visible={announcementModalOpen}
        editTarget={announcementEditDraft}
        onNotify={(p) => setNotice(p)}
        onClose={() => {
          setAnnouncementModalOpen(false);
          setAnnouncementEditDraft(null);
        }}
        onSubmit={async ({ isEdit }) => {
          await fetchAnnouncements();
          setNotice({
            title: "Listo",
            message: isEdit
              ? "Los cambios del anuncio se guardaron correctamente."
              : "Tu anuncio ya está publicado.",
            variant: "success",
            emoji: isEdit ? "✏️" : "📣",
          });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  scroller: { paddingBottom: spacing.scrollerBottom },

  overflowModalRoot: {
    flex: 1,
  },
  overflowMenu: {
    position: "absolute",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadow.card,
  },
  overflowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  overflowItemLabel: {
    fontSize: 14.5,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    letterSpacing: -0.1,
  },
  overflowItemLabelDanger: {
    fontSize: 14.5,
    fontWeight: fontWeight.semibold,
    color: "#b91c1c",
    letterSpacing: -0.1,
  },
  overflowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: 10,
  },

  // Fila superior común (icon/pill + fecha a la derecha)
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  date: {
    marginLeft: "auto",
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
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: radius["2xl"],
    padding: 16,
  },
  pinnedEmoji: {
    fontSize: 16,
    lineHeight: 20,
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
    color: "#334155",
    lineHeight: 20, // ~13.5 * 1.5
    marginBottom: 10,
  },
  pinnedFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },

  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
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
    color: "#fff",
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
  filtersHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.screen,
    gap: 6,
    marginBottom: 8,
  },
  filtersTitle: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  catScroll: {
    paddingHorizontal: spacing.screen,
    gap: 6,
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
    backgroundColor: colors.primary + "15",
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

  // Lista general
  list: {
    paddingHorizontal: spacing.screen,
    gap: 8,
  },
  card: {
    backgroundColor: "#fff",
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
    color: "#475569",
    lineHeight: 19, // ~13 * 1.45
  },

  empty: {
    paddingVertical: 28,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
});
