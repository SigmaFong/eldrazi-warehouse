// src/utils/theme.ts
// Function 7.2 — Glassmorphism design system

export const colors = {
  bg:           '#09090b',   // zinc-950
  bgCard:       '#18181b',   // zinc-900
  bgGlass:      'rgba(24,24,27,0.75)',
  border:       '#27272a',   // zinc-800
  borderLight:  '#3f3f46',   // zinc-700
  borderGlass:  'rgba(139,92,246,0.15)',
  violet:       '#7c3aed',
  violetLight:  '#8b5cf6',
  violetGlow:   'rgba(139,92,246,0.25)',
  amber:        '#f59e0b',
  amberLight:   '#fbbf24',
  emerald:      '#10b981',
  red:          '#ef4444',
  blue:         '#3b82f6',
  textPrimary:  '#f4f4f5',   // zinc-100
  textSecond:   '#a1a1aa',   // zinc-400
  textMuted:    '#71717a',   // zinc-500
  textDisabled: '#52525b',   // zinc-600
};

export const rarity = {
  mythic:   { bg: 'rgba(234,88,12,0.15)',  border: 'rgba(234,88,12,0.4)',  text: '#fb923c' },
  rare:     { bg: 'rgba(202,138,4,0.15)',  border: 'rgba(202,138,4,0.4)',  text: '#facc15' },
  uncommon: { bg: 'rgba(37,99,235,0.15)',  border: 'rgba(37,99,235,0.4)',  text: '#60a5fa' },
  common:   { bg: 'rgba(82,82,91,0.15)',   border: 'rgba(82,82,91,0.4)',   text: '#a1a1aa' },
};

export const status = {
  pending:    { bg: 'rgba(202,138,4,0.15)',  text: '#facc15' },
  processing: { bg: 'rgba(37,99,235,0.15)',  text: '#60a5fa' },
  shipped:    { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa' },
  delivered:  { bg: 'rgba(16,185,129,0.15)', text: '#34d399' },
  cancelled:  { bg: 'rgba(239,68,68,0.15)',  text: '#f87171' },
};

export const glass = {
  // Glassmorphism card style (Function 7.2)
  card: {
    backgroundColor:  'rgba(24,24,27,0.80)',
    borderWidth:       1,
    borderColor:      'rgba(63,63,70,0.6)',
    borderRadius:      16,
  },
  cardViolet: {
    backgroundColor:  'rgba(139,92,246,0.08)',
    borderWidth:       1,
    borderColor:      'rgba(139,92,246,0.25)',
    borderRadius:      16,
  },
  input: {
    backgroundColor:  'rgba(9,9,11,0.85)',
    borderWidth:       1,
    borderColor:      '#3f3f46',
    borderRadius:      12,
  },
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const font = {
  mono:  undefined as any,
  sizes: { xs: 10, sm: 12, base: 14, md: 16, lg: 18, xl: 22, xxl: 28 },
};
