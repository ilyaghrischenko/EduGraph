import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

// Схема валидации
const loginSchema = z.object({
    login: z.string().min(1, "Логин обязателен"),
    password: z.string().min(1, "Пароль обязателен"),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function LoginForm() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginSchema>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginSchema) => {
        // Здесь запрос к API
        console.log("Login data:", data);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Эмуляция запроса
        alert("Успешный вход!");
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Вхід..." : "Увійти"}
            </Button>
        </form>
    );
}