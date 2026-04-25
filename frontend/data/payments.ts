import { Payment } from './types';

export const PAYMENTS: Payment[] = [
  { id: 1, resident: 'María Fernández',  unit: 'A-12B',   amount: 85.00, date: '22 Abr', type: 'Mensualidad', status: 'completado', method: 'Transferencia' },
  { id: 2, resident: 'Ana Morales',      unit: 'C-14',    amount: 85.00, date: '22 Abr', type: 'Mensualidad', status: 'completado', method: 'Pago Móvil' },
  { id: 3, resident: 'Luisa Contreras',  unit: 'C-15D',   amount: 42.50, date: '21 Abr', type: 'Abono',       status: 'completado', method: 'Efectivo' },
  { id: 4, resident: 'Diego Blanco',     unit: 'A-20A',   amount: 85.00, date: '20 Abr', type: 'Mensualidad', status: 'completado', method: 'Transferencia' },
  { id: 5, resident: 'Roberto Guzmán',   unit: 'Casa 07', amount: 85.00, date: '19 Abr', type: 'Mensualidad', status: 'completado', method: 'Pago Móvil' },
  { id: 6, resident: 'Patricia Silva',   unit: 'B-03B',   amount: 30.00, date: '18 Abr', type: 'Abono',       status: 'pendiente',  method: 'Transferencia' },
  { id: 7, resident: 'José Pérez',       unit: 'A-05C',   amount: 50.00, date: '15 Abr', type: 'Abono',       status: 'completado', method: 'Efectivo' },
];

// Resumen rápido para la banda superior de la pantalla de Pagos
export const PAYMENTS_SUMMARY = {
  cobrado: 12750,
  pendiente: 435,
  moroso: 850,
};
