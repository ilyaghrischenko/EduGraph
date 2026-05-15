// src/pages/SignUpApplicationsPage.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { PageHeading } from '../components/PageHeading';
import { Seo } from '../components/Seo';
import { Alert, GhostButton } from '../components/ui';
import { ListLoading, ListPagination, ListRow, ListTable, tdStyle, thStyle } from '../components/list';
import { adminsApi } from '../api/adminsApi';
import type { PaginationResponse, SignUpApplicationResponse } from '../types/api';
import { getStoredRole } from '../utils/auth';
import { getPanelNavLinks } from '../utils/navigation';
import { usePageSearchParam } from '../hooks/usePageSearchParam';
import { C } from '../styles/tokens';

export const SignUpApplicationsPage: React.FC = () => {
    const navLinks = getPanelNavLinks(getStoredRole());
    const { page, setPage } = usePageSearchParam();

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

    return (
        <Layout navLinks={navLinks} showGoogleDriveControls>
            <Seo
                title="Заявки на реєстрацію | EduGraph"
                description="Адміністративна сторінка перегляду заявок на реєстрацію в EduGraph."
                noindex
            />
            <div className="pt-6 md:pt-9">
                <PageHeading eyebrow="Адміністрування" title="Заявки на реєстрацію" />

                {error && <Alert variant="error">{error}</Alert>}

                {isLoading && !data ? (
                    <ListLoading />
                ) : !hasItems ? (
                    <Alert variant="info">Наразі немає нових заявок на реєстрацію.</Alert>
                ) : (
                    <>
                        <ListTable minWidth={560}>
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
                                <ListRow key={app.id} index={idx}>
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
                                </ListRow>
                            ))}
                            </tbody>
                        </ListTable>

                        <ListPagination currentPage={data!.currentPage} totalPages={data!.totalPages} onPageChange={setPage} />
                    </>
                )}
            </div>
        </Layout>
    );
};
