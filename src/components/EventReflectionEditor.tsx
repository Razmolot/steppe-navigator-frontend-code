import { useState, useEffect } from "react";
import { Input, Button, Spin, Typography, App } from "antd";
import axiosClient from "../api/axiosClient";
import { useTranslation } from "../hooks/useTranslation";
import dayjs from "dayjs";

interface Props {
    eventId: number;
}

const MAX_LENGTH = 10_000;

export const EventReflectionEditor = ({ eventId }: Props) => {
    const { t } = useTranslation();
    const { message } = App.useApp();
    const [text, setText] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const [charError, setCharError] = useState(false);
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        const fetchReflection = async () => {
            setLoading(true);
            try {
                const res = await axiosClient.get(`/student/events/${eventId}/reflection`);
                setText(res.data.reflection?.text ?? "");
                if (res.data.reflection?.updated_at) {
                    setSavedAt(dayjs(res.data.reflection.updated_at).format("HH:mm"));
                }
            } catch (err) {
                const status = (err as { response?: { status?: number } }).response?.status;
                if (status === 403) {
                    setHidden(true);
                } else if (status === 404) {
                    setText("");
                } else {
                    message.error(t.events.reflection.errorLoading);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchReflection();
    }, [eventId]);

    const handleSave = async () => {
        if (text.length > MAX_LENGTH) {
            setCharError(true);
            return;
        }
        setCharError(false);
        setSaving(true);
        try {
            const res = await axiosClient.put(`/student/events/${eventId}/reflection`, {
                text: text.trim() === "" ? null : text,
            });
            if (res.data.reflection?.updated_at) {
                setSavedAt(dayjs(res.data.reflection.updated_at).format("HH:mm"));
            } else {
                setSavedAt(null);
            }
            message.success(res.data.message || t.events.reflection.saved);
        } catch (err) {
            const status = (err as { response?: { status?: number } }).response?.status;
            if (status === 422) {
                setCharError(true);
            } else {
                message.error(t.events.reflection.errorSaving);
            }
        } finally {
            setSaving(false);
        }
    };

    if (hidden) return null;

    return (
        <div className="mt-4">
            <Typography.Text strong>{t.events.reflection.title}</Typography.Text>
            {loading ? (
                <div className="mt-2">
                    <Spin size="small" />
                </div>
            ) : (
                <div className="mt-2">
                    <Input.TextArea
                        rows={4}
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value);
                            if (charError && e.target.value.length <= MAX_LENGTH) {
                                setCharError(false);
                            }
                        }}
                        placeholder={t.events.reflection.placeholder}
                        maxLength={MAX_LENGTH}
                        showCount
                        disabled={saving}
                    />
                    {charError && (
                        <Typography.Text type="danger" className="text-sm mt-1 block">
                            {t.events.reflection.tooLong}
                        </Typography.Text>
                    )}
                    <div className="flex justify-between items-center mt-2">
                        <span>
                            {savedAt && (
                                <Typography.Text type="secondary" className="text-sm">
                                    {t.events.reflection.updatedAt} {savedAt}
                                </Typography.Text>
                            )}
                        </span>
                        <Button
                            type="primary"
                            loading={saving}
                            disabled={charError}
                            onClick={handleSave}
                        >
                            {t.events.reflection.save}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
