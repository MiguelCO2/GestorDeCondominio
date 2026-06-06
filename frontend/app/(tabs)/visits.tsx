import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';


// REEMPLAZA CON LA IP LOCAL DE TU COMPUTADORA
const API_URL = 'http://192.168.1.104:8000/api/visits/visitas/';


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

export default function VisitasScreen() {
    const [visitas, setVisitas] = useState([]);
    const [cargando, setCargando] = useState(true);
  
    const obtenerVisitas = async () => {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        setVisitas(data);
      } catch (error) {
        console.error("Error al conectar con Django:", error);
        Alert.alert("Error de Conexión", "No se pudo sincronizar con el condominio.");
      } finally {
        setCargando(false);
      }
    };
  
    useEffect(() => {
      obtenerVisitas();
    }, []);
  
    const visitasActivas = visitas.filter(v => v.activa === true);
    const visitasCompletadas = visitas.filter(v => v.activa === false);
  
    const formatearHora = (fechaString) => {
      if (!fechaString) return "";
      const fecha = new Date(fechaString);
      return fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    };
  
    if (cargando) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0F172A" />
          <Text style={{ marginTop: 10, color: '#64748B' }}>Cargando control de acceso...</Text>
        </View>
      );
    }
  
    return (
      <View style={styles.container}>
        
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.subHeaderTitle}>Registro de acceso</Text>
            <Text style={styles.headerTitle}>Visitas</Text>
          </View>
          <TouchableOpacity style={[styles.iconButton, styles.qrButton]}>
            <Ionicons name="qr-code-outline" size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>
  
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          
          {/* --- TARJETAS DE RESUMEN (BENTO STATS) --- */}
          <View style={styles.statsContainer}>
            <View style={[styles.statBox, { backgroundColor: '#E2F1E8' }]}>
              <Text style={[styles.statLabel, { color: '#2E6243' }]}>ACTIVAS</Text>
              <Text style={[styles.statNumber, { color: '#2E6243' }]}>{visitasActivas.length}</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#F1F5F9' }]}>
              <Text style={[styles.statLabel, { color: '#0F172A' }]}>HOY</Text>
              <Text style={[styles.statNumber, { color: '#0F172A' }]}>{visitas.length}</Text>
            </View>
          </View>
  
          {/* --- SECCIÓN: DENTRO DEL CONDOMINIO (ACTIVAS) --- */}
          <Text style={styles.sectionTitle}>Dentro del condominio</Text>
          {visitasActivas.length === 0 ? (
            <Text style={styles.emptyText}>No hay visitantes activos en este momento.</Text>
          ) : (
            visitasActivas.map((item) => (
              <View key={item.id} style={styles.activeCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.visitorName}>{item.nombre_visitante}</Text>
                  <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>ACTIVA</Text>
                  </View>
                </View>
                <Text style={styles.visitorDetail}>
                  Visita a {item.nombre_residente} · <Text style={styles.boldText}>{item.apartamento_destino}</Text>
                </Text>
                
                <View style={styles.cardFooter}>
                  <View style={styles.footerItem}>
                    <Ionicons name="time-outline" size={15} color="#64748B" />
                    <Text style={styles.footerText}>Entrada {formatearHora(item.hora_entrada)}</Text>
                  </View>
                  {item.placa_vehiculo && (
                    <View style={[styles.footerItem, { marginLeft: 16 }]}>
                      <Ionicons name="car-outline" size={16} color="#64748B" />
                      <Text style={styles.footerText}>{item.placa_vehiculo.toUpperCase()}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
  
          {/* --- SECCIÓN: COMPLETADAS HOY --- */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Completadas hoy</Text>
          {visitasCompletadas.length === 0 ? (
            <Text style={styles.emptyText}>No hay visitas completadas el día de hoy.</Text>
          ) : (
            visitasCompletadas.map((item) => (
              <View key={item.id} style={styles.completedCard}>
                <View style={styles.completedIconContainer}>
                  {/* Ícono de check estilizado con Ionicons */}
                  <Ionicons name="checkmark-circle" size={24} color="#2563EB" />
                </View>
                
                <View style={styles.completedInfo}>
                  <Text style={styles.completedVisitorName}>{item.nombre_visitante}</Text>
                  <Text style={styles.completedDetail}>
                    {item.nombre_residente} · {item.apartamento_destino}
                  </Text>
                  <Text style={styles.motivoText}>{item.motivo}</Text>
                </View>
  
                <View style={styles.timeRangeContainer}>
                  <Text style={styles.timeRangeText}>
                    {formatearHora(item.hora_entrada)} → {formatearHora(item.hora_salida)}
                  </Text>
                </View>
              </View>
            ))
          )}
  
        </ScrollView>
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 20,
      paddingTop: 60,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: '#F8FAFC',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#F1F5F9',
    },
    qrButton: {
      backgroundColor: '#EFF6FF',
      borderColor: '#DBEAFE',
    },
    headerTitleContainer: {
      flex: 1,
      marginLeft: 16,
    },
    subHeaderTitle: {
      fontSize: 13,
      color: '#64748B',
      fontWeight: '600',
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: '#0F172A',
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 28,
    },
    statBox: {
      flex: 1,
      padding: 16,
      borderRadius: 16,
      justifyContent: 'center',
    },
    statLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    statNumber: {
      fontSize: 32,
      fontWeight: '800',
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#0F172A',
      marginBottom: 14,
    },
    emptyText: {
      fontSize: 14,
      color: '#94A3B8',
      fontStyle: 'italic',
      paddingVertical: 10,
    },
    // --- ESTILOS TARJETAS ACTIVAS ---
    activeCard: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 20,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    visitorName: {
      fontSize: 16,
      fontWeight: '700',
      color: '#0F172A',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#E2F1E8',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 20,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#16A34A',
      marginRight: 6,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#16A34A',
    },
    visitorDetail: {
      fontSize: 14,
      color: '#475569',
      marginBottom: 12,
    },
    boldText: {
      fontWeight: '600',
      color: '#0F172A',
    },
    cardFooter: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: '#F1F5F9',
      paddingTop: 12,
    },
    footerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    footerText: {
      fontSize: 12,
      color: '#64748B',
      fontWeight: '500',
    },
    // --- ESTILOS TARJETAS COMPLETADAS ---
    completedCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#F1F5F9',
      borderRadius: 18,
      padding: 14,
      marginBottom: 10,
    },
    completedIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: '#F8FAFC',
      justifyContent: 'center',
      alignItems: 'center',
    },
    completedInfo: {
      flex: 1,
      marginLeft: 12,
      marginRight: 8,
    },
    completedVisitorName: {
      fontSize: 15,
      fontWeight: '700',
      color: '#0F172A',
    },
    completedDetail: {
      fontSize: 12,
      color: '#64748B',
      marginTop: 1,
    },
    motivoText: {
      fontSize: 11,
      color: '#94A3B8',
      fontWeight: '500',
      marginTop: 2,
    },
    timeRangeContainer: {
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
    timeRangeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#334155',
    },
  });