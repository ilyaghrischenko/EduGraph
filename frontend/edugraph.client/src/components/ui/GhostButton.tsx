import React from 'react';
import { C, F } from '../../styles/tokens';
import type { ButtonProps } from './PrimaryButton';

export const GhostButton: React.FC<ButtonProps & { danger?: boolean }> = ({ danger, children, style, ...rest }) => (
    <button
        {...rest}
        style={{
            minHeight: '44px',
            minWidth: '44px',
            padding: '8px 14px',
            background: danger ? C.dangerDim : C.accentDim,
            border: `1px solid ${danger ? C.dangerBorder : C.accentBorder}`,
            borderRadius: '8px',
            color: danger ? C.dangerText : C.accent,
            fontFamily: F.sans,
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: rest.disabled ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s, filter 0.15s, opacity 0.15s, transform 0.15s',
            opacity: rest.disabled ? 0.45 : 1,
            ...style,
        }}
        onMouseEnter={(event) => {
            if (!rest.disabled) event.currentTarget.style.background = danger ? 'rgba(239,68,68,0.16)' : 'rgba(79,255,176,0.2)';
        }}
        onMouseLeave={(event) => {
            event.currentTarget.style.background = danger ? C.dangerDim : C.accentDim;
        }}
    >
        {children}
    </button>
);
