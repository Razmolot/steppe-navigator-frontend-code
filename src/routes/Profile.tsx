import { useEffect, useState } from "react";
import {Card, Tabs, Form, Input, Button, App} from "antd";
import axiosClient from "../api/axiosClient";
import { useAuthStore } from "../store/useAuthStore";
import Breadcrumb from "../components/Breadcrumb.tsx";
import { useTranslation } from "../hooks/useTranslation";

export const Profile = () => {
    const { t } = useTranslation();
    const { user, fetchUser } = useAuthStore();
    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [changing, setChanging] = useState(false);
    const { message } = App.useApp();

    useEffect(() => {
        if (user) {
            form.setFieldsValue({
                name: user.name,
                email: user.email,
                phone: user.phone || "",
            });
        }
    }, [user]);

    const handleSave = async (values: any) => {
        setSaving(true);
        try {
            const { data } = await axiosClient.put("/user/profile", values);
            message.success(t.profile.saveSuccess);
            form.setFieldsValue(data);
            await fetchUser();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.profile.saveError;
            message.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (values: any) => {
        setChanging(true);
        try {
            await axiosClient.post("/user/change-password", values);
            message.success(t.profile.passwordChangeSuccess);
            passwordForm.resetFields();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.profile.passwordChangeError;
            message.error(errorMessage);
        } finally {
            setChanging(false);
        }
    };

    return (
        <div className="p-6">
            <Card className={'mb-4!'}>
                <Breadcrumb
                    routes={[
                    { name: t.common.profile }
                    ]}
                />

                <h3 className={'text-2xl'}>
                    {t.common.profile}
                </h3>
            </Card>

            <Card>
                <Tabs
                    defaultActiveKey="1"
                    destroyInactiveTabPane={false}
                    items={[
                        {
                            key: "1",
                            label: t.profile.title,
                            children: (
                                <Form
                                    form={form}
                                    layout="vertical"
                                    onFinish={handleSave}
                                    className="max-w-md mx-auto"
                                >
                                    <Form.Item
                                        label={t.profile.name}
                                        name="name"
                                        rules={[{ required: true, message: t.profile.enterName }]}
                                    >
                                        <Input placeholder={t.profile.enterName} />
                                    </Form.Item>

                                    <Form.Item
                                        label={t.profile.email}
                                        name="email"
                                        rules={[
                                            { required: true, message: t.profile.enterEmail },
                                            { type: "email", message: t.profile.invalidEmail },
                                        ]}
                                    >
                                        <Input placeholder={t.profile.enterEmail} />
                                    </Form.Item>

                                    <Form.Item label={t.profile.phone} name="phone">
                                        <Input placeholder="+7..." />
                                    </Form.Item>

                                    <Form.Item>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            loading={saving}
                                            className="mt-2"
                                        >
                                            {t.common.save}
                                        </Button>
                                    </Form.Item>
                                </Form>
                            ),
                        },
                        {
                            key: "2",
                            label: t.profile.changePasswordTab,
                            children: (
                                <Form
                                    form={passwordForm}
                                    layout="vertical"
                                    onFinish={handleChangePassword}
                                    className="max-w-md mx-auto"
                                >
                                    <Form.Item
                                        label={t.profile.currentPassword}
                                        name="current_password"
                                        rules={[{ min: 8, message: t.profile.minChars },{ required: true, message: t.profile.enterCurrentPassword }]}
                                    >
                                        <Input.Password autoComplete="current-password" />
                                    </Form.Item>

                                    <Form.Item
                                        label={t.profile.newPassword}
                                        name="new_password"
                                        rules={[{ min: 8, message: t.profile.minChars },{ required: true, message: t.profile.enterNewPassword }]}
                                    >
                                        <Input.Password autoComplete="new-password" />
                                    </Form.Item>

                                    <Form.Item
                                        label={t.profile.confirmPassword}
                                        name="new_password_confirmation"
                                        dependencies={["password"]}
                                        rules={[
                                            { min: 8, message: t.profile.minChars },
                                            { required: true, message: t.profile.confirmPasswordRequired },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (!value || getFieldValue("new_password") === value) {
                                                        return Promise.resolve();
                                                    }
                                                    return Promise.reject(
                                                        new Error(t.profile.passwordsNotMatch)
                                                    );
                                                },
                                            }),
                                        ]}
                                    >
                                        <Input.Password autoComplete="new-password" />
                                    </Form.Item>

                                    <Form.Item>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            loading={changing}
                                            className="mt-2"
                                        >
                                            {t.profile.changePassword}
                                        </Button>
                                    </Form.Item>
                                </Form>
                            ),
                        },
                    ]}
                />
            </Card>
        </div>
    );
};
