import React, { type ReactNode } from 'react';
import { C, F } from '../../styles/tokens';

export const Field: React.FC<{ children: ReactNode; error?: string }> = ({ children, error }) => (
    <div style={{ marginBottom: '18px' }}>
        {children}
        {error && <p style={{ color: C.danger, fontSize: '0.875rem', marginTop: '4px', fontFamily: F.sans }}>{error}</p>}
    </div>
);
