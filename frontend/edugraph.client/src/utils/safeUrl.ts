const ALLOWED_GOOGLE_DRIVE_HOSTS = new Set([
    'drive.google.com',
    'docs.google.com',
]);

export function getSafeGoogleDriveUrl(value: string | null | undefined): string | null {
    if (!value) return null;

    try {
        const url = new URL(value);
        if (url.protocol !== 'https:') return null;
        if (!ALLOWED_GOOGLE_DRIVE_HOSTS.has(url.hostname)) return null;
        return url.toString();
    } catch {
        return null;
    }
}
