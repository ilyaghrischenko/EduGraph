const ROOT_FOLDER_LINK_KEY = 'googleDriveRootFolderLink';

let memoryRootFolderLink: string | null = null;

function getSessionStorage(): Storage | null {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage;
}

export function getCachedRootFolderLink(): string | null {
    if (memoryRootFolderLink) return memoryRootFolderLink;

    const cachedLink = getSessionStorage()?.getItem(ROOT_FOLDER_LINK_KEY) ?? null;
    memoryRootFolderLink = cachedLink;
    return cachedLink;
}

export function setCachedRootFolderLink(link: string): void {
    memoryRootFolderLink = link;
    getSessionStorage()?.setItem(ROOT_FOLDER_LINK_KEY, link);
}

export function clearCachedRootFolderLink(): void {
    memoryRootFolderLink = null;
    getSessionStorage()?.removeItem(ROOT_FOLDER_LINK_KEY);
}
