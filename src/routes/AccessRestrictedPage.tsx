import { Alert, Card, Typography } from "antd";
import { useAuthStore } from "../store/useAuthStore";

const { Paragraph, Text, Title } = Typography;

export const AccessRestrictedPage = () => {
    const restriction = useAuthStore((s) => s.user?.access_restriction);
    const schools = restriction?.schools ?? [];

    return (
        <div className="max-w-3xl mx-auto mt-8">
            <Card>
                <Title level={3}>Доступ временно ограничен</Title>
                <Alert
                    type="warning"
                    showIcon
                    message={restriction?.message ?? "Доступ к платформе временно ограничен."}
                />
                {schools.length > 0 && (
                    <div className="mt-6">
                        <Paragraph strong>Школа:</Paragraph>
                        {schools.map((school) => (
                            <Paragraph key={school.id}>
                                <Text strong>{school.name}</Text>
                                {school.reason ? <><br /><Text type="secondary">Причина: {school.reason}</Text></> : null}
                            </Paragraph>
                        ))}
                    </div>
                )}
                <Paragraph type="secondary" className="mt-6">
                    Ваши данные и результаты сохранены. После возобновления доступа можно будет продолжить работу в платформе.
                </Paragraph>
            </Card>
        </div>
    );
};
