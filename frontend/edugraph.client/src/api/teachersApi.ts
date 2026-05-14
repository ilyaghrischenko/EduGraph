import type { CreateTeacherRequest, PaginationResponse, TeacherResponse } from '../types/api';
import { apiFetch } from './apiClient';

export const teachersApi = {
    getTeachers: (
        page: number = 1,
        pageSize: number = 30
    ): Promise<PaginationResponse<TeacherResponse>> => {
        const params = new URLSearchParams({
            Page: page.toString(),
            PageSize: pageSize.toString(),
        });
        return apiFetch<PaginationResponse<TeacherResponse>>(`/api/teachers?${params.toString()}`);
    },

    createTeacher: (data: CreateTeacherRequest): Promise<number> => {
        return apiFetch<number>('/api/teachers', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    deleteTeacher: (id: number): Promise<void> => {
        return apiFetch<void>(`/api/teachers/${id}`, {
            method: 'DELETE',
        });
    },
};
