import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { api } from '../services/api';
import type { Payment, PaymentMethod, PaymentType } from './types';

/** Mock conservado para pantallas que aún no consumen API (ej. inicio). */
export const PAYMENTS: Payment[] = [
  { id: 1, resident: 'María Fernández', unit: 'A-12B', amount: 85.0, date: '22 Abr', type: 'Mensualidad', status: 'completado', method: 'Transferencia' },
  { id: 2, resident: 'Ana Morales', unit: 'C-14', amount: 85.0, date: '22 Abr', type: 'Mensualidad', status: 'completado', method: 'Pago Móvil' },
  { id: 3, resident: 'Luisa Contreras', unit: 'C-15D', amount: 42.5, date: '21 Abr', type: 'Abono', status: 'completado', method: 'Efectivo' },
];

export const PAYMENTS_SUMMARY = {
  cobrado: 12750,
  pendiente: 435,
  moroso: 850,
};

export type PaymentsSummary = {
  cobrado: number;
  pendiente: number;
  moroso: number;
};

type PaymentApiRow = Payment & {
  monto?: string;
  tipo?: string;
  estado?: string;
};

function mapPayment(row: PaymentApiRow): Payment {
  return {
    id: row.id,
    resident: row.resident ?? '',
    unit: row.unit ?? '',
    amount: typeof row.amount === 'number' ? row.amount : parseFloat(String(row.monto ?? 0)),
    date: row.date ?? '',
    type: (row.type as PaymentType) ?? 'Mensualidad',
    status: row.status === 'completado' ? 'completado' : 'pendiente',
    method: (row.method as PaymentMethod) ?? 'Transferencia',
    document_id: row.document_id,
    building: row.building,
    floor: row.floor,
    unit_number: row.unit_number,
    month: row.month,
    due_date: row.due_date,
    payment_date: row.payment_date,
  };
}

function mapSummary(data: Record<string, number>): PaymentsSummary {
  return {
    cobrado: data.cobrado ?? data.total_cobrado ?? 0,
    pendiente: data.pendiente ?? data.total_pendiente ?? 0,
    moroso: data.moroso ?? data.total_morosos ?? 0,
  };
}

export async function fetchPaymentsSummary(): Promise<PaymentsSummary> {
  const res = await api.get('/pagos/resumen/');
  return mapSummary(res.data);
}

export async function fetchAllPayments(): Promise<Payment[]> {
  const res = await api.get<{ pagos: PaymentApiRow[] }>('/pagos/todos/');
  return (res.data.pagos ?? []).map(mapPayment);
}

export async function createPayment(payload: {
  type: PaymentType;
  amount: number;
  method: PaymentMethod;
  resident: string;
}): Promise<Payment> {
  const res = await api.post<{ pago: PaymentApiRow }>('/pagos/crear/', {
    type: payload.type,
    amount: payload.amount,
    method: payload.method,
    resident: payload.resident,
  });
  return mapPayment(res.data.pago);
}

export function usePaymentsData() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentsSummary>({
    cobrado: 0,
    pendiente: 0,
    moroso: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, sum] = await Promise.all([fetchAllPayments(), fetchPaymentsSummary()]);
      setPayments(list);
      setSummary(sum);
    } catch {
      setError('No se pudieron cargar los pagos. Verifica la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const registerPayment = useCallback(
    async (payload: {
      type: PaymentType;
      amount: number;
      method: PaymentMethod;
      resident: string;
    }) => {
      const created = await createPayment(payload);
      setPayments((prev) => [created, ...prev]);
      const sum = await fetchPaymentsSummary();
      setSummary(sum);
      return created;
    },
    [],
  );

  return { payments, summary, loading, error, reload, registerPayment };
}
