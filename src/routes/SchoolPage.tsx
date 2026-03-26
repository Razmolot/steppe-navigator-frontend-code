import {useEffect, useState} from "react";
import {Table, Button, Modal, Form, Input, Select, Card, Space, Popconfirm, Upload, App} from "antd";
import {UploadOutlined} from "@ant-design/icons";
import axiosClient from "../api/axiosClient";
import Breadcrumb from "../components/Breadcrumb.tsx";
import { useTranslation } from "../hooks/useTranslation";

export const SchoolsPage = () => {
    const { t } = useTranslation();
    const [schools, setSchools] = useState<any[]>([]);
    const [counselors, setCounselors] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
    const [form] = Form.useForm();
    const [assignForm] = Form.useForm();
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingSchool, setEditingSchool] = useState<any | null>(null);
    const [uploading, setUploading] = useState(false);
    const { message } = App.useApp();

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    const fetchSchools = async () => {
        setLoading(true);
        try {
            const offset = (page - 1) * pageSize;

            const { data } = await axiosClient.get("/schools", {
                params: {
                    name: search || undefined,
                    offset,
                    limit: pageSize
                }
            });

            setSchools(data.items || data);
            setTotal(data.total || data.items?.length || 0);
        } catch {
            message.error(t.schools.errorLoading);
        } finally {
            setLoading(false);
        }
    };

    const fetchCounselors = async () => {
        try {
            const {data} = await axiosClient.get("/admin/counselors");
            setCounselors(data.items);
        } catch {
            message.error(t.counselors.errorLoading);
        }
    };

    const handleSaveSchool = async (values: any) => {
        try {
            if (isEditMode && editingSchool) {
                await axiosClient.put(`/schools/${editingSchool.id}`, values);
                message.success(t.schools.schoolUpdated);
            } else {
                await axiosClient.post("/schools", values);
                message.success(t.schools.schoolAdded);
            }
            setIsModalVisible(false);
            setIsEditMode(false);
            setEditingSchool(null);
            form.resetFields();
            fetchSchools();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.schools.errorAdding;
            message.error(errorMessage);
        }
    };

    const handleAssignCounselor = async (values: any) => {
        if (!selectedSchool) return;
        try {
            await axiosClient.post(`/schools/${selectedSchool}/assign-counselor`, values);
            message.success(t.schools.counselorAssigned);
            setIsAssignModalVisible(false);
            assignForm.resetFields();
            fetchSchools();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.schools.errorAssigning;
            message.error(errorMessage);
        }
    };

    const handleDeleteSchool = async (id: number) => {
        try {
            await axiosClient.delete(`/schools/${id}`);
            message.success(t.schools.schoolDeleted);
            fetchSchools();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.schools.errorDeleting;
            message.error(errorMessage);
        }
    };

    const handleEditSchool = (record: any) => {
        setIsEditMode(true);
        setEditingSchool(record);
        form.setFieldsValue({
            name: record.name,
            description: record.description || "",
        });
        setIsModalVisible(true);
    };

    const handleBulkUpload = async (options: any) => {
        const {file, onSuccess, onError} = options;
        const formData = new FormData();
        formData.append("file", file);
        setUploading(true);
        try {
            await axiosClient.post("/schools/bulk-create", formData, {
                headers: {"Content-Type": "multipart/form-data"},
            });
            message.success(t.schools.bulkUploadSuccess);
            fetchSchools();
            onSuccess?.("ok");
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.schools.bulkUploadError;
            message.error(errorMessage);
            onError?.();
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        fetchSchools();
        fetchCounselors();
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchSchools();
        }, 400);
        return () => clearTimeout(timeout);
    }, [search, page, pageSize]);

    const columns = [
        {title: "ID", dataIndex: "id", key: "id", width: 80},
        {title: t.schools.schoolName, dataIndex: "name", key: "name"},
        {title: t.schools.description, dataIndex: "description", key: "description"},
        {
            title: t.schools.classroomsCount,
            key: "classrooms",
            render: (record: any) => record.classrooms?.length || 0,
        },
        {
            title: t.counselors.title,
            key: "counselors",
            render: (record: any) => record.career_counselors?.map((c: any) => (
                <div key={c.id}>
                    {c.name} ({c.email})
                </div>
            )) || "-",
        },
        {
            title: t.common.actions,
            key: "actions",
            render: (record: any) => (
                <Space>
                    <Button type="link" onClick={() => handleEditSchool(record)}>
                        {t.common.edit}
                    </Button>

                    <Popconfirm
                        title={t.schools.deleteConfirm}
                        onConfirm={() => handleDeleteSchool(record.id)}
                    >
                        <Button type="link" danger>
                            {t.common.delete}
                        </Button>
                    </Popconfirm>

                    <Button
                        type="link"
                        onClick={() => {
                            setSelectedSchool(record.id);
                            setIsAssignModalVisible(true);
                        }}
                    >
                        {t.schools.assignCounselor}
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6">
            <Card className={'mb-4!'}>
                <Breadcrumb
                    routes={
                        [{ name: t.nav.schools }]
                    }
                />

                <h3 className={'text-2xl'}>
                    {t.nav.schools}
                </h3>
            </Card>

            <Card
                extra={
                    <Space style={{ paddingTop: 16, marginBottom: 16 }}>
                        <Input
                            placeholder={t.schools.searchByName}
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            allowClear
                            style={{ width: 300 }}
                        />

                        <Button type="primary" onClick={() => {
                            setIsEditMode(false);
                            setEditingSchool(null);
                            form.resetFields();
                            setIsModalVisible(true);
                        }}>
                            {t.schools.addSchool}
                        </Button>

                        <Upload
                            accept=".csv"
                            customRequest={handleBulkUpload}
                            showUploadList={false}
                        >
                            <Button icon={<UploadOutlined />} loading={uploading}>
                                {t.schools.bulkUpload}
                            </Button>
                        </Upload>
                    </Space>
                }
            >
                <Table
                    dataSource={schools}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: page,
                        pageSize: pageSize,
                        total: total,
                        onChange: (p, ps) => {
                            setPage(p);
                            setPageSize(ps);
                        },
                        showSizeChanger: true
                    }}
                />
            </Card>

            <Modal
                title={isEditMode ? t.schools.editSchool : t.schools.addSchool}
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    setIsEditMode(false);
                    setEditingSchool(null);
                    form.resetFields();
                }}
                footer={null}
                destroyOnHidden
                maskClosable
            >
                <Form layout="vertical" form={form} onFinish={handleSaveSchool}>
                    <Form.Item
                        label={t.schools.schoolName}
                        name="name"
                        rules={[{required: true, message: t.schools.enterSchoolName}]}
                    >
                        <Input placeholder={t.schools.enterName}/>
                    </Form.Item>

                    <Form.Item label={t.schools.description} name="description">
                        <Input.TextArea placeholder={t.schools.descriptionPlaceholder} rows={3}/>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="w-full">
                            {isEditMode ? t.common.save : t.students.create}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={t.schools.assignCounselor}
                open={isAssignModalVisible}
                onCancel={() => {
                    setIsAssignModalVisible(false);
                    assignForm.resetFields();
                }}
                footer={null}
                destroyOnHidden
                maskClosable
            >
                <Form layout="vertical" form={assignForm} onFinish={handleAssignCounselor}>
                    <Form.Item
                        label={t.counselors.title}
                        name="counselor_id"
                        rules={[{required: true, message: t.schools.selectCounselor}]}
                    >
                        <Select placeholder={t.schools.selectCounselor}>
                            {counselors.map((counselor) => (
                                <Select.Option key={counselor.id} value={counselor.id}>
                                    {counselor.name} ({counselor.email})
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="w-full">
                            {t.schools.assign}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
