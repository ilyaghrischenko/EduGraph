// src/styles/tokens.ts
// ─── Design tokens — single source of truth ───────────────────────────────────

export const C = {
    bg:         '#0a0d14',
    surface:    'rgba(255,255,255,0.04)',
    border:     'rgba(255,255,255,0.08)',
    borderHi:   'rgba(79,255,176,0.25)',
    accent:     '#4fffb0',
    accentDim:  'rgba(79,255,176,0.12)',
    accentBorder:'rgba(79,255,176,0.3)',
    textPrimary:'#e2e8f0',
    textMuted:  '#64748b',
    textFaint:  'rgba(255,255,255,0.18)',
    danger:     '#ef4444',
    dangerDim:  'rgba(239,68,68,0.08)',
    dangerBorder:'rgba(239,68,68,0.2)',
    dangerText: '#fca5a5',
    success:    '#4fffb0',
    successDim: 'rgba(79,255,176,0.1)',
    warning:    '#fb923c',
} as const;

export const F = {
    sans: "'DM Sans', sans-serif",
    display: "'Syne', sans-serif",
} as const;