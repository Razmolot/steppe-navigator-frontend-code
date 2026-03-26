import { useEffect, useState } from "react";
import {Table, Button, Modal, Form, Input, Select, Card, Popconfirm, Upload, Space, App} from "antd";
import { Link } from "@tanstack/react-router";
import axiosClient from "../api/axiosClient";
import Breadcrumb from "../components/Breadcrumb.tsx";
import {UploadOutlined, EyeOutlined} from "@ant-design/icons";
import { useTranslation } from "../hooks/useTranslation";

export const StudentsPage = () => {
    const { t } = useTranslation();
    const [students, setStudents] = useState<any[]>([]);
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editForm] = Form.useForm();
    const [searchForm] = Form.useForm();
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const { message } = App.useApp();

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    const fetchStudents = async (params: any = {}) => {
        setLoading(true);
        try {
            const offset = (page - 1) * pageSize;

            const { data } = await axiosClient.get("/admin/students", {
                params: {
                    name: params.name || undefined,
                    iin: params.iin || undefined,
                    classroom_id: params.classroom_id || undefined,
                    offset,
                    limit: pageSize,
                }
            });

            setStudents(data.items || data);
            setTotal(data.total || 0);
        } catch {
            message.error(t.students.errorLoading);
        } finally {
            setLoading(false);
        }
    };

    const fetchClassrooms = async () => {
        try {
            const { data } = await axiosClient.get("/classrooms");
            setClassrooms(data.items);
        } catch {
            message.error(t.students.errorLoadingClassrooms);
        }
    };

    const handleSearch = (values: any) => {
        setPage(1);
        fetchStudents(values);
    };

    const handleCreateStudent = async (values: any) => {
        try {
            await axiosClient.post("/admin/create-student", values);
            message.success(t.students.studentAdded);
            setIsModalVisible(false);
            form.resetFields();
            fetchStudents();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.students.errorAdding;
            message.error(errorMessage);
        }
    };

    const handleEditStudent = async (values: any) => {
        try {
            await axiosClient.put(`/admin/update-student/${editingStudent.id}`, values);
            message.success(t.students.studentUpdated);
            setIsEditModalVisible(false);
            editForm.resetFields();
            fetchStudents();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.students.errorUpdating;
            message.error(errorMessage);
        }
    };

    const handleDeleteStudent = async (id: number) => {
        try {
            await axiosClient.delete(`/admin/delete-user/${id}`);
            message.success(t.students.studentDeleted);
            fetchStudents();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.students.errorDeleting;
            message.error(errorMessage);
        }
    };

    const handleToggleStatus = async (id: number) => {
        try {
            await axiosClient.post(`/admin/toggle-user-status/${id}`);
            message.success(t.students.statusChanged);
            fetchStudents();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.students.errorChangingStatus;
            message.error(errorMessage);
        }
    };

    const handleBulkUpload = async (options: any) => {
        const { file, onSuccess, onError } = options;
        const formData = new FormData();
        formData.append("file", file);
        setUploading(true);
        try {
            await axiosClient.post("/admin/bulk-students", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            message.success(t.students.bulkUploadSuccess);
            fetchStudents();
            onSuccess?.("ok");
        } catch (error: any) {
            const errMsg = error?.response?.data?.message || t.students.bulkUploadError;
            message.error(errMsg);
            onError?.();
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        const values = searchForm.getFieldsValue();
        fetchClassrooms();
        fetchStudents(values);
    }, [page, pageSize]);

    const columns = [
        { title: "ID", dataIndex: "id", key: "id", width: 80 },
        { title: t.students.name, dataIndex: "name", key: "name" },
        { title: t.students.email, dataIndex: "email", key: "email" },
        { title: t.students.phone, dataIndex: "phone", key: "phone" },
        { title: t.students.iin, dataIndex: "iin", key: "iin" },
        { title: t.students.classroom, key: "classroom", render: (record: any) => record.classroom?.name || "—" },
        { title: t.students.status, key: "is_active", render: (record: any) => (record.is_active ? t.students.active : t.students.inactive) },
        {
            title: t.common.actions,
            key: "actions",
            render: (record: any) => (
                <div className="flex gap-2">
                    <Link to={`/counselor/students/${record.id}/results`}>
                        <Button type="link" icon={<EyeOutlined />}>
                            {t.students.results}
                        </Button>
                    </Link>
                    <Button
                        type="link"
                        onClick={() => {
                            setEditingStudent(record);
                            editForm.setFieldsValue(record);
                            setIsEditModalVisible(true);
                        }}
                    >
                        {t.common.edit}
                    </Button>
                    <Popconfirm
                        title={t.students.deleteConfirm}
                        onConfirm={() => handleDeleteStudent(record.id)}
                        okText={t.common.yes}
                        cancelText={t.common.no}
                    >
                        <Button type="link" danger>
                            {t.common.delete}
                        </Button>
                    </Popconfirm>
                    <Button type="link" onClick={() => handleToggleStatus(record.id)}>
                        {record.is_active ? t.students.deactivate : t.students.activate}
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="p-6">
            <Card className={'mb-4!'}>
                <Breadcrumb
                    routes={
                        [{ name: t.nav.students }]
                    }
                />

                <h3 className={'text-2xl'}>
                    {t.nav.students}
                </h3>
            </Card>

            <Card title={t.common.search} className={'mb-4!'}>
                <Form layout="inline" form={searchForm} onFinish={handleSearch}>
                    <Form.Item name="name" label={t.students.name}>
                        <Input placeholder={t.students.enterName} id="search_name" />
                    </Form.Item>
                    <Form.Item name="classroom_id" label={t.students.classroom}>
                        <Select
                            placeholder={t.students.selectClassroom}
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            id="search_classroom"
                        >
                            {classrooms.map((classroom) => (
                                <Select.Option key={classroom.id} value={classroom.id}>
                                    {classroom.name} - {classroom.school?.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="iin" label={t.students.iin} id="search_iin">
                        <Input placeholder={t.students.iin} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            {t.common.search}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            <Card
                title={t.students.title}
                extra={
                <Space>
                    <Button type="primary" onClick={() => setIsModalVisible(true)}>
                        {t.students.addStudent}
                    </Button>
                    <Upload
                        accept=".csv"
                        customRequest={handleBulkUpload}
                        showUploadList={false}
                    >
                        <Button icon={<UploadOutlined/>} loading={uploading}>
                            {t.students.bulkUpload}
                        </Button>
                    </Upload>
                </Space>
                }
            >
                <Table
                    dataSource={students}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        onChange: (p, ps) => {
                            setPage(p);
                            setPageSize(ps);
                        }
                    }}
                />
            </Card>

            <Modal
                title={t.students.addStudent}
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
                destroyOnHidden
                maskClosable
            >
                <Form layout="vertical" form={form} onFinish={handleCreateStudent} autoComplete="off">
                    <Form.Item
                        label={t.students.name}
                        name="name"
                        rules={[{ required: true, message: t.students.enterName }]}
                    >
                        <Input placeholder={t.students.enterName} autoComplete="off" />
                    </Form.Item>

                    <Form.Item
                        label={t.students.email}
                        name="email"
                        rules={[
                            { required: true, message: t.students.enterEmail },
                            { type: "email", message: t.students.enterValidEmail },
                        ]}
                    >
                        <Input placeholder={t.students.enterEmail} />
                    </Form.Item>

                    <Form.Item
                        label={t.students.phone}
                        name="phone"
                        rules ={[{ required: true, message: t.students.enterPhone }]}
                    >
                        <Input placeholder={t.students.enterPhone} />
                    </Form.Item>

                    <Form.Item
                        label={t.students.iin}
                        name="iin"
                        rules={[{ required: true , message: t.students.enterIin }]}
                    >
                        <Input placeholder={t.students.enterIin} />
                    </Form.Item>

                    <Form.Item
                        label={t.auth.password}
                        name="password"
                        rules={[
                            { min: 8, message: t.students.minPassword },
                            { required: true, message: t.students.enterPassword },
                        ]}
                    >
                        <Input.Password placeholder={t.students.enterPassword} autoComplete="off" />
                    </Form.Item>

                    <Form.Item
                        label={t.students.classroom}
                        name="classroom_id"
                        rules={[{ required: true, message: t.students.selectClassroom }]}
                    >
                        <Select
                            placeholder={t.students.selectClassroom}
                            allowClear
                            showSearch
                            optionFilterProp="children"
                        >
                            {classrooms.map((classroom) => (
                                <Select.Option key={classroom.id} value={classroom.id}>
                                    {classroom.name} - {classroom.school?.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="w-full">
                            {t.students.create}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={t.students.editStudent}
                open={isEditModalVisible}
                onCancel={() => {
                    setIsEditModalVisible(false);
                    setEditingStudent(null);
                    editForm.resetFields();
                }}
                footer={null}
                destroyOnHidden
                maskClosable
            >
                <Form layout="vertical" form={editForm} onFinish={handleEditStudent}>
                    <Form.Item
                        label={t.students.name}
                        name="name"
                        rules={[{ required: true, message: t.students.enterName }]}
                    >
                        <Input placeholder={t.students.enterName} />
                    </Form.Item>

                    <Form.Item
                        label={t.students.email}
                        name="email"
                        rules={[
                            { required: true, message: t.students.enterEmail },
                            { type: "email", message: t.students.enterValidEmail },
                        ]}
                    >
                        <Input placeholder={t.students.enterEmail} />
                    </Form.Item>

                    <Form.Item
                        label={t.students.phone}
                        name="phone"
                        rules ={[{ required: true, message: t.students.enterPhone }]}
                    >
                        <Input placeholder={t.students.enterPhone} />
                    </Form.Item>

                    <Form.Item
                        label={t.students.iin}
                        name="iin"
                        rules={[{ required: true , message: t.students.enterIin }]}
                    >
                        <Input placeholder={t.students.enterIin} />
                    </Form.Item>

                    <Form.Item
                        label={t.students.classroom}
                        name="classroom_id"
                        rules={[{ required: true, message: t.students.selectClassroom }]}
                    >
                        <Select placeholder={t.students.selectClassroom} allowClear showSearch optionFilterProp={"children"}>
                            {classrooms.map((classroom) => (
                                <Select.Option key={classroom.id} value={classroom.id}>
                                    {classroom.name} - {classroom.school?.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="w-full">
                            {t.common.save}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
