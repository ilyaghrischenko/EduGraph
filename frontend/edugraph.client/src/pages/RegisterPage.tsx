import { Link } from "react-router-dom";
import RegisterForm from "../features/auth/forms/RegisterForm";

export function RegisterPage() {
    return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border">
                <h2 className="text-2xl font-bold text-center mb-6">Заявка на реєстрацію</h2>
                <RegisterForm />
                <div className="mt-4 text-center text-sm">
                    <span>Вже є аккаунт? </span>
                    <Link to="/login" className="text-blue-600 font-medium hover:underline">
                        Вхід
                    </Link>
                </div>
            </div>
        </div>
    );
}