import { useState } from "react";
import { cn } from "../../lib/utils";
import RegisterForm from "../../features/auth/forms/RegisterForm";

type Tab = "custom" | "csv";

export function AddUserPage() {
    const [activeTab, setActiveTab] = useState<Tab>("custom");

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Додати користувача</h2>

            {/* Табы */}
            <div className="flex border-b mb-6">
                <button
                    onClick={() => setActiveTab("custom")}
                    className={cn(
                        "px-6 py-2 font-medium transition-colors border-b-2",
                        activeTab === "custom"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    Вручну
                </button>
                <button
                    onClick={() => setActiveTab("csv")}
                    className={cn(
                        "px-6 py-2 font-medium transition-colors border-b-2",
                        activeTab === "csv"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    Таблиця (CSV)
                </button>
            </div>

            {/* Контент табов */}
            <div className="bg-white p-6 rounded-lg shadow border">
                {activeTab === "custom" ? (
                    <div>
                        <h3 className="text-lg font-medium mb-4">Ручне додавання</h3>
                        {/* Переиспользуем форму регистрации */}
                        <RegisterForm />
                    </div>
                ) : (
                    <div className="text-center py-10 border-2 border-dashed rounded-md text-gray-500">
                        <p>Перетягніть CSV файл сюди</p>
                        <p className="text-xs mt-2">або натисніть для вибору</p>
                    </div>
                )}
            </div>
        </div>
    );
}