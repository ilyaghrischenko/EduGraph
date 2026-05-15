import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const normalizePage = (value: string | null): number => {
    const parsed = Number.parseInt(value ?? '1', 10);
    return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
};

export function usePageSearchParam(): { page: number; setPage: (page: number) => void } {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = useMemo(() => normalizePage(searchParams.get('page')), [searchParams]);

    const setPage = useCallback((nextPage: number) => {
        const normalizedPage = Number.isFinite(nextPage) && nextPage >= 1 ? Math.floor(nextPage) : 1;
        setSearchParams({ page: normalizedPage.toString() });
    }, [setSearchParams]);

    return { page, setPage };
}
