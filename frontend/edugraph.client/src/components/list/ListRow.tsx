import React, { type ReactNode } from 'react';
import { getStripedRowBackground } from './tableStyles';

interface ListRowProps {
    index: number;
    children: ReactNode;
}

export const ListRow: React.FC<ListRowProps> = ({ index, children }) => {
    const background = getStripedRowBackground(index);

    return (
        <tr
            style={{ background, transition: 'background 0.1s' }}
            onMouseEnter={(event) => { event.currentTarget.style.background = 'rgba(79,255,176,0.04)'; }}
            onMouseLeave={(event) => { event.currentTarget.style.background = background; }}
        >
            {children}
        </tr>
    );
};
