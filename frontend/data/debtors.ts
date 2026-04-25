import { Debtor } from './types';

export const DEBTORS: Debtor[] = [
  { id: 1, name: 'Carlos Rodríguez', unit: 'Torre B · 08-A',  months: 3, amount: 255.00, lastPayment: 'Ene 2026', avatar: 'CR', color: '#ea580c', severity: 'alta' },
  { id: 2, name: 'José Pérez',       unit: 'Torre A · 05-C',  months: 2, amount: 170.00, lastPayment: 'Feb 2026', avatar: 'JP', color: '#7c3aed', severity: 'media' },
  { id: 3, name: 'Fernando Ruiz',    unit: 'Casa 09',         months: 4, amount: 340.00, lastPayment: 'Dic 2025', avatar: 'FR', color: '#b91c1c', severity: 'critica' },
  { id: 4, name: 'Sandra Molina',    unit: 'Torre C · 11-B',  months: 1, amount:  85.00, lastPayment: 'Mar 2026', avatar: 'SM', color: '#0d9488', severity: 'baja' },
];
