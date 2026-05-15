export type UserRole = 'Student' | 'Teacher' | 'Admin' | 'SuperAdmin';

export const USER_ROLES: UserRole[] = ['Student', 'Teacher', 'Admin', 'SuperAdmin'];

export const isUserRole = (role: string): role is UserRole => USER_ROLES.includes(role as UserRole);

export const getDefaultPath = (role: string | null): string => {
    if (role === 'Admin' || role === 'SuperAdmin') return '/admin/search';
    if (role === 'Teacher') return '/teacher/search';
    return '/student/search';
};
