// src/pages/SignUpApplicationsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { adminsApi } from '../api/adminsApi';
import type {PaginationResponse, SignUpApplicationResponse} from '../types/api';

const NAV_LINKS = [
    { label: 'Заявки на реєстрацію', href: '/admin/sign-up-applications' },
    { label: 'Додати користувача', href: '/admin/add-user' },
];

export const SignUpApplicationsPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const isDescending = searchParams.get('descending') === 'true';

    const [data, setData] = useState<PaginationResponse<SignUpApplicationResponse> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

    const fetchApplications = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await adminsApi.getApplications(page, 30, isDescending);
            setData(response);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [page, isDescending]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const toggleSort = () => {
        setSearchParams({ page: '1', descending: (!isDescending).toString() });
    };

    const changePage = (newPage: number) => {
        setSearchParams({ page: newPage.toString(), descending: isDescending.toString() });
    };

    const handleApprove = async (id: number) => {
        setActionLoadingId(id);
        setError(null);
        try {
            await adminsApi.approveApplication(id);
            await fetchApplications(); // Повторный запрос без перезагрузки
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleReject = async (id: number) => {
        setActionLoadingId(id);
        setError(null);
        try {
            await adminsApi.rejectApplication(id);
            await fetchApplications(); // Повторный запрос без перезагрузки
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoadingId(null);
        }
    };

    const hasItems = data && data.items && data.items.length > 0;

    return (
        <Layout navLinks={NAV_LINKS}>
            <h2 className="text-center text-3xl font-medium mt-4 mb-2">Заявки на реєстрацію</h2>
            <hr className="my-4 border-gray-200" />

            {error && (
                <div className="bg-[#f8d7da] text-[#842029] px-4 py-3 rounded mb-4 border border-[#f5c2c7]" role="alert">
                    {error}
                </div>
            )}

            {isLoading && !data ? (
                <div className="text-center text-gray-500 py-8">Завантаження...</div>
            ) : !hasItems ? (
                <div className="bg-[#cff4fc] text-[#055160] px-4 py-3 rounded border border-[#b6effb]" role="alert">
                    Наразі немає нових заявок на реєстрацію.
                </div>
            ) : (
                <>
                    <div className="border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-3 text-center text-sm font-bold text-gray-900 border-b-2">ID</th>
                                <th className="px-3 py-3 text-center text-sm font-bold text-gray-900 border-b-2">ПІБ</th>
                                <th className="px-3 py-3 text-center text-sm font-bold text-gray-900 border-b-2">Тип</th>
                                <th className="px-3 py-3 text-center text-sm font-bold text-gray-900 border-b-2">Група</th>
                                <th className="px-3 py-3 text-center text-sm font-bold text-gray-900 border-b-2">Логін</th>
                                <th className="px-3 py-3 text-center text-sm font-bold text-gray-900 border-b-2">
                                    <button
                                        onClick={toggleSort}
                                        className="text-gray-900 font-bold hover:text-blue-600 focus:outline-none flex items-center justify-center w-full"
                                    >
                                        Дата заявки
                                        <span className="text-xs text-gray-500 ml-1">
                        {isDescending ? '▼' : '▲'}
                      </span>
                                    </button>
                                </th>
                                <th className="px-3 py-3 text-center text-sm font-bold text-gray-900 border-b-2 w-[150px]">Дії</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {data.items.map((app) => (
                                <tr key={app.id} className="hover:bg-gray-50 transition-colors even:bg-[#f2f2f2]">
                                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-700">{app.id}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-700">{app.fullName}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-700">{app.userType}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-700">{app.group ?? "N/A"}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-700">{app.login}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-700">
                                        {new Date(app.createdAt).toLocaleString('uk-UA')}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm">
                                        <div className="flex flex-row justify-center gap-2">
                                            <button
                                                onClick={() => handleApprove(app.id)}
                                                disabled={actionLoadingId === app.id}
                                                className="bg-[#198754] hover:bg-[#157347] text-white rounded px-2 py-1 text-sm transition-colors focus:ring-[0.25rem] focus:ring-[#198754]/40 disabled:opacity-65"
                                            >
                                                Схвалити
                                            </button>
                                            <button
                                                onClick={() => handleReject(app.id)}
                                                disabled={actionLoadingId === app.id}
                                                className="bg-[#dc3545] hover:bg-[#bb2d3b] text-white rounded px-2 py-1 text-sm transition-colors focus:ring-[0.25rem] focus:ring-[#dc3545]/40 disabled:opacity-65"
                                            >
                                                Відхилити
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <nav className="mt-4 flex justify-center">
                        <ul className="flex list-none rounded pl-0">
                            <li>
                                <button
                                    onClick={() => changePage(page - 1)}
                                    disabled={page === 1}
                                    className="relative block py-1.5 px-3 bg-white border border-gray-300 text-blue-600 hover:bg-gray-200 disabled:text-gray-400 disabled:bg-white disabled:cursor-not-allowed rounded-l transition-colors"
                                >
                                    Попередня
                                </button>
                            </li>
                            <li>
                <span className="relative block py-1.5 px-3 bg-white border-t border-b border-gray-300 text-gray-500 cursor-default">
                  Сторінка {data.currentPage} з {data.totalPages}
                </span>
                            </li>
                            <li>
                                <button
                                    onClick={() => changePage(page + 1)}
                                    disabled={page === data.totalPages || data.totalPages === 0}
                                    className="relative block py-1.5 px-3 bg-white border border-gray-300 text-blue-600 hover:bg-gray-200 disabled:text-gray-400 disabled:bg-white disabled:cursor-not-allowed rounded-r transition-colors"
                                >
                                    Наступна
                                </button>
                            </li>
                        </ul>
                    </nav>
                </>
            )}
        </Layout>
    );
};