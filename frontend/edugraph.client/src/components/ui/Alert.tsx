import React, { type ReactNode } from 'react';
import { C, F } from '../../styles/tokens';

type AlertVariant = 'error' | 'success' | 'info';

const ALERT_STYLES: Record<AlertVariant, { bg: string; border: string; color: string }> = {
    error: { bg: C.dangerDim, border: C.dangerBorder, color: C.dangerText },
    success: { bg: 'rgba(79,255,176,0.08)', border: C.borderHi, color: C.accent },
    info: { bg: 'rgba(103,232,249,0.08)', border: 'rgba(103,232,249,0.25)', color: '#67e8f9' },
};

export const Alert: React.FC<{ variant?: AlertVariant; children: ReactNode }> = ({ variant = 'error', children }) => {
    const styles = ALERT_STYLES[variant];

    return (
        <div role="alert" style={{ background: styles.bg, border: `1px solid ${styles.border}`, borderRadius: '10px', color: styles.color, padding: '10px 14px', fontSize: '0.875rem', fontFamily: F.sans, marginBottom: '18px' }}>
            {children}
        </div>
    );
};
