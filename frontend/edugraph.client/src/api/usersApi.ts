// src/api/usersApi.ts
import type { SearchDocumentResponse } from '../types/api';
import { apiFetch } from './apiClient';

export const usersApi = {
    searchDocuments: (query: string): Promise<SearchDocumentResponse[]> => {
        const params = new URLSearchParams({ Query: query });
        return apiFetch(`/api/users/search-documents?${params.toString()}`);
    },
};