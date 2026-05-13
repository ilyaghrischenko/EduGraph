import type {ProblemDetails} from '../types/api';

const BASE_URL = 'http://localhost:5074';

/**
 * Извлекает токен авторизации из localStorage
 */
export const getToken = (): string | null => localStorage.getItem('token');

/**
 * Универсальный обработчик ошибок API. Выбрасывает строку с описанием ошибки.
 */
async function handleResponse<T>(response: Response): Promise<T> {
    if (response.ok) {
        if (response.status === 204) return null as T; // No Content

        const contentType = response.headers.get("content-type");
        const body = await response.text();

        if (!body) return null as T;

        if (contentType && contentType.includes("application/json")) {
            return JSON.parse(body) as T;
        }
        return body as T; // Для JWT токена, который возвращается как строка
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
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();
    const headers = new Headers(options.headers);
    headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    return handleResponse<T>(response);
}
