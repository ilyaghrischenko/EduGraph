import { Button } from "../../../components/ui/Button";

// Тип данных, приходящих с бэкенда
export interface Application {
    id: number;
    fullName: string;
    type: "Student" | "Teacher";
    group: string | null;
    login: string;
    createdAt: string;
}

interface ApplicationsTableProps {
    data: Application[];
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
    onSort: () => void;
    isDescending: boolean;
}

export function ApplicationsTable({ data, onApprove, onReject, onSort, isDescending }: ApplicationsTableProps) {
    if (data.length === 0) {
        return <div className="p-4 bg-blue-50 text-blue-700 rounded-md">Немає нових заявок.</div>;
    }

    return (
        <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 border-b">
                <tr>
                    <th className="p-4 font-medium">ID</th>
                    <th className="p-4 font-medium">ПІБ</th>
                    <th className="p-4 font-medium">Тип</th>
                    <th className="p-4 font-medium">Група</th>
                    <th className="p-4 font-medium">Логін</th>
                    <th
                        className="p-4 font-medium cursor-pointer hover:bg-gray-200 transition"
                        onClick={onSort}
                    >
                        Дата заявки {isDescending ? "▼" : "▲"}
                    </th>
                    <th className="p-4 font-medium text-center">Дії</th>
                </tr>
                </thead>
                <tbody className="divide-y">
                {data.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                        <td className="p-4">{app.id}</td>
                        <td className="p-4">{app.fullName}</td>
                        <td className="p-4">{app.type === "Student" ? "Студент" : "Викладач"}</td>
                        <td className="p-4">{app.group || "-"}</td>
                        <td className="p-4">{app.login}</td>
                        <td className="p-4">{new Date(app.createdAt).toLocaleString()}</td>
                        <td className="p-4 flex justify-center gap-2">
                            <Button
                                variant="success"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => onApprove(app.id)}
                            >
                                Схвалити
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => onReject(app.id)}
                            >
                                Відхилити
                            </Button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}