// src/utils/auth.ts
import { clearCachedRootFolderLink } from './googleDriveRootFolderLinkCache';
import { isUserRole, type UserRole } from './roles';

// .NET uses this URI as the default role claim type
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

interface JwtPayload {
    [key: string]: unknown;
    exp?: unknown;
}

const TOKEN_KEY = 'token';

export function getStoredToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        if (isUsableToken(token)) return token;
        clearStoredToken();
        return null;
    }

    const legacyToken = sessionStorage.getItem(TOKEN_KEY);
    if (!legacyToken) return null;
    if (!isUsableToken(legacyToken)) {
        clearStoredToken();
        return null;
    }

    localStorage.setItem(TOKEN_KEY, legacyToken);
    sessionStorage.removeItem(TOKEN_KEY);
    return legacyToken;
}

export function setStoredToken(token: string): void {
    if (!isUsableToken(token)) {
        clearStoredToken();
        throw new Error('Недійсний токен авторизації');
    }

    clearCachedRootFolderLink();
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY);
}

export function clearStoredToken(): void {
    clearCachedRootFolderLink();
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
}

function decodeJwt(token: string): JwtPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3 || !parts[1]) return null;

        const base64 = token.split('.')[1];
        const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(normalized.length + (4 - normalized.length % 4) % 4, '=');
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

function isExpired(payload: JwtPayload): boolean {
    return typeof payload.exp === 'number' && payload.exp <= Math.floor(Date.now() / 1000);
}

export function isUsableToken(token: string): boolean {
    const payload = decodeJwt(token);
    return !!payload && !isExpired(payload) && getRoleFromPayload(payload) !== null;
}

function getRoleFromPayload(payload: JwtPayload): UserRole | null {
    const role = payload[ROLE_CLAIM] ?? payload['role'];
    return typeof role === 'string' && isUserRole(role) ? role : null;
}

export function getRoleFromToken(token: string): UserRole | null {
    const payload = decodeJwt(token);
    if (!payload) return null;
    if (isExpired(payload)) return null;
    return getRoleFromPayload(payload);
}

export function getStoredRole(): UserRole | null {
    const token = getStoredToken();
    if (!token) return null;
    return getRoleFromToken(token);
}
