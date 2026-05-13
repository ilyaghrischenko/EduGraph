// src/utils/auth.ts

// .NET uses this URI as the default role claim type
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

interface JwtPayload {
    [key: string]: unknown;
}

const TOKEN_KEY = 'token';

export function getStoredToken(): string | null {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) return token;

    const legacyToken = localStorage.getItem(TOKEN_KEY);
    if (!legacyToken) return null;

    sessionStorage.setItem(TOKEN_KEY, legacyToken);
    localStorage.removeItem(TOKEN_KEY);
    return legacyToken;
}

export function setStoredToken(token: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
}

export function clearStoredToken(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
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
    const token = getStoredToken();
    if (!token) return null;
    return getRoleFromToken(token);
}
