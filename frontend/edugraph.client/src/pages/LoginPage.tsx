// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { authApi } from '../api/authApi';
import { getRoleFromToken } from '../utils/auth';

const NAV_LINKS = [
    { label: 'Увійти', href: '/login' },
    { label: 'Зареєструватися', href: '/signup' },
];

function getRedirectPath(token: string): string {
    const role = getRoleFromToken(token);
    switch (role) {
        case 'Student':
            return '/student/search';
        case 'Teacher':
        case 'Admin':
        default:
            return '/admin/sign-up-applications';
    }
}

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const token = await authApi.login({ login, password });
            localStorage.setItem('token', token);
            navigate(getRedirectPath(token));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Невідома помилка');
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass =
        'block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white border border-gray-300 rounded transition ease-in-out focus:text-gray-700 focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-[0.25rem] focus:ring-[#258cfb]/40';

    return (
        <Layout navLinks={NAV_LINKS}>
            <div className="flex justify-center items-center min-h-[80vh]">
                <div className="w-full max-w-md px-4">
                    <h2 className="text-center text-3xl font-medium mb-4">Вхід</h2>

                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div
                                className="bg-[#f8d7da] text-[#842029] px-4 py-3 rounded mb-4 border border-[#f5c2c7]"
                                role="alert"
                            >
                                {error}
                            </div>
                        )}

                        <div className="mb-4">
                            <label htmlFor="login" className="block text-gray-700 mb-2">
                                Логін
                            </label>
                            <input
                                id="login"
                                type="text"
                                className={inputClass}
                                value={login}
                                onChange={(e) => setLogin(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="password" className="block text-gray-700 mb-2">
                                Пароль
                            </label>
                            <input
                                id="password"
                                type="password"
                                className={inputClass}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#1b6ec2] hover:bg-[#1861ac] text-white border border-[#1861ac] rounded px-4 py-2 transition-colors focus:outline-none focus:ring-[0.25rem] focus:ring-[#258cfb]/40 disabled:opacity-70"
                        >
                            {isLoading ? 'Завантаження...' : 'Увійти'}
                        </button>
                    </form>

                    <div className="mt-3 text-gray-700">
                        Немає аккаунту?
                        <Link
                            to="/signup"
                            className="text-blue-600 hover:text-blue-800 ml-1 no-underline py-1 px-2 hover:bg-gray-100 rounded transition-colors"
                        >
                            Зареєструватись
                        </Link>
                    </div>
                </div>
            </div>
        </Layout>
    );
};