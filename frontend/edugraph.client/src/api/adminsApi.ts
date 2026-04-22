// src/api/adminsApi.ts
// src/api/adminsApi.ts
import type {PaginationResponse, SignUpApplicationResponse} from '../types/api';
import { apiFetch } from './apiClient';

export const adminsApi = {
    getApplications: (
        page: number = 1,
        pageSize: number = 30,
        descending: boolean = false
    ): Promise<PaginationResponse<SignUpApplicationResponse>> => {
        const params = new URLSearchParams({
            Page: page.toString(),
            PageSize: pageSize.toString(),
            Descending: descending.toString(),
        });
        return apiFetch(`/api/admins/sign-up-applications?${params.toString()}`);
    },

    approveApplication: (applicationId: number): Promise<void> => {
        return apiFetch(`/api/admins/sign-up-applications/${applicationId}/approve`, {
            method: 'POST',
        });
    },

    rejectApplication: (applicationId: number): Promise<void> => {
        return apiFetch(`/api/admins/sign-up-applications/${applicationId}/reject`, {
            method: 'POST',
        });
    },
};