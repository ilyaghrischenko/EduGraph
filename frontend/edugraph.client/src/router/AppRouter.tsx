// src/router/AppRouter.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage }              from '../pages/LoginPage';
import { SignUpPage }             from '../pages/SignUpPage';
import { PrivacyPage }            from '../pages/PrivacyPage';
import { NotFoundPage }           from '../pages/NotFoundPage';
import { SignUpApplicationsPage } from '../pages/SignUpApplicationsPage';
import { AddUserPage }            from '../pages/AddUserPage';
import { TeachersPage }           from '../pages/TeachersPage';
import { AdminsPage }             from '../pages/AdminsPage';
import { StudentSearchPage }      from '../pages/StudentSearchPage';
import { ProtectedRoute }          from './ProtectedRoute';

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
