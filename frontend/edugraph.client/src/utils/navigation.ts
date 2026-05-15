import type { NavLinkDef } from '../components/Navbar';

export const ADMIN_NAV_LINKS: NavLinkDef[] = [
    { label: 'Пошук', href: '/admin/search' },
    { label: 'Заявки', href: '/admin/sign-up-applications' },
    { label: 'Студенти', href: '/admin/add-user' },
    { label: 'Викладачі', href: '/admin/teachers' },
];

export const SUPER_ADMIN_NAV_LINKS: NavLinkDef[] = [
    ...ADMIN_NAV_LINKS,
    { label: 'Адміністратори', href: '/admin/admins' },
];

export const TEACHER_NAV_LINKS: NavLinkDef[] = [
    { label: 'Пошук', href: '/teacher/search' },
    { label: 'Заявки', href: '/teacher/sign-up-applications' },
    { label: 'Студенти', href: '/teacher/add-user' },
];

export const getAdminNavLinks = (role: string | null): NavLinkDef[] => (
    role === 'SuperAdmin' ? SUPER_ADMIN_NAV_LINKS : ADMIN_NAV_LINKS
);

export const getPanelNavLinks = (role: string | null): NavLinkDef[] => {
    if (role === 'Teacher') return TEACHER_NAV_LINKS;
    if (role === 'Admin' || role === 'SuperAdmin') return getAdminNavLinks(role);
    return [];
};
