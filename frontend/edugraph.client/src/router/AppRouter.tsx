// src/router/AppRouter.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage }              from '../pages/LoginPage';
import { SignUpPage }             from '../pages/SignUpPage';
import { SignUpApplicationsPage } from '../pages/SignUpApplicationsPage';
import { AddUserPage }            from '../pages/AddUserPage';
import { StudentSearchPage }      from '../pages/StudentSearchPage';
import { Layout }                 from '../components/Layout';
import { C, F }                   from '../styles/tokens';

const PrivacyPage: React.FC = () => (
    <Layout>
        <div style={{ paddingTop: '48px', maxWidth: '640px' }}>
            <h1 style={{ fontFamily: F.display, fontSize: '1.5rem', fontWeight: 700, color: C.textPrimary, marginBottom: '16px' }}>
                Privacy Policy
            </h1>
            <p style={{ fontFamily: F.sans, color: C.textMuted, lineHeight: 1.7 }}>
                Заглушка політики конфіденційності.
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
            <Route path="/admin/sign-up-applications" element={<SignUpApplicationsPage />} />
            <Route path="/admin/add-user"             element={<AddUserPage />} />
            <Route path="/student/search"             element={<StudentSearchPage />} />
            <Route path="/privacy"                    element={<PrivacyPage />} />
            <Route path="*"                           element={<Navigate to="/login" replace />} />
        </Routes>
    </BrowserRouter>
);