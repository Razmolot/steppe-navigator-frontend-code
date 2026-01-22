import { useEffect, useState } from "react";
import {Table, Button, Modal, Form, Input, Select, Card, Space, Popconfirm, Upload, App} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axiosClient from "../api/axiosClient";
import Breadcrumb from "../components/Breadcrumb.tsx";
import { useTranslation } from "../hooks/useTranslation";

export const ClassroomsPage = () => {
    const { t } = useTranslation();
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [schools, setSchools] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingClassroom, setEditingClassroom] = useState<any | null>(null);
    const [uploading, setUploading] = useState(false);
    const [form] = Form.useForm();
    const { message } = App.useApp();

    const [search, setSearch] = useState("");
    const [filterSchool, setFilterSchool] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    const fetchClassrooms = async () => {
        setLoading(true);
        try {
            const offset = (page - 1) * pageSize;

            const { data } = await axiosClient.get("/classrooms", {
                params: {
                    name: search || undefined,
                    school_id: filterSchool || undefined,
                    offset,
                    limit: pageSize,
                },
            });

            setClassrooms(data.items || data);
            setTotal(data.total || data.items?.length || 0);
        } catch {
            message.error(t.counselor.classroomsPage.errorLoadingClasses);
        } finally {
            setLoading(false);
        }
    };

    const fetchSchools = async () => {
        try {
            const { data } = await axiosClient.get("/schools");
            setSchools(data.items);
        } catch {
            message.error(t.counselor.classroomsPage.errorLoadingSchools);
        }
    };

    useEffect(() => {
        fetchClassrooms();
        fetchSchools();
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchClassrooms();
        }, 400);

        return () => clearTimeout(timeout);
    }, [search, filterSchool, page, pageSize]);

    const handleSaveClassroom = async (values: any) => {
        try {
            if (isEditMode && editingClassroom) {
                await axiosClient.put(`/classrooms/${editingClassroom.id}`, values);
                message.success(t.counselor.classroomsPage.classUpdated);
            } else {
                await axiosClient.post("/classrooms", values);
                message.success(t.counselor.classroomsPage.classCreated);
            }
            setIsModalVisible(false);
            setIsEditMode(false);
            setEditingClassroom(null);
            form.resetFields();
            fetchClassrooms();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.counselor.classroomsPage.errorSaving;
            message.error(errorMessage);
        }
    };

    const handleEditClassroom = (record: any) => {
        setIsEditMode(true);
        setEditingClassroom(record);
        form.setFieldsValue({
            name: record.name,
            school_id: record.school_id,
        });
        setIsModalVisible(true);
    };

    const handleDeleteClassroom = async (id: number) => {
        try {
            await axiosClient.delete(`/classrooms/${id}`);
            message.success(t.counselor.classroomsPage.classDeleted);
            fetchClassrooms();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.counselor.classroomsPage.errorDeleting;
            message.error(errorMessage);
        }
    };

    const handleBulkUpload = async (options: any) => {
        const { file, onSuccess, onError } = options;
        const formData = new FormData();
        formData.append("file", file);
        setUploading(true);
        try {
            await axiosClient.post("/classrooms/bulk-create", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            message.success(t.counselor.classroomsPage.classesUploaded);
            fetchClassrooms();
            onSuccess?.("ok");
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.counselor.classroomsPage.errorBulkUpload;
            message.error(errorMessage);
            onError?.();
        } finally {
            setUploading(false);
        }
    };

    const columns = [
        { title: "ID", dataIndex: "id", key: "id", width: 80 },
        { title: t.counselor.classroomsPage.name, dataIndex: "name", key: "name" },
        { title: t.counselor.classroomsPage.school, dataIndex: "school", key: "school", render: (school: any) => school?.name || "-" },
        {
            title: t.common.actions,
            key: "actions",
            render: (record: any) => (
                <Space>
                    <Button type="link" onClick={() => handleEditClassroom(record)}>{t.counselor.classroomsPage.edit}</Button>
                    <Popconfirm title={t.counselor.classroomsPage.deleteClassroom} onConfirm={() => handleDeleteClassroom(record.id)}>
                        <Button type="link" danger>{t.counselor.classroomsPage.delete}</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6">
            <Card className={'mb-4!'}>
                <Breadcrumb
                    routes={
                        [{ name: t.nav.classrooms }]
                    }
                />

                <h3 className={'text-2xl'}>
                    {t.nav.classrooms}
                </h3>
            </Card>

            <Card
                extra={
                    <Space>
                        <Input
                            placeholder={t.counselor.classroomsPage.searchPlaceholder}
                            allowClear
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            style={{ width: 220 }}
                        />

                        <Select
                            placeholder={t.counselor.classroomsPage.filterBySchool}
                            allowClear
                            value={filterSchool}
                            onChange={(value) => {
                                setFilterSchool(value || null);
                                setPage(1);
                            }}
                            style={{ width: 200 }}
                        >
                            {schools.map((s) => (
                                <Select.Option key={s.id} value={s.id}>
                                    {s.name}
                                </Select.Option>
                            ))}
                        </Select>

                        <Button
                            type="primary"
                            onClick={() => {
                                setIsEditMode(false);
                                setEditingClassroom(null);
                                form.resetFields();
                                setIsModalVisible(true);
                            }}
                        >
                            {t.counselor.classroomsPage.addClassroom}
                        </Button>

                        <Upload accept=".csv" customRequest={handleBulkUpload} showUploadList={false}>
                            <Button icon={<UploadOutlined />} loading={uploading}>
                                {t.counselor.classroomsPage.bulkUpload}
                            </Button>
                        </Upload>
                    </Space>
                }
            >
                <Table dataSource={classrooms} columns={columns} rowKey="id" loading={loading} pagination={{
                    current: page,
                    pageSize,
                    total,
                    showSizeChanger: true,
                    onChange: (p, ps) => {
                        setPage(p);
                        setPageSize(ps);
                    },
                }}
                />
            </Card>

            <Modal
                title={isEditMode ? t.counselor.classroomsPage.editClassroom : t.counselor.classroomsPage.addClassroom}
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    setIsEditMode(false);
                    setEditingClassroom(null);
                    form.resetFields();
                }}
                footer={null}
                destroyOnHidden
                maskClosable
            >
                <Form layout="vertical" form={form} onFinish={handleSaveClassroom}>
                    <Form.Item label={t.counselor.classroomsPage.name} name="name" rules={[{ required: true, message: t.counselor.classroomsPage.nameRequired }]}>
                        <Input placeholder={t.counselor.classroomsPage.namePlaceholder} />
                    </Form.Item>
                    <Form.Item label={t.counselor.classroomsPage.school} name="school_id" rules={[{ required: true, message: t.counselor.classroomsPage.schoolRequired }]}>
                        <Select placeholder={t.counselor.classroomsPage.schoolPlaceholder}>
                            {schools.map((s) => (
                                <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="w-full">
                            {isEditMode ? t.counselor.classroomsPage.save : t.counselor.classroomsPage.create}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
