import React, { type ButtonHTMLAttributes } from 'react';
import { C, F } from '../../styles/tokens';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    full?: boolean;
}

export const PrimaryButton: React.FC<ButtonProps> = ({ loading, full, children, style, ...rest }) => (
    <button
        {...rest}
        disabled={loading || rest.disabled}
        style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: full ? '100%' : undefined,
            minHeight: '44px',
            minWidth: '44px',
            padding: '10px 20px',
            background: 'rgba(79,255,176,0.12)',
            border: '1px solid rgba(79,255,176,0.3)',
            borderRadius: '10px',
            color: C.accent,
            fontFamily: F.sans,
            fontSize: '0.9rem',
            fontWeight: 500,
            cursor: (loading || rest.disabled) ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s, filter 0.2s, opacity 0.2s, transform 0.2s',
            opacity: (loading || rest.disabled) ? 0.45 : 1,
            ...style,
        }}
        onMouseEnter={(event) => {
            if (!rest.disabled && !loading) event.currentTarget.style.background = 'rgba(79,255,176,0.22)';
        }}
        onMouseLeave={(event) => {
            event.currentTarget.style.background = 'rgba(79,255,176,0.12)';
        }}
    >
        {loading ? 'Завантаження...' : children}
    </button>
);
