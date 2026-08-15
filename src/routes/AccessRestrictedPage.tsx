import { Alert, Card, Typography } from "antd";
import { useAuthStore } from "../store/useAuthStore";
import { useTranslation } from "../hooks/useTranslation";

const { Paragraph, Text, Title } = Typography;

export const AccessRestrictedPage = () => {
    const { t } = useTranslation();
    const restriction = useAuthStore((s) => s.user?.access_restriction);
    const schools = restriction?.schools ?? [];
    const role = restriction?.role;
    const message = role === "career_counselor"
        ? t.accessRestriction.counselorMessage
        : role === "student"
            ? t.accessRestriction.studentMessage
            : restriction?.message ?? t.accessRestriction.fallback;

    return (
        <div className="max-w-3xl mx-auto mt-8">
            <Card>
                <Title level={3}>{t.accessRestriction.title}</Title>
                <Alert
                    type="warning"
                    showIcon
                    message={message}
                />
                {schools.length > 0 && (
                    <div className="mt-6">
                        <Paragraph strong>{t.accessRestriction.school}:</Paragraph>
                        {schools.map((school) => (
                            <Paragraph key={school.id}>
                                <Text strong>{school.name}</Text>
                                {school.reason ? <><br /><Text type="secondary">{t.accessRestriction.reason}: {school.reason}</Text></> : null}
                            </Paragraph>
                        ))}
                    </div>
                )}
                <Paragraph type="secondary" className="mt-6">
                    {t.accessRestriction.dataSaved}
                </Paragraph>
            </Card>
        </div>
    );
};
