// Tipos del dominio. Mantengo los strings tal cual los muestra la UI
// (ej: "Mensualidad" / "Abono") para no andar mapeando.

export type ResidentStatus = 'al-dia' | 'moroso' | 'pendiente';

export interface Resident {
  id: number;
  name: string;
  unit: string;
  phone: string;
  email: string;
  since: string;
  status: ResidentStatus;
  avatar: string;
  color: string;
}

export type PaymentType = 'Mensualidad' | 'Abono';
export type PaymentMethod = 'Transferencia' | 'Pago Móvil' | 'Efectivo';
export type PaymentStatus = 'completado' | 'pendiente';

export interface Payment {
  id: number;
  resident: string;
  unit: string;
  amount: number;
  date: string;
  type: PaymentType;
  status: PaymentStatus;
  method: PaymentMethod;
}

export type DebtorSeverity = 'baja' | 'media' | 'alta' | 'critica';

export interface Debtor {
  id: number;
  name: string;
  unit: string;
  months: number;
  amount: number;
  lastPayment: string;
  avatar: string;
  color: string;
  severity: DebtorSeverity;
}

export type AnnouncementCategory =
  | 'Mantenimiento'
  | 'Asamblea'
  | 'Seguridad'
  | 'Áreas Comunes';

export interface Announcement {
  id: number;
  title: string;
  body: string;
  category: AnnouncementCategory;
  author: string;
  date: string;
  pinned: boolean;
  reads: number;
}

export interface Property {
  id: number;
  name: string;
  type: string;
  units: number;
  occupied: number;
  area: string;
}

export interface Amenity {
  id: number;
  name: string;
  capacity: number;
  nextAvailable: string;
  bookings: number;
  icon: 'party' | 'pool' | 'court' | 'bbq' | 'gym' | 'work';
}

export interface Booking {
  id: number;
  amenity: string;
  resident: string;
  date: string;
  time: string;
  status: 'confirmada' | 'pendiente';
}

export interface Visit {
  id: number;
  visitor: string;
  host: string;
  unit: string;
  entry: string;
  exit: string | null;
  purpose: string;
  vehicle: string | null;
  status: 'activa' | 'completada';
}

export interface FinanceKpis {
  incomeMonth: number;
  expenseMonth: number;
  balance: number;
  collectionRate: number;
  totalUnits: number;
  occupied: number;
  activeVisits: number;
  pendingPayments: number;
  overdue: number;
  overdueAmount: number;
}
