import type {ProblemDetails} from '../types/api';

const BASE_URL = 'http://localhost:5074';

/**
 * Извлекает токен авторизации из localStorage
 */
export const getToken = (): string | null => localStorage.getItem('token');

/**
 * Универсальный обработчик ошибок API. Выбрасывает строку с описанием ошибки.
 */
async function handleResponse(response: Response): Promise<any> {
    if (response.ok) {
        if (response.status === 204) return null; // No Content

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return response.json();
        }
        return response.text(); // Для JWT токена, который возвращается как строка
    }

    let errorMsg = 'Сталася невідома помилка';
    try {
        const errorData = (await response.json()) as ProblemDetails;
        errorMsg = errorData.detail || errorData.title || errorMsg;
    } catch {
        // Fallback, если сервер вернул не JSON (например, 500 HTML)
        errorMsg = response.statusText;
    }

    throw new Error(errorMsg);
}

/**
 * Базовая функция для выполнения запросов с нативным fetch
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = getToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    return handleResponse(response);
}