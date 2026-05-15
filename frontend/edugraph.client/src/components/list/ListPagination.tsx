import React from 'react';
import { C, F } from '../../styles/tokens';

interface ListPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const ListPagination: React.FC<ListPaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    const isPreviousDisabled = currentPage <= 1;
    const isNextDisabled = totalPages === 0 || currentPage >= totalPages;

    const buttonStyle = (disabled: boolean): React.CSSProperties => ({
        minHeight: '44px',
        minWidth: '44px',
        padding: '6px 16px',
        borderRadius: '8px',
        fontFamily: F.sans,
        fontSize: '0.82rem',
        background: C.surface,
        border: `1px solid ${C.border}`,
        color: disabled ? C.textMuted : C.textPrimary,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s, filter 0.15s, opacity 0.15s, transform 0.15s',
    });

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
            <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={isPreviousDisabled}
                style={buttonStyle(isPreviousDisabled)}
                onMouseEnter={(event) => { if (!isPreviousDisabled) event.currentTarget.style.borderColor = C.borderHi; }}
                onMouseLeave={(event) => { event.currentTarget.style.borderColor = C.border; }}
            >
                ← Попередня
            </button>
            <span style={{ fontFamily: F.sans, fontSize: '0.8rem', color: C.textMuted, padding: '0 8px' }}>
                {currentPage} / {totalPages}
            </span>
            <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={isNextDisabled}
                style={buttonStyle(isNextDisabled)}
                onMouseEnter={(event) => { if (!isNextDisabled) event.currentTarget.style.borderColor = C.borderHi; }}
                onMouseLeave={(event) => { event.currentTarget.style.borderColor = C.border; }}
            >
                Наступна →
            </button>
        </div>
    );
};
