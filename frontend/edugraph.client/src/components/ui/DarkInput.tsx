import React, { type InputHTMLAttributes } from 'react';
import { C, F } from '../../styles/tokens';

interface DarkInputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

export const DarkInput: React.FC<DarkInputProps> = ({ error, style, ...rest }) => (
    <input
        {...rest}
        style={{
            display: 'block',
            width: '100%',
            minHeight: '44px',
            padding: '10px 14px',
            background: C.surface,
            border: `1px solid ${error ? C.danger : C.border}`,
            borderRadius: '10px',
            color: C.textPrimary,
            fontFamily: F.sans,
            fontSize: '1rem',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            caretColor: C.accent,
            ...style,
        }}
        onFocus={(event) => {
            event.currentTarget.style.borderColor = C.borderHi;
            event.currentTarget.style.boxShadow = `0 0 0 3px rgba(79,255,176,0.08)`;
            rest.onFocus?.(event);
        }}
        onBlur={(event) => {
            event.currentTarget.style.borderColor = error ? C.danger : C.border;
            event.currentTarget.style.boxShadow = 'none';
            rest.onBlur?.(event);
        }}
    />
);
