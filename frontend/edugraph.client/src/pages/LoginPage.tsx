import { Link } from "react-router-dom";
import { LoginForm } from "../features/auth/forms/LoginForm";

export function LoginPage() {
    return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border">
                <h2 className="text-2xl font-bold text-center mb-6">Вхід</h2>
                <LoginForm />
                <div className="mt-4 text-center text-sm">
                    <span>Немає аккаунту? </span>
                    <Link to="/register" className="text-blue-600 font-medium hover:underline">
                        Зареєструватись
                    </Link>
                </div>
            </div>
        </div>
    );
}