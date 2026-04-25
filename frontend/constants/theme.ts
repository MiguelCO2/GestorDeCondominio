// Tokens de diseño del condominio. Centralizado aquí para no hardcodear hex
// en cada pantalla.

import { Platform } from 'react-native';

export const colors = {
  // Marca
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryDeep: '#1e3a8a',
  surfaceDark: '#0f172a',

  // Texto
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#64748b',
  textSubtle: '#94a3b8',
  textOnDark: '#ffffff',

  // Superficies
  surface: '#ffffff',
  surfaceSoft: '#f8fafc',
  surfaceMuted: '#f1f5f9',

  // Bordes
  border: '#e2e8f0',
  borderSubtle: '#f1f5f9',

  // Acentos sobre fondo oscuro
  incomeOnDark: '#4ade80',
  expenseOnDark: '#fca5a5',
};

// Tonos semánticos: cada uno con bg suave, bgStrong para chip, fg para
// texto/icono y fgStrong para titular.
export const tones = {
  primary: { bg: '#eff6ff', bgStrong: '#dbeafe', fg: '#2563eb', fgStrong: '#1d4ed8' },
  info:    { bg: '#f0f9ff', bgStrong: '#e0f2fe', fg: '#0284c7', fgStrong: '#0369a1' },
  success: { bg: '#f0fdf4', bgStrong: '#dcfce7', fg: '#16a34a', fgStrong: '#15803d' },
  warning: { bg: '#fef3c7', bgStrong: '#fef3c7', fg: '#a16207', fgStrong: '#713f12' },
  danger:  { bg: '#fef2f2', bgStrong: '#fee2e2', fg: '#dc2626', fgStrong: '#b91c1c' },
  expense: { bg: '#fff7ed', bgStrong: '#ffedd5', fg: '#ea580c', fgStrong: '#7c2d12' },
  neutral: { bg: '#f1f5f9', bgStrong: '#e2e8f0', fg: '#475569', fgStrong: '#0f172a' },
} as const;

export type Tone = keyof typeof tones;

// Severidad de morosos
export const severityTone = {
  baja:    { bg: '#fef3c7', fg: '#a16207' },
  media:   { bg: '#fed7aa', fg: '#c2410c' },
  alta:    { bg: '#fecaca', fg: '#b91c1c' },
  critica: { bg: '#fca5a5', fg: '#991b1b' },
} as const;

export const radius = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 22,
  sheet: 28,
  pill: 999,
};

export const spacing = {
  screen: 20,
  scrollerBottom: 110,
  sectionTop: 22,
  sectionTopCompact: 14,
  sectionBottom: 12,
};

export const fontSize = {
  caption: 11,
  small: 12,
  body: 13,
  bodyLg: 14,
  card: 14.5,
  section: 15,
  cardLg: 16,
  h2: 18,
  hero: 26,
  display: 32,
  displayLg: 34,
};

export const fontWeight = {
  light: '300' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const shadow = {
  fab: {
    shadowColor: '#2563eb',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  card: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmented: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
};
