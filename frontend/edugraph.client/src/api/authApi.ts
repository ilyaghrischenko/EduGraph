import type {LoginRequest, SignUpRequest} from '../types/api';
import { apiFetch } from './apiClient';

export const authApi = {
    login: (data: LoginRequest): Promise<string> => {
        return apiFetch<string>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    signUp: (data: SignUpRequest): Promise<void> => {
        return apiFetch<void>('/api/auth/signup', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};
