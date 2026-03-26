import { useState } from "react";
import {Form, Input, Button, Card, App} from "antd";
import axiosClient from "../api/axiosClient";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useTranslation } from "../hooks/useTranslation";

export const ResetPasswordPage = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const search = useSearch({ from: "/reset-password" });
    const { message } = App.useApp();

    const token = search?.token;
    const email = search?.email;

    const handleSubmit = async (values: any) => {
        setLoading(true);
        try {
            await axiosClient.post("/reset-password", {
                ...values,
                token,
                email,
            });
            message.success(t.auth.passwordChanged);
            navigate({ to: "/login" });
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.auth.errorResettingPassword;
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <Card title={t.auth.resetPassword} className="w-full max-w-md shadow-md">
                <Form layout="vertical" form={form} onFinish={handleSubmit}>
                    <Form.Item
                        label={t.auth.newPassword}
                        name="password"
                        rules={[{ required: true, message: t.auth.enterNewPassword }]}
                    >
                        <Input.Password placeholder={t.auth.enterNewPassword} autoComplete="new-password" />
                    </Form.Item>

                    <Form.Item
                        label={t.auth.confirmPassword}
                        name="password_confirmation"
                        dependencies={["password"]}
                        rules={[
                            { required: true, message: t.auth.confirmPasswordRequired },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue("password") === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error(t.auth.passwordsNotMatch));
                                },
                            }),
                        ]}
                    >
                        <Input.Password placeholder={t.auth.repeatPassword} autoComplete="new-password" />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            className="w-full"
                        >
                            {t.auth.resetPassword}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};
