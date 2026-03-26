import { useEffect, useState } from "react";
import { Table, Card, Button, Space, Tag, App } from "antd";
import { Link } from "@tanstack/react-router";
import axiosClient from "../api/axiosClient";
import Breadcrumb from "../components/Breadcrumb.tsx";
import {UsergroupAddOutlined, EyeOutlined} from "@ant-design/icons";
import { useTranslation } from "../hooks/useTranslation";

export const ClassroomAssignmentsPage = () => {
    const { t } = useTranslation();
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const { message } = App.useApp();

    const fetchClassrooms = async () => {
        setLoading(true);
        try {
            const offset = (page - 1) * pageSize;

            const { data } = await axiosClient.get("/counselor/assignments/classrooms", {
                params: {
                    offset,
                    limit: pageSize,
                },
            });

            setClassrooms(data.items || []);
            setTotal(data.total || 0);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.counselor.classroomAssignments.errorLoading;
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClassrooms();
    }, [page, pageSize]);

    const columns = [
        {
            title: t.counselor.classroomAssignments.classroom,
            dataIndex: "name",
            key: "name",
            render: (text: string, record: any) => (
                <Link to={`/counselor/classrooms/${record.id}/results`}>
                    <Button type="link" style={{ padding: 0 }}>{text}</Button>
                </Link>
            ),
        },
        {
            title: "High5",
            key: "gallupTest",
            render: (record: any) =>
                record.test_assignments.some((test: any) => test.test_type === "high5")
                    ? <Tag color="green">{t.counselor.classroomAssignments.hasAccess}</Tag>
                    : <Tag color="red">{t.counselor.classroomAssignments.noAccess}</Tag>,
        },
        {
            title: "Soft Skills",
            key: "softSkillsTest",
            render: (record: any) =>
                record.test_assignments.some((test: any) => test.test_type === "soft-skills")
                    ? <Tag color="green">{t.counselor.classroomAssignments.hasAccess}</Tag>
                    : <Tag color="red">{t.counselor.classroomAssignments.noAccess}</Tag>,
        },
        {
            title: "RIASEC",
            key: "hollandTest",
            render: (record: any) =>
                record.test_assignments.some((test: any) => test.test_type === "riasec")
                    ? <Tag color="green">{t.counselor.classroomAssignments.hasAccess}</Tag>
                    : <Tag color="red">{t.counselor.classroomAssignments.noAccess}</Tag>,
        },
        {
            title: t.common.questionnaire,
            key: "questionnaireTest",
            render: (record: any) =>
                record.test_assignments.some((test: any) => test.test_type === "questionnaire")
                    ? <Tag color="green">{t.counselor.classroomAssignments.hasAccess}</Tag>
                    : <Tag color="red">{t.counselor.classroomAssignments.noAccess}</Tag>,
        },
        {
            title: t.common.actions,
            key: "actions",
            render: (record: any) => (
                <Link to={`/counselor/classrooms/${record.id}/results`}>
                    <Button type="primary" size="small" icon={<EyeOutlined />}>
                        {t.counselor.classroomAssignments.results}
                    </Button>
                </Link>
            ),
        },
    ];

    return (
        <div className="p-6">
            <Card className={"mb-4!"}>
                <Breadcrumb
                    routes={[{ name: t.counselor.classroomAssignments.breadcrumb }]}
                />

                <h3 className={"text-2xl"}>{t.counselor.classroomAssignments.title}</h3>
            </Card>

            <Card
                extra={
                    <Space>
                        <Link to="/tests/assign/assign-tests">
                        <Button type="primary" icon={<UsergroupAddOutlined />}>{t.counselor.classroomAssignments.openAccess}</Button>
                        </Link>
                    </Space>
                }
            >
                <Table
                    rowKey="id"
                    dataSource={classrooms}
                    columns={columns}
                    loading={loading}
                    pagination={{
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
        </div>
    );
};