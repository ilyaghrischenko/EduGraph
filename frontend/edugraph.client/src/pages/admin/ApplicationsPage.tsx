import { useState } from "react";
import {type Application, ApplicationsTable} from "../../features/admin/components/ApplicationsTable";

const MOCK_DATA: Application[] = [
    { id: 1, fullName: "Петренко Петро", type: "Student", group: "KI-21", login: "petrenko", createdAt: "2025-11-20T10:00:00" },
    { id: 2, fullName: "Василенко Василь", type: "Teacher", group: null, login: "vasilenko", createdAt: "2025-11-21T12:00:00" },
];

export function ApplicationsPage() {
    const [data, setData] = useState(MOCK_DATA);
    const [isDescending, setIsDescending] = useState(true);

    const handleSort = () => {
        setIsDescending(!isDescending);
        setData([...data].reverse());
    };

    const handleApprove = (id: number) => {
        if(confirm("Схвалити заявку?")) {
            console.log("Approve", id);
            setData(data.filter(i => i.id !== id));
        }
    };

    const handleReject = (id: number) => {
        if(confirm("Відхилити заявку?")) {
            console.log("Reject", id);
            setData(data.filter(i => i.id !== id));
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Заявки на реєстрацію</h2>
            <ApplicationsTable
                data={data}
                isDescending={isDescending}
                onSort={handleSort}
                onApprove={handleApprove}
                onReject={handleReject}
            />
        </div>
    );
}