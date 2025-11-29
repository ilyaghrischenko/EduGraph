import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { api } from "../../../lib/axios";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

// Схема валидации
const registerSchema = z
    .object({
        login: z.string().min(1, "Логин обязателен"),
        password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
        confirmPassword: z.string().min(1, "Подтвердите пароль"),
        userType: z.enum(["Student", "Teacher"]),
        fullName: z.string().min(2, "ПІБ обов'язкове"),
        group: z.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Пароли не совпадают",
        path: ["confirmPassword"],
    })
    .refine(
        (data) => {
            if (data.userType === "Student" && (!data.group || data.group.length < 1)) {
                return false;
            }
            return true;
        },
        {
            message: "Группа обязательна для студента",
            path: ["group"],
        }
    );

type RegisterSchema = z.infer<typeof registerSchema>;

// Используем именованный экспорт для совместимости с RegisterPage
export default function RegisterForm() {
    const navigate = useNavigate();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<RegisterSchema>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            userType: "Student",
        },
    });

    const userType = watch("userType");

    const onSubmit = async (data: RegisterSchema) => {
        setServerError(null);
        try {
            // POST запрос
            const response = await api.post("/users/signup", data);

            if (response.status === 200 || response.status === 204) {
                alert("Заявка успешно отправлена!");
                navigate("/login");
            }
        } catch (error: any) {
            const errorMessage = error.response?.data || "Ошибка при регистрации";
            setServerError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
        }
    };

    // Возвращаем ТОЛЬКО форму, без заголовков и внешних ссылок
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full">
            {serverError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm mb-4" role="alert">
                    {serverError}
                </div>
            )}

            <Input
                label="Логін"
                {...register("login")}
                error={errors.login?.message}
            />

            <Input
                label="Пароль"
                type="password"
                {...register("password")}
                error={errors.password?.message}
            />

            <Input
                label="Підтвердіть пароль"
                type="password"
                {...register("confirmPassword")}
                error={errors.confirmPassword?.message}
            />

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Роль</label>
                <div className="flex gap-4 p-3 border rounded-md bg-gray-50">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            value="Student"
                            {...register("userType")}
                            className="w-4 h-4 text-blue-600"
                        />
                        <span>Студент</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            value="Teacher"
                            {...register("userType")}
                            className="w-4 h-4 text-blue-600"
                        />
                        <span>Викладач</span>
                    </label>
                </div>
                {errors.userType && <p className="text-sm text-red-500">{errors.userType.message}</p>}
            </div>

            <Input
                label="ПІБ"
                {...register("fullName")}
                error={errors.fullName?.message}
            />

            {userType === "Student" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <Input
                        label="Група"
                        {...register("group")}
                        error={errors.group?.message}
                    />
                </div>
            )}

            <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                {isSubmitting ? "Отправка..." : "Надіслати заявку"}
            </Button>
        </form>
    );
}