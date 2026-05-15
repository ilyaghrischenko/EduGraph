// src/api/adminsApi.ts
import type {AdminResponse, CreateAdminRequest, PaginationResponse, SignUpApplicationResponse} from '../types/api';
import { apiFetch } from './apiClient';

export const adminsApi = {
    getAdmins: (
        page: number = 1,
        pageSize: number = 30
    ): Promise<PaginationResponse<AdminResponse>> => {
        const params = new URLSearchParams({
            Page: page.toString(),
            PageSize: pageSize.toString(),
        });
        return apiFetch<PaginationResponse<AdminResponse>>(`/api/admins?${params.toString()}`);
    },

    createAdmin: (data: CreateAdminRequest): Promise<number> => {
        return apiFetch<number>('/api/admins', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    deleteAdmin: (id: number): Promise<void> => {
        return apiFetch<void>(`/api/admins/${id}`, {
            method: 'DELETE',
        });
    },

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
        return apiFetch<PaginationResponse<SignUpApplicationResponse>>(`/api/sign-up-applications?${params.toString()}`);
    },

    approveApplication: (applicationId: number): Promise<void> => {
        return apiFetch<void>(`/api/sign-up-applications/${applicationId}/approve`, {
            method: 'POST',
        });
    },

    rejectApplication: (applicationId: number): Promise<void> => {
        return apiFetch<void>(`/api/sign-up-applications/${applicationId}/reject`, {
            method: 'POST',
        });
    },

    syncGoogleDrive: (): Promise<void> => {
        return apiFetch<void>('/api/google-drive/sync', {
            method: 'POST',
        });
    },
};
