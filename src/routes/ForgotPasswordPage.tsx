import { useState } from "react";
import {Form, Input, Button, Card, App} from "antd";
import axiosClient from "../api/axiosClient";
import { useTranslation } from "../hooks/useTranslation";

export const ForgotPasswordPage = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [form] = Form.useForm();
    const { message } = App.useApp();

    const handleSubmit = async (values: any) => {
        setLoading(true);
        try {
            await axiosClient.post("/forgot-password", values);
            message.success(t.auth.emailSent);
            setEmailSent(true);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.auth.errorSendingEmail;
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <Card title={t.auth.passwordRecovery} className="w-full max-w-md shadow-md">
                {emailSent ? (
                    <p className="text-center text-green-600">
                        {t.auth.checkEmail}
                    </p>
                ) : (
                    <Form layout="vertical" form={form} onFinish={handleSubmit}>
                        <Form.Item
                            label={t.auth.email}
                            name="email"
                            rules={[
                                { required: true, message: t.auth.enterYourEmail },
                                { type: "email", message: t.auth.enterValidEmail },
                            ]}
                        >
                            <Input placeholder="example@mail.com" />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                className="w-full"
                            >
                                {t.auth.sendEmail}
                            </Button>
                        </Form.Item>
                    </Form>
                )}
            </Card>
        </div>
    );
};
