// src/utils/auth.ts

// .NET uses this URI as the default role claim type
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

interface JwtPayload {
    [key: string]: unknown;
}

function decodeJwt(token: string): JwtPayload | null {
    try {
        const base64 = token.split('.')[1];
        const padded = base64.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(padded)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join(''),
        );
        return JSON.parse(json) as JwtPayload;
    } catch {
        return null;
    }
}

export function getRoleFromToken(token: string): string | null {
    const payload = decodeJwt(token);
    if (!payload) return null;
    // Handle both full URI claim and short 'role' claim
    const role = payload[ROLE_CLAIM] ?? payload['role'];
    return typeof role === 'string' ? role : null;
}

export function getStoredRole(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return getRoleFromToken(token);
}