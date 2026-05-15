import type React from 'react';
import { C, F } from '../../styles/tokens';

export const thStyle: React.CSSProperties = {
    padding: '12px 14px',
    fontFamily: F.sans,
    fontSize: '0.72rem',
    fontWeight: 600,
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    textAlign: 'center',
    borderBottom: `1px solid ${C.border}`,
    whiteSpace: 'nowrap',
};

export const tdStyle: React.CSSProperties = {
    padding: '11px 14px',
    fontFamily: F.sans,
    fontSize: '0.84rem',
    color: C.textPrimary,
    textAlign: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    whiteSpace: 'nowrap',
};

export const getStripedRowBackground = (index: number): string => (
    index % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent'
);
