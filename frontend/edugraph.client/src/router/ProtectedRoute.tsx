import React from 'react';
import { Navigate } from 'react-router-dom';
import { getStoredRole } from '../utils/auth';
import { getDefaultPath, type UserRole } from '../utils/roles';

interface ProtectedRouteProps {
    roles: UserRole[];
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles, children }) => {
    const role = getStoredRole();
    if (!role) return <Navigate to="/login" replace />;
    if (!roles.includes(role)) return <Navigate to={getDefaultPath(role)} replace />;
    return <>{children}</>;
};
