// src/pages/SignUpPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Seo } from '../components/Seo';
import { DarkInput, DarkLabel, Field, PrimaryButton, Alert, DarkRadio } from '../components/ui';
import { authApi } from '../api/authApi';
import type { SignUpRequest } from '../types/api';
import { C, F } from '../styles/tokens';

const NAV_LINKS = [
    { label: 'Увійти', href: '/login' },
    { label: 'Зареєструватися', href: '/signup' },
];

export const SignUpPage: React.FC = () => {
    const navigate = useNavigate();
    const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [formData, setFormData] = useState({ login: '', password: '', confirmPassword: '', fullName: '', group: '' });
    const [userType, setUserType] = useState<'Student' | 'Teacher'>('Student');
    const [error, setError]       = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [loading, setLoading]   = useState(false);

    useEffect(() => () => {
        if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (validationErrors[name]) setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = e.target.value as 'Student' | 'Teacher';
        setUserType(t);
        if (t === 'Teacher') {
            setFormData((prev) => ({ ...prev, group: '' }));
            setValidationErrors((prev) => ({ ...prev, group: '' }));
        }
    };

    const validate = (): boolean => {
        const errors: Record<string, string> = {};
        if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Паролі не збігаються';
        if (userType === 'Student' && !formData.group.trim()) errors.group = 'Обов\'язкове поле для студента';
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        if (!validate()) return;
        setLoading(true);
        try {
            const payload: SignUpRequest = {
                login: formData.login,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                fullName: formData.fullName,
                userType,
                group: userType === 'Student' ? formData.group : null,
            };
            await authApi.signUp(payload);
            setSuccessMsg('Заявку надіслано! Очікуйте підтвердження адміністратора.');
            redirectTimerRef.current = setTimeout(() => navigate('/login'), 2500);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Невідома помилка');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout navLinks={NAV_LINKS}>
            <Seo
                title="Заявка на реєстрацію | EduGraph"
                description="Сторінка подання заявки на реєстрацію в EduGraph."
                noindex
            />
            <div className="flex items-start justify-center py-6 md:py-12">
                <div style={{ width: '100%', maxWidth: '420px' }}>

                    <div className="px-5 py-7 md:px-8 md:py-9" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: '16px' }}>
                        {/* Heading */}
                        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
                            <p style={{ fontFamily: F.display, fontSize: '0.7rem', letterSpacing: '0.15em', color: 'rgba(79,255,176,0.5)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Новий акаунт
                            </p>
                            <h1 style={{ fontFamily: F.display, fontSize: 'clamp(1.35rem, 5vw, 1.6rem)', fontWeight: 700, color: C.textPrimary, margin: 0 }}>
                                Заявка на реєстрацію
                            </h1>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {error   && <Alert variant="error">{error}</Alert>}
                            {successMsg && <Alert variant="success">{successMsg}</Alert>}

                            <Field>
                                <DarkLabel htmlFor="login">Логін</DarkLabel>
                                <DarkInput id="login" name="login" type="text" value={formData.login} onChange={handleChange} required placeholder="your_login" />
                            </Field>

                            <Field>
                                <DarkLabel htmlFor="fullName">ПІБ</DarkLabel>
                                <DarkInput id="fullName" name="fullName" type="text" value={formData.fullName} onChange={handleChange} required placeholder="Іванов Іван Іванович" />
                            </Field>

                            <Field>
                                <DarkLabel htmlFor="password">Пароль</DarkLabel>
                                <DarkInput id="password" name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" />
                            </Field>

                            <Field error={validationErrors.confirmPassword}>
                                <DarkLabel htmlFor="confirmPassword">Підтвердіть пароль</DarkLabel>
                                <DarkInput id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required placeholder="••••••••" error={!!validationErrors.confirmPassword} />
                            </Field>

                            {/* Role selector */}
                            <Field>
                                <DarkLabel>Роль</DarkLabel>
                                <div className="flex flex-col gap-1 md:flex-row md:gap-5" style={{ padding: '10px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px' }}>
                                    <DarkRadio id="roleStudent" name="userType" value="Student" checked={userType === 'Student'} onChange={handleTypeChange} label="Студент" />
                                    <DarkRadio id="roleTeacher" name="userType" value="Teacher" checked={userType === 'Teacher'} onChange={handleTypeChange} label="Викладач" />
                                </div>
                            </Field>

                            {/* Conditional group */}
                            {userType === 'Student' && (
                                <Field error={validationErrors.group}>
                                    <DarkLabel htmlFor="group">Група</DarkLabel>
                                    <DarkInput id="group" name="group" type="text" value={formData.group} onChange={handleChange} required={userType === 'Student'} placeholder="ІО-21" error={!!validationErrors.group} />
                                </Field>
                            )}

                            <PrimaryButton type="submit" loading={loading} full style={{ marginTop: '8px' }}>
                                Надіслати заявку
                            </PrimaryButton>
                        </form>
                    </div>

                    <p style={{ textAlign: 'center', marginTop: '20px', fontFamily: F.sans, fontSize: '0.83rem', color: C.textMuted }}>
                        Вже є акаунт?{' '}
                        <Link to="/login" className="inline-flex min-h-11 min-w-11 items-center justify-center" style={{ color: C.accent, textDecoration: 'none', fontWeight: 500 }}>Увійти</Link>
                    </p>
                </div>
            </div>
        </Layout>
    );
};
