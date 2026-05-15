import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Layout } from '../components/Layout';
import { PageHeading } from '../components/PageHeading';
import { Seo } from '../components/Seo';
import { Alert, DarkInput, DarkLabel, Field, GhostButton, PrimaryButton } from '../components/ui';
import { ListLoading, ListPagination, ListRow, ListTable, tdStyle, thStyle } from '../components/list';
import { teachersApi } from '../api/teachersApi';
import type { CreateTeacherRequest, PaginationResponse, TeacherResponse } from '../types/api';
import { getStoredRole } from '../utils/auth';
import { getAdminNavLinks } from '../utils/navigation';
import { usePageSearchParam } from '../hooks/usePageSearchParam';
import { C, F } from '../styles/tokens';

const EMPTY_FORM = {
    login: '',
    fullName: '',
    password: '',
    confirmPassword: '',
};

const formatLastLogin = (value: string | null): string => {
    if (!value) return '—';
    return new Intl.DateTimeFormat('uk-UA').format(new Date(value));
};

export const TeachersPage: React.FC = () => {
    const navLinks = getAdminNavLinks(getStoredRole());
    const { page, setPage } = usePageSearchParam();

    const [formData, setFormData] = useState(EMPTY_FORM);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [teachers, setTeachers] = useState<PaginationResponse<TeacherResponse> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [createLoading, setCreateLoading] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const teachersRequestIdRef = useRef(0);

    const fetchTeachers = useCallback(async () => {
        const requestId = teachersRequestIdRef.current + 1;
        teachersRequestIdRef.current = requestId;
        setIsLoading(true);
        setError(null);
        try {
            const res = await teachersApi.getTeachers(page, 30);
            if (teachersRequestIdRef.current !== requestId) return;
            setTeachers(res);
        } catch (err: unknown) {
            if (teachersRequestIdRef.current !== requestId) return;
            setError(err instanceof Error ? err.message : 'Помилка запиту');
        } finally {
            if (teachersRequestIdRef.current === requestId) setIsLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchTeachers();
        return () => { teachersRequestIdRef.current += 1; };
    }, [fetchTeachers]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (validationErrors[name]) setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validate = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formData.login.trim()) errors.login = 'Обовʼязкове поле';
        if (!formData.fullName.trim()) errors.fullName = 'Обовʼязкове поле';
        if (!formData.password) errors.password = 'Обовʼязкове поле';
        if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Паролі не збігаються';
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        if (!validate()) return;

        setCreateLoading(true);
        try {
            const payload: CreateTeacherRequest = {
                login: formData.login.trim(),
                fullName: formData.fullName.trim(),
                password: formData.password,
                confirmPassword: formData.confirmPassword,
            };
            const id = await teachersApi.createTeacher(payload);
            setFormData(EMPTY_FORM);
            setSuccessMsg(`Викладача створено. ID: ${id}`);
            if (page !== 1) setPage(1);
            else await fetchTeachers();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Помилка створення викладача');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleDelete = async (teacher: TeacherResponse) => {
        const confirmed = window.confirm(`Видалити викладача "${teacher.fullName}"?`);
        if (!confirmed) return;

        setDeleteId(teacher.id);
        setError(null);
        setSuccessMsg(null);
        try {
            await teachersApi.deleteTeacher(teacher.id);
            setSuccessMsg('Викладача видалено.');
            await fetchTeachers();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Помилка видалення викладача');
        } finally {
            setDeleteId(null);
        }
    };

    const hasTeachers = teachers && teachers.items && teachers.items.length > 0;

    return (
        <Layout navLinks={navLinks} showGoogleDriveControls>
            <Seo
                title="Викладачі | EduGraph"
                description="Адміністративна сторінка керування викладачами EduGraph."
                noindex
            />
            <div className="pt-6 md:pt-9">
                <PageHeading eyebrow="Адміністрування" title="Викладачі" />

                {error && <Alert variant="error">{error}</Alert>}
                {successMsg && <Alert variant="success">{successMsg}</Alert>}

                <div className="grid min-w-0 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
                    <div className="px-5 py-6 md:px-7 md:py-8" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: '16px' }}>
                        <h2 style={{ fontFamily: F.display, fontSize: '1rem', fontWeight: 700, color: C.textPrimary, margin: '0 0 18px' }}>
                            Додати викладача
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <Field error={validationErrors.login}>
                                <DarkLabel htmlFor="login">Логін</DarkLabel>
                                <DarkInput id="login" name="login" type="text" value={formData.login} onChange={handleChange} required placeholder="your_login" error={!!validationErrors.login} />
                            </Field>

                            <Field error={validationErrors.fullName}>
                                <DarkLabel htmlFor="fullName">ПІБ</DarkLabel>
                                <DarkInput id="fullName" name="fullName" type="text" value={formData.fullName} onChange={handleChange} required placeholder="Іванов Іван Іванович" error={!!validationErrors.fullName} />
                            </Field>

                            <Field error={validationErrors.password}>
                                <DarkLabel htmlFor="password">Пароль</DarkLabel>
                                <DarkInput id="password" name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" error={!!validationErrors.password} />
                            </Field>

                            <Field error={validationErrors.confirmPassword}>
                                <DarkLabel htmlFor="confirmPassword">Підтвердіть пароль</DarkLabel>
                                <DarkInput id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required placeholder="••••••••" error={!!validationErrors.confirmPassword} />
                            </Field>

                            <PrimaryButton type="submit" loading={createLoading} full style={{ marginTop: '8px' }}>
                                Створити викладача
                            </PrimaryButton>
                        </form>
                    </div>

                    <div className="min-w-0">
                        {isLoading && !teachers ? (
                            <ListLoading />
                        ) : !hasTeachers ? (
                            <Alert variant="info">Викладачів ще немає.</Alert>
                        ) : (
                            <>
                                <ListTable minWidth={560}>
                                    <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={thStyle}>ID</th>
                                        <th style={thStyle}>ПІБ</th>
                                        <th style={thStyle}>Останній вхід</th>
                                        <th style={{ ...thStyle, width: '120px' }}>Дії</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {teachers!.items.map((teacher, idx) => (
                                        <ListRow key={teacher.id} index={idx}>
                                                    <td style={{ ...tdStyle, color: C.textMuted }}>{teacher.id}</td>
                                                    <td style={tdStyle}>{teacher.fullName}</td>
                                                    <td style={{ ...tdStyle, color: C.textMuted }}>{formatLastLogin(teacher.lastLoginDate)}</td>
                                                    <td style={tdStyle}>
                                                        <GhostButton danger onClick={() => handleDelete(teacher)} disabled={deleteId === teacher.id}>
                                                            Видалити
                                                        </GhostButton>
                                                    </td>
                                        </ListRow>
                                    ))}
                                    </tbody>
                                </ListTable>

                                <ListPagination currentPage={teachers!.currentPage} totalPages={teachers!.totalPages} onPageChange={setPage} />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};
