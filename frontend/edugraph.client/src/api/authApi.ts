import type {LoginRequest, SignUpRequest} from '../types/api';
import { apiFetch } from './apiClient';

export const authApi = {
    login: (data: LoginRequest): Promise<string> => {
        return apiFetch('/api/users/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    signUp: (data: SignUpRequest): Promise<void> => {
        return apiFetch('/api/users/signup', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};