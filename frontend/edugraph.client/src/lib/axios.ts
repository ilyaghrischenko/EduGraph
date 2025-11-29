import axios from 'axios';

// Создаем инстанс с базовыми настройками
export const api = axios.create({
    // Лучше брать из переменных окружения, но для старта можно и так
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5074/api',
    headers: {
        'Content-Type': 'application/json',
    },
    // Таймаут запроса (чтобы не висело вечно)
    timeout: 10000,
});

// (Опционально) Интерцепторы для обработки токенов или ошибок
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Здесь можно глобально ловить 401 Unauthorized
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);