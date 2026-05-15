import React from 'react';
import { C } from '../../styles/tokens';

export const Divider: React.FC = () => (
    <div style={{ borderTop: `1px solid ${C.border}`, margin: '20px 0' }} />
);
