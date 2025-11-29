import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import {api} from "../../../lib/axios.ts";
import {Link} from "react-router-dom";

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
        const response = await api.post("/users/signup", data);

        if (response.status === 204) {
            return <Link to={"/login"} />
        }
        else {
            alert(response.data);
        }
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