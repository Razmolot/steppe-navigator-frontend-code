import { useEffect, useState } from "react";
import {Button, Checkbox, Card, Form, Input, Select, App, DatePicker} from "antd";
import axiosClient from "../api/axiosClient";
import Breadcrumb from "../components/Breadcrumb.tsx";
import { useTranslation } from "../hooks/useTranslation";

export const AssignTestsPage = () => {
    const { t } = useTranslation();
    const [testTypes] = useState<any[]>([
        { label: "RIASEC", value: "riasec" },
        { label: "Soft Skills", value: "soft-skills" },
        { label: "High5", value: "high5" },
        { label: t.common.questionnaire, value: "questionnaire" },
    ]);
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [allClassroomsChecked, setAllClassroomsChecked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const { message } = App.useApp();

    useEffect(() => {
        fetchClassrooms();
    }, []);

    const fetchClassrooms = async () => {
        try {
            const { data } = await axiosClient.get("/counselor/my-classrooms", { params: { limit: 100 },
            });
            setClassrooms(data.items || []);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.counselor.assignTests.errorLoading;
            message.error(errorMessage);
        }
    };

    const buildPayload = (values: any) => ({
        test_types: values.test_types,
        classrooms: allClassroomsChecked ? [] : values.classrooms,
        assign_too_all_classrooms: allClassroomsChecked,
        expires_at: values.expires_at,
        meta: { description: values.description || "" },
    });
    
    const handleAssignTests = async (values: any) => {
        const payload = buildPayload(values);
    
        try {
            setLoading(true);
            await axiosClient.post("/counselor/assign/bulk", payload);
            message.success(t.counselor.assignTests.successMessage);
            form.resetFields();
            setAllClassroomsChecked(false);
        } catch (error: any) {
            const errMsg =
                error?.response?.data?.error ||
                t.counselor.assignTests.errorAssigning;
    
            message.error(errMsg);
        } finally {
            setLoading(false);
        }
    };
    
    const handleRevokeTests = async () => {
        try {
            const values = await form.validateFields();
            const payload = buildPayload(values);
    
            setLoading(true);
            await axiosClient.post("/counselor/assign/revoke", {
                test_types: payload.test_types,
                classrooms: payload.classrooms,
                assign_too_all_classrooms: payload.assign_too_all_classrooms,
            });
    
            message.success(t.counselor.assignTests.revokeSuccessMessage);
            form.resetFields();
            setAllClassroomsChecked(false);
        } catch (error: any) {
            const errMsg =
                error?.response?.data?.error ||
                t.counselor.assignTests.revokeError;
    
            message.error(errMsg);
        } finally {
            setLoading(false);
        }
    };
    


    return (
        <div className="p-6">
            <Card className={"mb-4!"}>
                <Breadcrumb
                    routes={[{ name: t.nav.assignTests, href: "/tests/assign/classrooms" }, { name: t.counselor.assignTests.breadcrumb }]}
                />

                <h3 className={"text-2xl"}>{t.counselor.assignTests.title}</h3>
            </Card>

            <Card title={t.counselor.assignTests.cardTitle} className={"mb-4!"}>
                <Form layout="vertical" form={form} onFinish={handleAssignTests}>
                    <Form.Item
                        label={t.counselor.assignTests.selectTest}
                        name="test_types"
                        rules={[{ required: true, message: t.counselor.assignTests.selectTestRequired }]}
                    >
                        <Select
                            mode="multiple"
                            placeholder={t.counselor.assignTests.selectTestPlaceholder}
                            optionFilterProp="children"
                        >
                            {testTypes.map((test) => (
                                <Select.Option key={test.value} value={test.value}>
                                    {test.label}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="assign_too_all_classrooms" valuePropName="checked">
                        <Checkbox
                            checked={allClassroomsChecked}
                            onChange={(e) => setAllClassroomsChecked(e.target.checked)}
                        >
                            {t.counselor.assignTests.assignToAllClassrooms}
                        </Checkbox>
                    </Form.Item>

                    {!allClassroomsChecked && (
                        <Form.Item
                            label={t.counselor.assignTests.selectClassrooms}
                            name="classrooms"
                            rules={[{ required: true, message: t.counselor.assignTests.selectClassroomsRequired }]}
                        >
                            <Select
                                mode="multiple"
                                placeholder={t.counselor.assignTests.selectClassroomsPlaceholder}
                                optionFilterProp="children"
                            >
                                {classrooms.map((classroom) => (
                                    <Select.Option key={classroom.id} value={classroom.id}>
                                        {classroom.name} - {classroom.school?.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}

                    <Form.Item label={t.counselor.assignTests.description} name="description">
                        <Input.TextArea placeholder={t.counselor.assignTests.descriptionPlaceholder} />
                    </Form.Item>

                    <Form.Item label={t.counselor.assignTests.expiryDate} name="expires_at">
                        <DatePicker className="w-full" />
                    </Form.Item>
                    <Form.Item>
                      <div style={{ display: "flex", gap: 12 }}>
                        <Button type="primary" htmlType="submit" loading={loading}>
                          {t.counselor.assignTests.submitButton}
                        </Button>
                    
                        <Button danger onClick={handleRevokeTests} loading={loading}>
                          {t.counselor.assignTests.revokeButton}
                        </Button>
                      </div>
                    </Form.Item>
                    

                </Form>
            </Card>
        </div>
    );
}