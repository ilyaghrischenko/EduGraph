import React, { useEffect, useState } from 'react';
import { adminsApi } from '../api/adminsApi';
import { usersApi } from '../api/usersApi';
import { getSafeGoogleDriveUrl } from '../utils/safeUrl';
import { C, F } from '../styles/tokens';

const GoogleDriveIcon: React.FC = () => (
    <svg width="24" height="21" viewBox="0 0 87.3 78" aria-hidden="true" focusable="false">
        <path d="M6.6 66.9 10.8 74.2c.9 1.6 2.3 2.8 3.9 3.4l15-26H0c0 1.8.5 3.6 1.4 5.2l5.2 10.1z" fill="#0066da" />
        <path d="M43.6 26 28.6 0c-1.6.6-3 1.8-3.9 3.4L1.4 44.2C.5 45.8 0 47.6 0 49.4v2.2h29.8L43.6 26z" fill="#00ac47" />
        <path d="M72.6 77.6c1.6-.6 3-1.8 3.9-3.4l1.7-2.9 7.7-14.5c.9-1.6 1.4-3.4 1.4-5.2H57.5l6.4 12.5 8.7 13.5z" fill="#ea4335" />
        <path d="M43.6 26 58.6 0c-1.6-.6-3.4-.6-5.1-.6H33.8c-1.8 0-3.5 0-5.1.6l15 26z" fill="#00832d" />
        <path d="M57.5 51.6H29.8l-15 26c1.6.6 3.4.4 5.1.4h47.4c1.8 0 3.5-.2 5.1-.8l-14.9-25.6z" fill="#2684fc" />
        <path d="M72.4 27.7 60.7 7.1c-.9-1.6-2.3-2.8-3.9-3.4L43.6 26l13.9 25.6h29.7c0-1.8-.5-3.6-1.4-5.2L72.4 27.7z" fill="#ffba00" />
    </svg>
);

export const GoogleDriveControls: React.FC = () => {
    const [driveLink, setDriveLink] = useState<string | null>(null);
    const [syncLoading, setSyncLoading] = useState(false);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [syncError, setSyncError] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        usersApi.getRootFolderLink()
            .then((link) => { if (!ignore) setDriveLink(getSafeGoogleDriveUrl(link)); })
            .catch(() => { if (!ignore) setDriveLink(null); });

        return () => { ignore = true; };
    }, []);

    const handleSyncGoogleDrive = async () => {
        setSyncLoading(true);
        setSyncStatus('idle');
        setSyncError(null);
        try {
            await adminsApi.syncGoogleDrive();
            setSyncStatus('success');
        } catch (err: unknown) {
            setSyncStatus('error');
            setSyncError(err instanceof Error ? err.message : 'Помилка синхронізації');
        } finally {
            setSyncLoading(false);
        }
    };

    const syncLabel = syncLoading
        ? 'Синхронізація...'
        : syncStatus === 'success'
            ? 'Синхронізовано'
            : syncStatus === 'error'
                ? 'Помилка'
                : 'Синхронізувати';

    return (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div
                aria-hidden="true"
                className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg"
                style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${C.border}`,
                }}
            >
                <GoogleDriveIcon />
            </div>
            <button
                type="button"
                onClick={handleSyncGoogleDrive}
                disabled={syncLoading}
                title={syncError ?? 'Синхронізувати Google Drive'}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-3 text-sm"
                style={{
                    background: syncStatus === 'error' ? C.dangerDim : C.accentDim,
                    border: `1px solid ${syncStatus === 'error' ? C.dangerBorder : C.accentBorder}`,
                    color: syncStatus === 'error' ? C.dangerText : C.accent,
                    cursor: syncLoading ? 'wait' : 'pointer',
                    fontFamily: F.sans,
                    fontWeight: 500,
                    opacity: syncLoading ? 0.6 : 1,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                }}
            >
                {syncLabel}
            </button>
            <a
                href={driveLink ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Відкрити Google Drive"
                title="Відкрити Google Drive"
                onClick={(e) => { if (!driveLink) e.preventDefault(); }}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-3 text-sm"
                style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${C.border}`,
                    color: driveLink ? C.textPrimary : C.textMuted,
                    cursor: driveLink ? 'pointer' : 'not-allowed',
                    fontFamily: F.sans,
                    fontWeight: 500,
                    opacity: driveLink ? 1 : 0.45,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                }}
            >
                Відкрити
            </a>
        </div>
    );
};
