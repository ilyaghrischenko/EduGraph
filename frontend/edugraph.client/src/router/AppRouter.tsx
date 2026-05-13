// src/router/AppRouter.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage }              from '../pages/LoginPage';
import { SignUpPage }             from '../pages/SignUpPage';
import { SignUpApplicationsPage } from '../pages/SignUpApplicationsPage';
import { AddUserPage }            from '../pages/AddUserPage';
import { StudentSearchPage }      from '../pages/StudentSearchPage';
import { Layout }                 from '../components/Layout';
import { Seo }                    from '../components/Seo';
import { C, F }                   from '../styles/tokens';
import { getStoredRole }          from '../utils/auth';

interface ProtectedRouteProps {
    allow: 'student' | 'admin';
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allow, children }) => {
    const role = getStoredRole();
    if (!role) return <Navigate to="/login" replace />;
    if (allow === 'student' && role !== 'Student') return <Navigate to="/admin/sign-up-applications" replace />;
    if (allow === 'admin' && role === 'Student') return <Navigate to="/student/search" replace />;
    return <>{children}</>;
};

const PrivacyPage: React.FC = () => (
    <Layout>
        <Seo
            title="Privacy Policy | EduGraph"
            description="Політика конфіденційності EduGraph."
            noindex
        />
        <div className="w-full max-w-[640px] pt-8 md:pt-12">
            <h1 style={{ fontFamily: F.display, fontSize: 'clamp(1.35rem, 4vw, 1.5rem)', fontWeight: 700, color: C.textPrimary, marginBottom: '16px' }}>
                Privacy Policy
            </h1>
            <p style={{ fontFamily: F.sans, color: C.textMuted, lineHeight: 1.7 }}>
                Заглушка політики конфіденційності.
            </p>
        </div>
    </Layout>
);

const NotFoundPage: React.FC = () => (
    <Layout>
        <Seo
            title="Сторінку не знайдено | EduGraph"
            description="Запитану сторінку EduGraph не знайдено."
            noindex
        />
        <div className="w-full max-w-[640px] pt-8 md:pt-12">
            <h1 style={{ fontFamily: F.display, fontSize: 'clamp(1.35rem, 4vw, 1.5rem)', fontWeight: 700, color: C.textPrimary, marginBottom: '16px' }}>
                Сторінку не знайдено
            </h1>
            <p style={{ fontFamily: F.sans, color: C.textMuted, lineHeight: 1.7 }}>
                Перевірте адресу або поверніться на головну сторінку.
            </p>
        </div>
    </Layout>
);

export const AppRouter: React.FC = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/"                           element={<Navigate to="/login" replace />} />
            <Route path="/login"                      element={<LoginPage />} />
            <Route path="/signup"                     element={<SignUpPage />} />
            <Route path="/admin/sign-up-applications" element={<ProtectedRoute allow="admin"><SignUpApplicationsPage /></ProtectedRoute>} />
            <Route path="/admin/add-user"             element={<ProtectedRoute allow="admin"><AddUserPage /></ProtectedRoute>} />
            <Route path="/student/search"             element={<ProtectedRoute allow="student"><StudentSearchPage /></ProtectedRoute>} />
            <Route path="/privacy"                    element={<PrivacyPage />} />
            <Route path="*"                           element={<NotFoundPage />} />
        </Routes>
    </BrowserRouter>
);
