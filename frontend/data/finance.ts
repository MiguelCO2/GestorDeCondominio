import { FinanceKpis } from './types';

export const FINANCE_KPIS: FinanceKpis = {
  incomeMonth: 12750.00,
  expenseMonth: 8420.50,
  balance: 42680.75,
  collectionRate: 87,
  totalUnits: 78,
  occupied: 71,
  activeVisits: 2,
  pendingPayments: 9,
  overdue: 4,
  overdueAmount: 850.00,
};

// Tendencia mensual (últimos 6 meses) para sparklines y gráfica de Reportes
export const INCOME_TREND  = [9200, 10400,  9800, 11200, 10800, 12750];
export const EXPENSE_TREND = [7800,  8100,  7600,  8300,  8000,  8420];
