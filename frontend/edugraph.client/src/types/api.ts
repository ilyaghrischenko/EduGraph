// src/types/api.ts
export interface LoginRequest {
    login: string;
    password: string;
}

export interface SignUpRequest {
    fullName: string;
    userType: 'Student' | 'Teacher';
    group: string | null;
    login: string;
    password: string;
    confirmPassword: string;
}

export interface SignUpApplicationResponse {
    id: number;
    fullName: string;
    userType: string;
    group: string | null;
}

export interface CreateStudentRequest {
    fullName: string;
    group: string;
    login: string;
    password: string;
    confirmPassword: string;
}

export interface StudentResponse {
    id: number;
    fullName: string;
    type: string;
    group: string | null;
    lastLoginDate: string | null;
}

export interface PaginationResponse<T> {
    items: T[];
    currentPage: number;
    totalPages: number;
}

export interface ProblemDetails {
    type?: string | null;
    title?: string | null;
    status?: number | null;
    detail?: string | null;
    instance?: string | null;
}

// /api/google-drive/search-documents response
export interface SearchDocumentResponse {
    title: string;
    url: string;
    folderName: string | null;
    content: string;
    score: number;
    chunkId: string;
    chunkIndex: number;
}

// /api/google-drive/folders response
export interface FolderResponse {
    id: string;
    name: string;
    link: string;
}
