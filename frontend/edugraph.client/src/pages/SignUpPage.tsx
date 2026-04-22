// src/pages/SignUpPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { authApi } from '../api/authApi';
import type {SignUpRequest} from '../types/api';

const NAV_LINKS = [
    { label: 'Увійти', href: '/login' },
    { label: 'Зареєструватися', href: '/signup' },
];

export const SignUpPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        login: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        group: '',
    });
    const [userType, setUserType] = useState<'Student' | 'Teacher'>('Student');

    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Очищаем ошибку поля при вводе
        if (validationErrors[name]) {
            setValidationErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleUserTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newType = e.target.value as 'Student' | 'Teacher';
        setUserType(newType);
        if (newType === 'Teacher') {
            setFormData((prev) => ({ ...prev, group: '' }));
            if (validationErrors['group']) {
                setValidationErrors((prev) => ({ ...prev, group: '' }));
            }
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Паролі не збігаються';
        }
        if (userType === 'Student' && !formData.group.trim()) {
            errors.group = 'Поле Група є обов\'язковим для студента';
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);

        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const payload: SignUpRequest = {
                login: formData.login,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                fullName: formData.fullName,
                userType: userType,
                group: userType === 'Student' ? formData.group : null,
            };

            await authApi.signUp(payload);
            setSuccessMsg('Заявка успішно надіслана!');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = "block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white border border-gray-300 rounded transition ease-in-out focus:text-gray-700 focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-[0.25rem] focus:ring-[#258cfb]/40";

    return (
        <Layout navLinks={NAV_LINKS}>
            <div className="flex justify-center items-center min-h-[80vh] py-8">
                <div className="w-full max-w-md px-4">
                    <h2 className="text-center text-3xl font-medium mb-4">Заявка на реєстрацію</h2>

                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-[#f8d7da] text-[#842029] px-4 py-3 rounded mb-4 border border-[#f5c2c7]" role="alert">
                                {error}
                            </div>
                        )}
                        {successMsg && (
                            <div className="bg-[#d1e7dd] text-[#0f5132] px-4 py-3 rounded mb-4 border border-[#badbcc]" role="alert">
                                {successMsg}
                            </div>
                        )}

                        <div className="mb-4">
                            <label htmlFor="login" className="block text-gray-700 mb-2">Логін</label>
                            <input id="login" name="login" type="text" className={inputClass} value={formData.login} onChange={handleChange} required />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="password" className="block text-gray-700 mb-2">Пароль</label>
                            <input id="password" name="password" type="password" className={inputClass} value={formData.password} onChange={handleChange} required />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="confirmPassword" className="block text-gray-700 mb-2">Підтвердіть пароль</label>
                            <input id="confirmPassword" name="confirmPassword" type="password" className={inputClass} value={formData.confirmPassword} onChange={handleChange} required />
                            {validationErrors.confirmPassword && <span className="text-[#dc3545] text-sm mt-1">{validationErrors.confirmPassword}</span>}
                        </div>

                        <div className="mb-4">
                            <div className="flex items-center mb-1">
                                <input id="roleStudent" type="radio" name="userType" value="Student" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-[#258cfb]/40 focus:ring-[0.25rem]" checked={userType === 'Student'} onChange={handleUserTypeChange} />
                                <label htmlFor="roleStudent" className="ml-2 text-gray-700">Студент</label>
                            </div>
                            <div className="flex items-center">
                                <input id="roleTeacher" type="radio" name="userType" value="Teacher" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-[#258cfb]/40 focus:ring-[0.25rem]" checked={userType === 'Teacher'} onChange={handleUserTypeChange} />
                                <label htmlFor="roleTeacher" className="ml-2 text-gray-700">Викладач</label>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="fullName" className="block text-gray-700 mb-2">ПІБ</label>
                            <input id="fullName" name="fullName" type="text" className={inputClass} value={formData.fullName} onChange={handleChange} required />
                        </div>

                        {/* Conditional Group Field */}
                        <div className={`mb-4 ${userType !== 'Student' ? 'hidden' : 'block'}`} id="group-container">
                            <label htmlFor="group" className="block text-gray-700 mb-2">Група</label>
                            <input id="group" name="group" type="text" className={`${inputClass} ${validationErrors.group ? 'border-[#dc3545]' : ''}`} value={formData.group} onChange={handleChange} required={userType === 'Student'} />
                            {validationErrors.group && <span className="text-[#dc3545] text-sm mt-1">{validationErrors.group}</span>}
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full bg-[#1b6ec2] hover:bg-[#1861ac] text-white border border-[#1861ac] rounded px-4 py-2 transition-colors focus:outline-none focus:ring-[0.25rem] focus:ring-[#258cfb]/40 disabled:opacity-70">
                            {isLoading ? 'Обробка...' : 'Надіслати заявку'}
                        </button>
                    </form>

                    <div className="mt-3 text-gray-700">
                        Вже є аккаунт?
                        <Link to="/login" className="text-blue-600 hover:text-blue-800 ml-1 no-underline py-1 px-2 hover:bg-gray-100 rounded transition-colors">
                            Вхід
                        </Link>
                    </div>
                </div>
            </div>
        </Layout>
    );
};