// src/pages/SignUpApplicationsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Alert, GhostButton } from '../components/ui';
import { adminsApi } from '../api/adminsApi';
import type { PaginationResponse, SignUpApplicationResponse } from '../types/api';
import { C, F } from '../styles/tokens';

const NAV_LINKS = [
    { label: 'Заявки', href: '/admin/sign-up-applications' },
    { label: 'Додати користувача', href: '/admin/add-user' },
];

const SortIcon: React.FC<{ descending: boolean }> = ({ descending }) => (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ marginLeft: '5px', verticalAlign: 'middle' }}>
        {descending
            ? <path d="M6 9L1 3h10L6 9z" fill="currentColor" />
            : <path d="M6 3l5 6H1L6 3z" fill="currentColor" />}
    </svg>
);

export const SignUpApplicationsPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const page        = parseInt(searchParams.get('page') || '1', 10);
    const isDescending = searchParams.get('descending') === 'true';

    const [data, setData]           = useState<PaginationResponse<SignUpApplicationResponse> | null>(null);
    const [error, setError]         = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [actionId, setActionId]   = useState<number | null>(null);

    const fetchApplications = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await adminsApi.getApplications(page, 30, isDescending);
            setData(res);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Помилка запиту');
        } finally {
            setIsLoading(false);
        }
    }, [page, isDescending]);

    useEffect(() => { fetchApplications(); }, [fetchApplications]);

    const toggleSort  = () => setSearchParams({ page: '1', descending: (!isDescending).toString() });
    const changePage  = (p: number) => setSearchParams({ page: p.toString(), descending: isDescending.toString() });

    const handleApprove = async (id: number) => {
        setActionId(id); setError(null);
        try { await adminsApi.approveApplication(id); await fetchApplications(); }
        catch (err: unknown) { setError(err instanceof Error ? err.message : 'Помилка'); }
        finally { setActionId(null); }
    };

    const handleReject = async (id: number) => {
        setActionId(id); setError(null);
        try { await adminsApi.rejectApplication(id); await fetchApplications(); }
        catch (err: unknown) { setError(err instanceof Error ? err.message : 'Помилка'); }
        finally { setActionId(null); }
    };

    const hasItems = data && data.items && data.items.length > 0;

    // ── th style helper ───────────────────────────────────────────────────────
    const thStyle: React.CSSProperties = {
        padding: '12px 14px',
        fontFamily: F.sans,
        fontSize: '0.72rem',
        fontWeight: 600,
        color: C.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        textAlign: 'center',
        borderBottom: `1px solid ${C.border}`,
        whiteSpace: 'nowrap',
    };
    const tdStyle: React.CSSProperties = {
        padding: '11px 14px',
        fontFamily: F.sans,
        fontSize: '0.84rem',
        color: C.textPrimary,
        textAlign: 'center',
        borderBottom: `1px solid rgba(255,255,255,0.04)`,
        whiteSpace: 'nowrap',
    };

    return (
        <Layout navLinks={NAV_LINKS}>
            <div style={{ paddingTop: '36px' }}>
                {/* Page heading */}
                <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontFamily: F.display, fontSize: '0.7rem', letterSpacing: '0.15em', color: 'rgba(79,255,176,0.5)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Адміністрування
                    </p>
                    <h1 style={{ fontFamily: F.display, fontSize: '1.6rem', fontWeight: 700, color: C.textPrimary, margin: 0 }}>
                        Заявки на реєстрацію
                    </h1>
                </div>

                {error && <Alert variant="error">{error}</Alert>}

                {isLoading && !data ? (
                    /* Skeleton rows */
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: '14px', padding: '32px', textAlign: 'center', fontFamily: F.sans, color: C.textMuted, fontSize: '0.85rem' }}>
                        Завантаження…
                    </div>
                ) : !hasItems ? (
                    <Alert variant="info">Наразі немає нових заявок на реєстрацію.</Alert>
                ) : (
                    <>
                        {/* Table */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={thStyle}>ID</th>
                                        <th style={thStyle}>ПІБ</th>
                                        <th style={thStyle}>Тип</th>
                                        <th style={thStyle}>Група</th>
                                        <th style={thStyle}>Логін</th>
                                        <th style={{ ...thStyle, cursor: 'pointer' }} onClick={toggleSort}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', color: isDescending ? C.accent : C.textMuted, transition: 'color 0.15s' }}>
                          Дата заявки <SortIcon descending={isDescending} />
                        </span>
                                        </th>
                                        <th style={{ ...thStyle, width: '150px' }}>Дії</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {data!.items.map((app, idx) => (
                                        <tr
                                            key={app.id}
                                            style={{ background: idx % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent', transition: 'background 0.1s' }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(79,255,176,0.04)')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent')}
                                        >
                                            <td style={{ ...tdStyle, color: C.textMuted }}>{app.id}</td>
                                            <td style={tdStyle}>{app.fullName}</td>
                                            <td style={tdStyle}>
                          <span style={{
                              display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
                              fontSize: '0.72rem', fontWeight: 500,
                              background: app.userType === 'Student' ? 'rgba(79,255,176,0.1)' : 'rgba(103,232,249,0.1)',
                              border: `1px solid ${app.userType === 'Student' ? 'rgba(79,255,176,0.25)' : 'rgba(103,232,249,0.25)'}`,
                              color: app.userType === 'Student' ? C.accent : '#67e8f9',
                          }}>
                            {app.userType === 'Student' ? 'Студент' : 'Викладач'}
                          </span>
                                            </td>
                                            <td style={{ ...tdStyle, color: C.textMuted }}>{app.group ?? '—'}</td>
                                            <td style={tdStyle}>{app.login}</td>
                                            <td style={{ ...tdStyle, color: C.textMuted }}>
                                                {new Date(app.createdAt).toLocaleString('uk-UA')}
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                    <GhostButton onClick={() => handleApprove(app.id)} disabled={actionId === app.id}>
                                                        Схвалити
                                                    </GhostButton>
                                                    <GhostButton danger onClick={() => handleReject(app.id)} disabled={actionId === app.id}>
                                                        Відхилити
                                                    </GhostButton>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                            <button
                                onClick={() => changePage(page - 1)} disabled={page === 1}
                                style={{
                                    padding: '6px 16px', borderRadius: '8px', fontFamily: F.sans, fontSize: '0.82rem',
                                    background: C.surface, border: `1px solid ${C.border}`, color: page === 1 ? C.textMuted : C.textPrimary,
                                    cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, transition: 'background 0.15s',
                                }}
                                onMouseEnter={(e) => { if (page !== 1) e.currentTarget.style.borderColor = C.borderHi; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
                            >← Попередня</button>

                            <span style={{ fontFamily: F.sans, fontSize: '0.8rem', color: C.textMuted, padding: '0 8px' }}>
                {data!.currentPage} / {data!.totalPages}
              </span>

                            <button
                                onClick={() => changePage(page + 1)} disabled={page === data!.totalPages || data!.totalPages === 0}
                                style={{
                                    padding: '6px 16px', borderRadius: '8px', fontFamily: F.sans, fontSize: '0.82rem',
                                    background: C.surface, border: `1px solid ${C.border}`,
                                    color: (page === data!.totalPages || data!.totalPages === 0) ? C.textMuted : C.textPrimary,
                                    cursor: (page === data!.totalPages || data!.totalPages === 0) ? 'not-allowed' : 'pointer',
                                    opacity: (page === data!.totalPages || data!.totalPages === 0) ? 0.4 : 1, transition: 'background 0.15s',
                                }}
                                onMouseEnter={(e) => { if (page !== data!.totalPages) e.currentTarget.style.borderColor = C.borderHi; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
                            >Наступна →</button>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
};