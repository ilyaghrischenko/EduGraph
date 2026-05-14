// src/pages/SignUpApplicationsPage.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Seo } from '../components/Seo';
import { Alert, GhostButton } from '../components/ui';
import { adminsApi } from '../api/adminsApi';
import type { PaginationResponse, SignUpApplicationResponse } from '../types/api';
import { getStoredRole } from '../utils/auth';
import { C, F } from '../styles/tokens';

const ADMIN_NAV_LINKS = [
    { label: 'Пошук', href: '/admin/search' },
    { label: 'Заявки', href: '/admin/sign-up-applications' },
    { label: 'Студенти', href: '/admin/add-user' },
    { label: 'Викладачі', href: '/admin/teachers' },
];
const TEACHER_NAV_LINKS = [
    { label: 'Пошук', href: '/teacher/search' },
    { label: 'Заявки', href: '/teacher/sign-up-applications' },
    { label: 'Студенти', href: '/teacher/add-user' },
];

export const SignUpApplicationsPage: React.FC = () => {
    const navLinks = getStoredRole() === 'Teacher' ? TEACHER_NAV_LINKS : ADMIN_NAV_LINKS;
    const [searchParams, setSearchParams] = useSearchParams();
    const page        = parseInt(searchParams.get('page') || '1', 10);

    const [data, setData]           = useState<PaginationResponse<SignUpApplicationResponse> | null>(null);
    const [error, setError]         = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [actionId, setActionId]   = useState<number | null>(null);
    const applicationsRequestIdRef = useRef(0);

    const fetchApplications = useCallback(async () => {
        const requestId = applicationsRequestIdRef.current + 1;
        applicationsRequestIdRef.current = requestId;
        setIsLoading(true);
        setError(null);
        try {
            const res = await adminsApi.getApplications(page, 30);
            if (applicationsRequestIdRef.current !== requestId) return;
            setData(res);
        } catch (err: unknown) {
            if (applicationsRequestIdRef.current !== requestId) return;
            setError(err instanceof Error ? err.message : 'Помилка запиту');
        } finally {
            if (applicationsRequestIdRef.current === requestId) setIsLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchApplications();
        return () => { applicationsRequestIdRef.current += 1; };
    }, [fetchApplications]);

    const changePage  = (p: number) => setSearchParams({ page: p.toString() });

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
        <Layout navLinks={navLinks} showGoogleDriveControls>
            <Seo
                title="Заявки на реєстрацію | EduGraph"
                description="Адміністративна сторінка перегляду заявок на реєстрацію в EduGraph."
                noindex
            />
            <div className="pt-6 md:pt-9">
                {/* Page heading */}
                <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontFamily: F.display, fontSize: '0.7rem', letterSpacing: '0.15em', color: 'rgba(79,255,176,0.5)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Адміністрування
                    </p>
                    <h1 style={{ fontFamily: F.display, fontSize: 'clamp(1.35rem, 5vw, 1.6rem)', fontWeight: 700, color: C.textPrimary, margin: 0 }}>
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
                        {/* Table uses an inner horizontal scroller so all columns remain available on mobile. */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', minWidth: '560px', borderCollapse: 'collapse' }}>
                                    <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={thStyle}>ID</th>
                                        <th style={thStyle}>ПІБ</th>
                                        <th style={thStyle}>Тип</th>
                                        <th style={thStyle}>Група</th>
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
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
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
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                            <button
                                onClick={() => changePage(page - 1)} disabled={page === 1}
                                style={{
                                    minHeight: '44px', minWidth: '44px',
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
                                    minHeight: '44px', minWidth: '44px',
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
