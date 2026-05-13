// src/api/usersApi.ts
import type { FolderResponse, SearchDocumentResponse } from '../types/api';
import { apiFetch } from './apiClient';

export const usersApi = {
    getFolders: (): Promise<FolderResponse[]> => {
        return apiFetch<FolderResponse[]>('/api/google-drive/folders');
    },

    getRootFolderLink: (): Promise<string> => {
        return apiFetch<string>('/api/google-drive/root-folder-link');
    },

    searchDocuments: (query: string): Promise<SearchDocumentResponse[]> => {
        const params = new URLSearchParams({ Query: query });
        return apiFetch<SearchDocumentResponse[]>(`/api/google-drive/search-documents?${params.toString()}`);
    },
};
