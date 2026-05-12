// src/components/ui.tsx
// ─── Tiny headless-style primitives for the dark theme ────────────────────────
import React, { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes } from 'react';
import { C, F } from '../styles/tokens';

// ── DarkInput ────────────────────────────────────────────────────────────────
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
        onFocus={(e) => {
            e.currentTarget.style.borderColor = C.borderHi;
            e.currentTarget.style.boxShadow = `0 0 0 3px rgba(79,255,176,0.08)`;
            rest.onFocus?.(e);
        }}
        onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? C.danger : C.border;
            e.currentTarget.style.boxShadow = 'none';
            rest.onBlur?.(e);
        }}
    />
);

// ── DarkLabel ────────────────────────────────────────────────────────────────
export const DarkLabel: React.FC<{ htmlFor?: string; children: ReactNode }> = ({ htmlFor, children }) => (
    <label
        htmlFor={htmlFor}
        style={{ display: 'block', color: C.textMuted, fontSize: '0.875rem', marginBottom: '6px', fontFamily: F.sans, letterSpacing: '0.03em' }}
    >
        {children}
    </label>
);

// ── Field ─────────────────────────────────────────────────────────────────────
export const Field: React.FC<{ children: ReactNode; error?: string }> = ({ children, error }) => (
    <div style={{ marginBottom: '18px' }}>
        {children}
        {error && <p style={{ color: C.danger, fontSize: '0.875rem', marginTop: '4px', fontFamily: F.sans }}>{error}</p>}
    </div>
);

// ── PrimaryButton ─────────────────────────────────────────────────────────────
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    full?: boolean;
}
export const PrimaryButton: React.FC<BtnProps> = ({ loading, full, children, style, ...rest }) => (
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
            cursor: 'pointer',
            transition: 'background 0.2s, opacity 0.2s',
            opacity: (loading || rest.disabled) ? 0.45 : 1,
            ...style,
        }}
        onMouseEnter={(e) => { if (!rest.disabled && !loading) e.currentTarget.style.background = 'rgba(79,255,176,0.22)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(79,255,176,0.12)'; }}
    >
        {loading ? 'Завантаження...' : children}
    </button>
);

// ── GhostButton ───────────────────────────────────────────────────────────────
export const GhostButton: React.FC<BtnProps & { danger?: boolean }> = ({ danger, children, style, ...rest }) => (
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
            cursor: 'pointer',
            transition: 'background 0.15s, opacity 0.15s',
            opacity: rest.disabled ? 0.45 : 1,
            ...style,
        }}
        onMouseEnter={(e) => { if (!rest.disabled) e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.16)' : 'rgba(79,255,176,0.2)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = danger ? C.dangerDim : C.accentDim; }}
    >
        {children}
    </button>
);

// ── Alert ─────────────────────────────────────────────────────────────────────
type AlertVariant = 'error' | 'success' | 'info';
const ALERT_STYLES: Record<AlertVariant, { bg: string; border: string; color: string }> = {
    error:   { bg: C.dangerDim,  border: C.dangerBorder,  color: C.dangerText },
    success: { bg: 'rgba(79,255,176,0.08)', border: C.borderHi, color: C.accent },
    info:    { bg: 'rgba(103,232,249,0.08)', border: 'rgba(103,232,249,0.25)', color: '#67e8f9' },
};
export const Alert: React.FC<{ variant?: AlertVariant; children: ReactNode }> = ({ variant = 'error', children }) => {
    const s = ALERT_STYLES[variant];
    return (
        <div role="alert" style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '10px', color: s.color, padding: '10px 14px', fontSize: '0.875rem', fontFamily: F.sans, marginBottom: '18px' }}>
            {children}
        </div>
    );
};

// ── Divider ───────────────────────────────────────────────────────────────────
export const Divider: React.FC = () => (
    <div style={{ borderTop: `1px solid ${C.border}`, margin: '20px 0' }} />
);

// ── Radio ─────────────────────────────────────────────────────────────────────
interface RadioProps {
    id: string; name: string; value: string;
    checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label: string;
}
export const DarkRadio: React.FC<RadioProps> = ({ id, name, value, checked, onChange, label }) => (
    <label htmlFor={id} style={{ minHeight: '44px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: F.sans, fontSize: '0.875rem', color: checked ? C.accent : C.textMuted, transition: 'color 0.15s' }}>
        <input
            type="radio" id={id} name={name} value={value}
            checked={checked} onChange={onChange}
            style={{ accentColor: C.accent, width: '20px', height: '20px' }}
        />
        {label}
    </label>
);
