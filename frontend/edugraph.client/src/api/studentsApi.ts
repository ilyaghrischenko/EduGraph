import type { CreateStudentRequest, PaginationResponse, StudentResponse } from '../types/api';
import { apiFetch } from './apiClient';

export const studentsApi = {
    getStudents: (
        page: number = 1,
        pageSize: number = 30
    ): Promise<PaginationResponse<StudentResponse>> => {
        const params = new URLSearchParams({
            Page: page.toString(),
            PageSize: pageSize.toString(),
        });
        return apiFetch<PaginationResponse<StudentResponse>>(`/api/students?${params.toString()}`);
    },

    createStudent: (data: CreateStudentRequest): Promise<number> => {
        return apiFetch<number>('/api/students', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    deleteStudent: (id: number): Promise<void> => {
        return apiFetch<void>(`/api/students/${id}`, {
            method: 'DELETE',
        });
    },
};
