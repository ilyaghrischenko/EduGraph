// src/router/AppRouter.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { SignUpPage } from '../pages/SignUpPage';
import { SignUpApplicationsPage } from '../pages/SignUpApplicationsPage';
import { AddUserPage } from '../pages/AddUserPage';
import { StudentSearchPage } from '../pages/StudentSearchPage';
import { Layout } from '../components/Layout';

const PrivacyFallback = () => (
    <Layout>
        <div className="py-8">
            <h1 className="text-2xl mb-4">Privacy Policy</h1>
            <p>Заглушка політики конфіденційності.</p>
        </div>
    </Layout>
);

export const AppRouter: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/admin/sign-up-applications" element={<SignUpApplicationsPage />} />
                <Route path="/admin/add-user" element={<AddUserPage />} />
                <Route path="/student/search" element={<StudentSearchPage />} />
                <Route path="/privacy" element={<PrivacyFallback />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
};