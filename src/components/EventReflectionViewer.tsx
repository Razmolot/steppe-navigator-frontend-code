import { useState, useEffect } from "react";
import { Spin, Typography } from "antd";
import axiosClient from "../api/axiosClient";
import { useTranslation } from "../hooks/useTranslation";
import dayjs from "dayjs";

interface ReflectionData {
    id: number;
    event_id: number;
    student_id: number;
    text: string;
    updated_at: string;
}

interface Props {
    studentId: number;
    eventId: number;
    studentName?: string;
}

export const EventReflectionViewer = ({ studentId, eventId, studentName }: Props) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [reflection, setReflection] = useState<ReflectionData | null>(null);
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        const fetchReflection = async () => {
            setLoading(true);
            try {
                const res = await axiosClient.get(
                    `/counselor/students/${studentId}/events/${eventId}/reflection`
                );
                setReflection(res.data.reflection);
            } catch (err) {
                const status = (err as { response?: { status?: number } }).response?.status;
                if (status === 403) {
                    setHidden(true);
                }
                setReflection(null);
            } finally {
                setLoading(false);
            }
        };
        fetchReflection();
    }, [studentId, eventId]);

    if (hidden) return null;

    return (
        <div className="mt-1">
            {studentName && (
                <Typography.Text type="secondary" className="text-sm block mb-1">
                    {studentName}
                </Typography.Text>
            )}
            {loading ? (
                <Spin size="small" />
            ) : reflection ? (
                <div className="p-3 bg-gray-50 rounded border">
                    <Typography.Paragraph style={{ whiteSpace: "pre-wrap", marginBottom: 4 }}>
                        {reflection.text}
                    </Typography.Paragraph>
                    <Typography.Text type="secondary" className="text-xs">
                        {t.events.reflection.updatedAt} {dayjs(reflection.updated_at).format("DD.MM.YYYY HH:mm")}
                    </Typography.Text>
                </div>
            ) : (
                <Typography.Text type="secondary" className="text-sm italic">
                    {t.events.reflection.notLeft}
                </Typography.Text>
            )}
        </div>
    );
};
