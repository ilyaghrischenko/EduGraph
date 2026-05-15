import React from 'react';
import { C, F } from '../../styles/tokens';

interface RadioProps {
    id: string;
    name: string;
    value: string;
    checked: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    label: string;
}

export const DarkRadio: React.FC<RadioProps> = ({ id, name, value, checked, onChange, label }) => (
    <label htmlFor={id} style={{ minHeight: '44px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: F.sans, fontSize: '0.875rem', color: checked ? C.accent : C.textMuted, transition: 'color 0.15s' }}>
        <input
            type="radio"
            id={id}
            name={name}
            value={value}
            checked={checked}
            onChange={onChange}
            style={{ accentColor: C.accent, width: '20px', height: '20px' }}
        />
        {label}
    </label>
);
