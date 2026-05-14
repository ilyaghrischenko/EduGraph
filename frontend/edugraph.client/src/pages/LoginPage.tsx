// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Seo } from '../components/Seo';
import { DarkInput, DarkLabel, Field, PrimaryButton, Alert } from '../components/ui';
import { authApi } from '../api/authApi';
import { getRoleFromToken, setStoredToken } from '../utils/auth';
import { C, F } from '../styles/tokens';

const NAV_LINKS = [
    { label: 'Увійти', href: '/login' },
    { label: 'Зареєструватися', href: '/signup' },
];

function getRedirectPath(token: string): string {
    const role = getRoleFromToken(token);
    if (role === 'Admin') return '/admin/search';
    if (role === 'Teacher') return '/teacher/search';
    return '/student/search';
}

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [login, setLogin]       = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState<string | null>(null);
    const [loading, setLoading]   = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const token = await authApi.login({ login, password });
            setStoredToken(token);
            navigate(getRedirectPath(token));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Невідома помилка');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout navLinks={NAV_LINKS}>
            <Seo
                title="Вхід в систему | EduGraph"
                description="Сторінка входу в EduGraph для студентів та викладачів."
                noindex
            />
            <div className="flex min-h-[calc(100svh-120px)] items-center justify-center py-6 md:min-h-[calc(100vh-120px)]">
                <div style={{ width: '100%', maxWidth: '400px' }}>
                    <div className="px-5 py-7 md:px-8 md:py-9" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: '16px' }}>
                        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
                            <p style={{ fontFamily: F.display, fontSize: '0.7rem', letterSpacing: '0.15em', color: 'rgba(79,255,176,0.5)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Ласкаво просимо
                            </p>
                            <h1 style={{ fontFamily: F.display, fontSize: 'clamp(1.35rem, 5vw, 1.6rem)', fontWeight: 700, color: C.textPrimary, margin: 0 }}>
                                Вхід в систему
                            </h1>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {error && <Alert variant="error">{error}</Alert>}
                            <Field>
                                <DarkLabel htmlFor="login">Логін</DarkLabel>
                                <DarkInput id="login" type="text" value={login} required placeholder="your_login" onChange={(e) => setLogin(e.target.value)} />
                            </Field>
                            <Field>
                                <DarkLabel htmlFor="password">Пароль</DarkLabel>
                                <DarkInput id="password" type="password" value={password} required placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} />
                            </Field>
                            <PrimaryButton type="submit" loading={loading} full style={{ marginTop: '8px' }}>
                                Увійти
                            </PrimaryButton>
                        </form>
                    </div>
                    <p style={{ textAlign: 'center', marginTop: '20px', fontFamily: F.sans, fontSize: '0.83rem', color: C.textMuted }}>
                        Немає акаунту?{' '}
                        <Link to="/signup" className="inline-flex min-h-11 min-w-11 items-center justify-center" style={{ color: C.accent, textDecoration: 'none', fontWeight: 500 }}>Зареєструватись</Link>
                    </p>
                </div>
            </div>
        </Layout>
    );
};
