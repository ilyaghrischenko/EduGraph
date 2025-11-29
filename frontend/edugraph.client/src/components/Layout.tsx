import { Link, Outlet, useLocation } from "react-router-dom";

export function Layout() {
    const location = useLocation();

    // Логика отображения хедера (как было в ViewBag.HasHeader)
    // Например, скрываем хедер на главной, если так нужно, или показываем везде
    const showHeader = location.pathname !== "/";

    // Простая проверка на "админа" по URL (в реальности нужно проверять токен/роль)
    const isAdmin = location.pathname.startsWith("/admin");

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {showHeader && (
                <header className="bg-white border-b shadow-sm">
                    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                        <Link to="/" className="text-xl font-bold text-gray-900">
                            EduGraph
                        </Link>

                        <nav>
                            <ul className="flex gap-6 text-sm font-medium">
                                {isAdmin ? (
                                    <>
                                        <li>
                                            <Link to="/admin/applications" className="hover:text-blue-600 transition">
                                                Заявки
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/admin/add-user" className="hover:text-blue-600 transition">
                                                Додати користувача
                                            </Link>
                                        </li>
                                    </>
                                ) : (
                                    <>
                                        <li>
                                            <Link to="/login" className="hover:text-blue-600 transition">
                                                Увійти
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/register" className="hover:text-blue-600 transition">
                                                Зареєструватися
                                            </Link>
                                        </li>
                                    </>
                                )}
                            </ul>
                        </nav>
                    </div>
                </header>
            )}

            <main className="container mx-auto px-4 py-8 flex-1">
                <Outlet />
            </main>

            <footer className="border-t py-6 bg-white text-center text-sm text-gray-500">
                <div className="container mx-auto">
                    &copy; 2025 - EduGraph - <Link to="/privacy" className="hover:underline">Privacy</Link>
                </div>
            </footer>
        </div>
    );
}