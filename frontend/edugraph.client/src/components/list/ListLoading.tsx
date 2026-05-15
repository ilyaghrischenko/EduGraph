import React from 'react';
import { C, F } from '../../styles/tokens';

export const ListLoading: React.FC = () => (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: '14px', padding: '32px', textAlign: 'center', fontFamily: F.sans, color: C.textMuted, fontSize: '0.85rem' }}>
        Завантаження…
    </div>
);
