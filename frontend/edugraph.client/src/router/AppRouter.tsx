// src/router/AppRouter.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage }              from '../pages/LoginPage';
import { SignUpPage }             from '../pages/SignUpPage';
import { SignUpApplicationsPage } from '../pages/SignUpApplicationsPage';
import { AddUserPage }            from '../pages/AddUserPage';
import { TeachersPage }           from '../pages/TeachersPage';
import { AdminsPage }             from '../pages/AdminsPage';
import { StudentSearchPage }      from '../pages/StudentSearchPage';
import { Layout }                 from '../components/Layout';
import { Seo }                    from '../components/Seo';
import { C, F }                   from '../styles/tokens';
import { getStoredRole }          from '../utils/auth';

type UserRole = 'Student' | 'Teacher' | 'Admin' | 'SuperAdmin';
const USER_ROLES: UserRole[] = ['Student', 'Teacher', 'Admin', 'SuperAdmin'];

interface ProtectedRouteProps {
    roles: UserRole[];
    children: React.ReactNode;
}

const isUserRole = (role: string): role is UserRole => USER_ROLES.includes(role as UserRole);

const getDefaultPath = (role: string | null): string => {
    if (role === 'Admin' || role === 'SuperAdmin') return '/admin/search';
    if (role === 'Teacher') return '/teacher/search';
    return '/student/search';
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles, children }) => {
    const role = getStoredRole();
    if (!role) return <Navigate to="/login" replace />;
    if (!isUserRole(role)) return <Navigate to="/login" replace />;
    if (!roles.includes(role)) return <Navigate to={getDefaultPath(role)} replace />;
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
            <Route path="/admin/search"               element={<ProtectedRoute roles={['Admin', 'SuperAdmin']}><StudentSearchPage /></ProtectedRoute>} />
            <Route path="/admin/sign-up-applications" element={<ProtectedRoute roles={['Admin', 'SuperAdmin']}><SignUpApplicationsPage /></ProtectedRoute>} />
            <Route path="/admin/add-user"             element={<ProtectedRoute roles={['Admin', 'SuperAdmin']}><AddUserPage /></ProtectedRoute>} />
            <Route path="/admin/teachers"             element={<ProtectedRoute roles={['Admin', 'SuperAdmin']}><TeachersPage /></ProtectedRoute>} />
            <Route path="/admin/admins"               element={<ProtectedRoute roles={['SuperAdmin']}><AdminsPage /></ProtectedRoute>} />
            <Route path="/teacher/search"             element={<ProtectedRoute roles={['Teacher']}><StudentSearchPage /></ProtectedRoute>} />
            <Route path="/teacher/sign-up-applications" element={<ProtectedRoute roles={['Teacher']}><SignUpApplicationsPage /></ProtectedRoute>} />
            <Route path="/teacher/add-user"           element={<ProtectedRoute roles={['Teacher']}><AddUserPage /></ProtectedRoute>} />
            <Route path="/student/search"             element={<ProtectedRoute roles={['Student']}><StudentSearchPage /></ProtectedRoute>} />
            <Route path="/privacy"                    element={<PrivacyPage />} />
            <Route path="*"                           element={<NotFoundPage />} />
        </Routes>
    </BrowserRouter>
);
