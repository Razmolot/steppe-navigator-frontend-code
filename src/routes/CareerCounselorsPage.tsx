import { useEffect, useState } from "react";
import {Table, Button, Modal, Form, Input, Select, Card, Popconfirm, App, Upload, Space} from "antd";
import axiosClient from "../api/axiosClient";
import Breadcrumb from "../components/Breadcrumb.tsx";
import { useTranslation } from "../hooks/useTranslation";

export const CareerCounselorsPage = () => {
    const { t } = useTranslation();
    const [counselors, setCounselors] = useState<any[]>([]);
    const [schools, setSchools] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editForm] = Form.useForm();
    const [searchForm] = Form.useForm();
    const [editingCounselor, setEditingCounselor] = useState<any>(null);
    const { message } = App.useApp();

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    const fetchCounselors = async (params: any = {}) => {
        setLoading(true);
        try {
            const offset = (page - 1) * pageSize;

            const { data } = await axiosClient.get("/admin/counselors", {
                params: {
                    name: params.name || undefined,
                    school_id: params.school_id || undefined,
                    inn: params.iin || undefined,
                    offset,
                    limit: pageSize,
                }
            });

            setCounselors(data.items || []);
            setTotal(data.total || 0);
        } catch {
            message.error(t.counselors.errorLoading);
        } finally {
            setLoading(false);
        }
    };

    const fetchSchools = async () => {
        try {
            const { data } = await axiosClient.get("/schools");
            setSchools(data.items);
        } catch {
            message.error(t.counselors.errorLoadingSchools);
        }
    };

    const handleSearch = (values: any) => {
        setPage(1);
        fetchCounselors(values);
    };

    const handleCreateCounselor = async (values: any) => {
        try {
            await axiosClient.post("/admin/create-counselor", values);
            message.success(t.counselors.counselorAdded);
            setIsModalVisible(false);
            form.resetFields();
            fetchCounselors();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.counselors.errorAdding;
            message.error(errorMessage);
        }
    };
    
    const handleBulkUploadCounselors = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append("file", file);

            const { data } = await axiosClient.post("/admin/bulk-counselors", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });

            message.success(data?.message || "Профориентаторы успешно созданы");
            fetchCounselors(searchForm.getFieldsValue());
          } catch (error: any) {
            const errorMessage =
              error.response?.data?.message || "Ошибка массовой загрузки";
            message.error(errorMessage);
          }
        };


    const handleEditCounselor = async (values: any) => {
        try {
            await axiosClient.put(`/admin/update-counselor/${editingCounselor.id}`, values);
            message.success(t.counselors.counselorUpdated);
            setIsEditModalVisible(false);
            editForm.resetFields();
            fetchCounselors();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.counselors.errorUpdating;
            message.error(errorMessage);
        }
    };

    const handleDeleteCounselor = async (id: number) => {
        try {
            await axiosClient.delete(`/admin/delete-user/${id}`);
            message.success(t.counselors.counselorDeleted);
            fetchCounselors();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.counselors.errorDeleting;
            message.error(errorMessage);
        }
    };

    const handleToggleStatus = async (id: number) => {
        try {
            await axiosClient.post(`/admin/toggle-user-status/${id}`);
            message.success(t.counselors.statusChanged);
            fetchCounselors();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.counselors.errorChangingStatus;
            message.error(errorMessage);
        }
    };
    
    const handleResetCounselorPassword = async (id: number) => {
        try {
            await axiosClient.put(`/admin/update-counselor/${id}`, {
                password: "qwerty1234",
            });
            message.success("Пароль сброшен на qwerty1234");
            fetchCounselors(searchForm.getFieldsValue());
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message || "Ошибка при сбросе пароля";
            message.error(errorMessage);
        }
    };

    

    useEffect(() => {
        const values = searchForm.getFieldsValue();
        fetchSchools();
        fetchCounselors(values);
    }, [page, pageSize]);

    const columns = [
        { title: "ID", dataIndex: "id", key: "id", width: 80 },
        { title: t.counselors.name, dataIndex: "name", key: "name" },
        { title: t.counselors.email, dataIndex: "email", key: "email" },
        { title: t.counselors.phone, dataIndex: "phone", key: "phone" },
        { title: t.counselors.iin, dataIndex: "iin", key: "iin" },
        { title: t.counselors.schools, key: "school", render: (record: any) => record.schools.map((school: any) => school.name).join(", ") || "-" },
        { title: t.counselors.status, key: "is_active", render: (record: any) => (record.is_active ? t.counselors.active : t.counselors.inactive) },
        {
            title: t.common.actions,
            key: "actions",
            render: (record: any) => (
                <div className="flex gap-2">
                    <Button
                        type="link"
                        onClick={() => {
                            setEditingCounselor(record);
                            editForm.setFieldsValue(record);
                            setIsEditModalVisible(true);
                        }}
                    >
                        {t.common.edit}
                    </Button>
                    <Popconfirm
                        title={t.counselors.deleteConfirm}
                        onConfirm={() => handleDeleteCounselor(record.id)}
                        okText={t.common.yes}
                        cancelText={t.common.no}
                    >
                        <Button type="link" danger>
                            {t.common.delete}
                        </Button>
                    </Popconfirm>
                    
                    <Popconfirm
                        title="Сбросить пароль профориентатора на qwerty1234?"
                        onConfirm={() => handleResetCounselorPassword(record.id)}
                        okText={t.common.yes}
                        cancelText={t.common.no}
                    >
                        <Button type="link">
                            Сбросить пароль
                        </Button>
                    </Popconfirm>


                    
                    <Button type="link" onClick={() => handleToggleStatus(record.id)}>
                        {record.is_active ? t.counselors.deactivate : t.counselors.activate}
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="p-6">
            <Card className={'mb-4!'}>
                <Breadcrumb
                    routes={[{ name: t.nav.careerCounselors }]}
                />
                <h3 className={'text-2xl'}>{t.nav.careerCounselors}</h3>
            </Card>

            <Card title={t.counselors.search} className={'mb-4!'}>
                <Form layout="inline" form={searchForm} onFinish={handleSearch}>
                    <Form.Item name="name" label={t.counselors.name}>
                        <Input placeholder={t.counselors.enterName} id="search_name" />
                    </Form.Item>
                    <Form.Item name="school_id" label={t.counselors.school}>
                        <Select placeholder={t.counselors.selectSchool} id="search_classroom" allowClear
                                showSearch
                                optionFilterProp="children">
                            {schools.map((school) => (
                                <Select.Option key={school.id} value={school.id}>
                                    {school.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="iin" label={t.counselors.iin}>
                        <Input placeholder={t.counselors.iin} id="search_iin" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            {t.common.search}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            <Card
                title={t.counselors.title}
                extra={
                  <Space>
                    <Upload
                      accept=".csv,.txt"
                      showUploadList={false}
                      beforeUpload={(file) => {
                        handleBulkUploadCounselors(file as unknown as File);
                        return false;
                      }}
                    >
                      <Button>Массовая загрузка (CSV)</Button>
                    </Upload>

                    <Button type="primary" onClick={() => setIsModalVisible(true)}>
                      {t.counselors.addCounselor}
                    </Button>
                  </Space>
                }

            >
                <Table
                    dataSource={counselors}
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

            {/* Создание */}
            <Modal
                title={t.counselors.addCounselor}
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
                destroyOnHidden
                maskClosable
            >
                <Form layout="vertical" form={form} onFinish={handleCreateCounselor} autoComplete="off">
                    <Form.Item label={t.counselors.name} name="name" rules={[{ required: true, message: t.counselors.enterName }]}>
                        <Input placeholder={t.counselors.enterName} autoComplete="off" />
                    </Form.Item>

                    <Form.Item
                        label={t.counselors.email}
                        name="email"
                        rules={[
                            { required: true, message: t.counselors.enterEmail },
                            { type: "email", message: t.counselors.enterValidEmail },
                        ]}
                    >
                        <Input placeholder={t.counselors.enterEmail} />
                    </Form.Item>

                    <Form.Item label={t.counselors.phone} name="phone" rules={[{ required: true, message: t.counselors.enterPhone }]}>
                        <Input placeholder={t.counselors.enterPhone} />
                    </Form.Item>

                    <Form.Item label={t.counselors.iin} name="iin" rules={[{ required: true, message: t.counselors.enterIin }]}>
                        <Input placeholder={t.counselors.enterIin} />
                    </Form.Item>

                    <Form.Item
                        label={t.auth.password}
                        name="password"
                        rules={[
                            { min: 8, message: t.counselors.minPassword },
                            { required: true, message: t.counselors.enterPassword },
                        ]}
                    >
                        <Input.Password placeholder={t.counselors.enterPassword} autoComplete="off" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="w-full">
                            {t.counselors.create}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Редактирование */}
            <Modal
                title={t.counselors.editCounselor}
                open={isEditModalVisible}
                onCancel={() => {
                    setIsEditModalVisible(false);
                    setEditingCounselor(null);
                    editForm.resetFields();
                }}
                footer={null}
                destroyOnHidden
                maskClosable
            >
                <Form layout="vertical" form={editForm} onFinish={handleEditCounselor}>
                    <Form.Item label={t.counselors.name} name="name" rules={[{ required: true, message: t.counselors.enterName }]}>
                        <Input placeholder={t.counselors.enterName} />
                    </Form.Item>

                    <Form.Item
                        label={t.counselors.email}
                        name="email"
                        rules={[
                            { required: true, message: t.counselors.enterEmail },
                            { type: "email", message: t.counselors.enterValidEmail },
                        ]}
                    >
                        <Input placeholder={t.counselors.enterEmail} />
                    </Form.Item>

                    <Form.Item label={t.counselors.phone} name="phone" rules={[{ required: true, message: t.counselors.enterPhone }]}>
                        <Input placeholder={t.counselors.enterPhone} />
                    </Form.Item>

                    <Form.Item label={t.counselors.iin} name="iin" rules={[{ required: true, message: t.counselors.enterIin }]}>
                        <Input placeholder={t.counselors.enterIin} />
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
