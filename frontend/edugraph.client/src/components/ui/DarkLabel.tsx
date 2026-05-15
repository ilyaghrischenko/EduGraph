import React, { type ReactNode } from 'react';
import { C, F } from '../../styles/tokens';

export const DarkLabel: React.FC<{ htmlFor?: string; children: ReactNode }> = ({ htmlFor, children }) => (
    <label
        htmlFor={htmlFor}
        style={{ display: 'block', color: C.textMuted, fontSize: '0.875rem', marginBottom: '6px', fontFamily: F.sans, letterSpacing: '0.03em' }}
    >
        {children}
    </label>
);
