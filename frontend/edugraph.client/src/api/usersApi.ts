// src/api/usersApi.ts
import type { FolderResponse, SearchDocumentResponse } from '../types/api';
import { apiFetch } from './apiClient';
import { getCachedRootFolderLink, setCachedRootFolderLink } from '../utils/googleDriveRootFolderLinkCache';

let rootFolderLinkRequest: Promise<string> | null = null;

export const usersApi = {
    getFolders: (): Promise<FolderResponse[]> => {
        return apiFetch<FolderResponse[]>('/api/google-drive/folders');
    },

    getRootFolderLink: (): Promise<string> => {
        const cachedLink = getCachedRootFolderLink();
        if (cachedLink) return Promise.resolve(cachedLink);

        rootFolderLinkRequest ??= apiFetch<string>('/api/google-drive/root-folder-link')
            .then((link) => {
                setCachedRootFolderLink(link);
                return link;
            })
            .finally(() => {
                rootFolderLinkRequest = null;
            });

        return rootFolderLinkRequest;
    },

    searchDocuments: (query: string): Promise<SearchDocumentResponse[]> => {
        const params = new URLSearchParams({ Query: query });
        return apiFetch<SearchDocumentResponse[]>(`/api/google-drive/search-documents?${params.toString()}`);
    },
};
