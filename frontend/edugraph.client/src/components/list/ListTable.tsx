import React, { type ReactNode } from 'react';
import { C } from '../../styles/tokens';

interface ListTableProps {
    minWidth: number;
    children: ReactNode;
}

export const ListTable: React.FC<ListTableProps> = ({ minWidth, children }) => (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: `${minWidth}px`, borderCollapse: 'collapse' }}>
                {children}
            </table>
        </div>
    </div>
);
