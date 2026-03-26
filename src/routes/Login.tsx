import { useState } from "react";
import {App, Button, Card, Form, Input} from "antd";
import { useAuthStore } from "../store/useAuthStore";
import {Link, useNavigate} from "@tanstack/react-router";
import { useTranslation } from "../hooks/useTranslation";

export const Login = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const login = useAuthStore((s) => s.login);
    const navigate = useNavigate();
    const { message } = App.useApp();

    const onFinish = async (values: { email: string; password: string }) => {
        setLoading(true);
        const success = await login(values.email, values.password);
        setLoading(false);

        if (success) {
            message.success(t.auth.loginSuccess);
            navigate({ to: "/" });
        } else {
            message.error(t.auth.loginError);
        }
    };

    return (
        <div className={'w-screen h-screen flex flex-col items-center justify-center'}>
            <Card title={t.auth.loginTitle} style={{ width: 350 }}>
                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item name="email" label={t.auth.email} rules={[{ required: true }]}>
                        <Input placeholder={t.auth.enterEmail} autoComplete="email" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label={t.auth.password}
                        rules={[{ required: true }]}
                    >
                        <Input.Password placeholder={t.auth.enterPassword} autoComplete="current-password" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                        {t.auth.loginButton}
                    </Button>
                    <Link
                        to="/forgot-password"
                        className="mt-4 text-sm text-blue-600 hover:underline block text-center"
                    >
                        {t.auth.forgotPassword}
                    </Link>
                </Form>
            </Card>
        </div>
    );
};
