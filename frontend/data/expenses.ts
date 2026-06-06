import { api } from '../services/api';

export type ExpenseCategory = 'MANTENIMIENTO' | 'SEGURIDAD' | 'SERVICIOS' | 'ADMINISTRACION' | 'OTROS';

export const EXPENSE_CATEGORIES_MAP: Record<ExpenseCategory, string> = {
  MANTENIMIENTO: 'Mantenimiento',
  SEGURIDAD: 'Seguridad',
  SERVICIOS: 'Servicios',
  ADMINISTRACION: 'Administración',
  OTROS: 'Otros',
};

export interface Expense {
  id: number;
  categoria: ExpenseCategory;
  categoria_display: string;
  descripcion: string;
  monto: number;
  fecha: string; // YYYY-MM-DD
  torre: string;
  comprobante: string | null; // URL
  fecha_creacion: string;
}

export interface TowerSummary {
  torre: string;
  mes: number;
  ano: number;
  ingresos_mes: number;
  gastos_mes: number;
  balance_disponible: number;
}

export async function fetchExpenses(filters: {
  torre?: string;
  categoria?: string;
  mes?: number;
  ano?: number;
} = {}): Promise<Expense[]> {
  const params: Record<string, any> = {};
  if (filters.torre && filters.torre !== 'TODOS') params.torre = filters.torre;
  if (filters.categoria) params.categoria = filters.categoria;
  if (filters.mes) params.mes = filters.mes;
  if (filters.ano) params.ano = filters.ano;

  const res = await api.get<{ gastos: Expense[] }>('/pagos/gastos/', { params });
  return res.data.gastos || [];
}

export async function createExpense(formData: FormData): Promise<Expense> {
  const res = await api.post<{ gasto: Expense }>('/pagos/gastos/crear/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data.gasto;
}

export async function updateExpense(id: number, formData: FormData): Promise<Expense> {
  const res = await api.post<{ gasto: Expense }>(`/pagos/gastos/editar/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data.gasto;
}

export async function fetchTowerSummary(
  torre: string,
  mes?: number,
  ano?: number
): Promise<TowerSummary> {
  const params: Record<string, any> = { torre };
  if (mes !== undefined) params.mes = mes;
  if (ano !== undefined) params.ano = ano;

  const res = await api.get<TowerSummary>('/pagos/resumen-torre/', { params });
  return res.data;
}
