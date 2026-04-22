// src/pages/AddUserPage.tsx
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';

const NAV_LINKS = [
    { label: 'Заявки на реєстрацію', href: '/admin/sign-up-applications' },
    { label: 'Додати користувача', href: '/admin/add-user' },
];

export const AddUserPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentType = searchParams.get('type') || 'custom';

    const handleTabChange = (type: 'custom' | 'csv') => {
        setSearchParams({ type });
    };

    const activeTabClass = "inline-block px-4 py-2 border-b-2 border-blue-600 text-blue-600 font-medium";
    const inactiveTabClass = "inline-block px-4 py-2 text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent transition-colors";

    return (
        <Layout navLinks={NAV_LINKS}>
            <div className="flex flex-col justify-start items-center min-h-[80vh] pt-8">
                <ul className="flex flex-wrap border-b border-gray-200 w-full justify-center mb-6 list-none pl-0">
                    <li className="mr-2">
                        <button
                            onClick={() => handleTabChange('custom')}
                            className={currentType === 'custom' ? activeTabClass : inactiveTabClass}
                        >
                            Вручну
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => handleTabChange('csv')}
                            className={currentType === 'csv' ? activeTabClass : inactiveTabClass}
                        >
                            Таблиця
                        </button>
                    </li>
                </ul>

                <div className="w-full text-center text-xl text-gray-700 mt-4">
                    {currentType === 'custom' ? (
                        <div>CUSTOM</div>
                    ) : (
                        <div>CSV</div>
                    )}
                </div>
            </div>
        </Layout>
    );
};