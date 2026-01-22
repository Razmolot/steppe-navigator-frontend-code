import { useEffect, useState } from "react";
import { Card, Spin, App, Button, Table, Tag, Popconfirm, Space } from "antd";
import { useNavigate, useParams, Link } from "@tanstack/react-router";
import axiosClient from "../../api/axiosClient";
import Breadcrumb from "../../components/Breadcrumb";
import { ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, EyeOutlined, KeyOutlined } from "@ant-design/icons";
import { useTranslation } from "../../hooks/useTranslation";

export const ClassroomResultsPage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const params = useParams({ strict: false });
  const classroomId = params.classroomId;

  useEffect(() => {
    if (classroomId) {
      fetchResults();
    }
  }, [classroomId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const { data: response } = await axiosClient.get(`/counselor/classrooms/${classroomId}/results`);
      setData(response);
    } catch (error: any) {
      message.error(t.counselor.classroomResults.errorLoading);
      navigate({ to: "/tests/assign/classrooms" });
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case "completed":
        return <Tag color="success" icon={<CheckCircleOutlined />}>{t.counselor.classroomResults.status.completed}</Tag>;
      case "in_progress":
      case "started":
        return <Tag color="processing" icon={<ClockCircleOutlined />}>{t.counselor.classroomResults.status.inProgress}</Tag>;
      default:
        return <Tag color="default" icon={<CloseCircleOutlined />}>{t.counselor.classroomResults.status.notStarted}</Tag>;
    }
  };

  // Проверяет, есть ли хотя бы один тест в процессе
  const hasTestInProgress = (student: any) => {
    const tests = student.tests;
    return Object.values(tests).some((test: any) => 
      test.status === 'in_progress' || test.status === 'started'
    );
  };

  // Проверяет, все ли тесты завершены (по статусу, а не по счётчику)
  const allTestsCompleted = (student: any) => {
    const tests = student.tests;
    return Object.values(tests).every((test: any) => test.status === 'completed');
  };

  const handleResetPassword = async (studentId: number) => {
    try {
      const { data: response } = await axiosClient.post(`/counselor/students/${studentId}/reset-password`);
      message.success(response.message || t.counselor.classroomResults.resetPasswordSuccess);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || t.counselor.classroomResults.resetPasswordError;
      message.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Spin size="large" />
        <div className="mt-4 text-gray-500">{t.counselor.classroomResults.loadingResults}</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const columns = [
    {
      title: "№",
      key: "index",
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: t.counselor.classroomResults.student,
      dataIndex: "student_name",
      key: "student_name",
      sorter: (a: any, b: any) => a.student_name.localeCompare(b.student_name),
    },
    {
      title: "RIASEC",
      key: "riasec",
      align: "center" as const,
      render: (record: any) => getStatusTag(record.tests.riasec.status),
    },
    {
      title: "Soft Skills",
      key: "soft_skills",
      align: "center" as const,
      render: (record: any) => getStatusTag(record.tests.soft_skills.status),
    },
    {
      title: "High5",
      key: "high5",
      align: "center" as const,
      render: (record: any) => getStatusTag(record.tests.high5.status),
    },
    {
      title: t.common.questionnaire,
      key: "questionnaire",
      align: "center" as const,
      render: (record: any) => getStatusTag(record.tests.questionnaire.status),
    },
    {
      title: t.counselor.classroomResults.completed,
      key: "completed_count",
      align: "center" as const,
      width: 120,
      sorter: (a: any, b: any) => b.completed_count - a.completed_count,
      render: (record: any) => (
        <span className="font-bold text-lg">
          {record.completed_count}/4
        </span>
      ),
    },
    {
      title: t.common.actions,
      key: "actions",
      width: 220,
      align: "center" as const,
      render: (record: any) => (
        <Space size="small">
          <Link to={`/counselor/students/${record.student_id}/results`}>
            <Button type="primary" size="small" icon={<EyeOutlined />}>
              {t.common.details}
            </Button>
          </Link>
          <Popconfirm
            title={`${t.counselor.classroomResults.resetPasswordConfirm} ${record.student_name}?`}
            onConfirm={() => handleResetPassword(record.student_id)}
            okText={t.common.yes}
            cancelText={t.common.no}
          >
            <Button size="small" icon={<KeyOutlined />}>
              {t.counselor.classroomResults.resetPassword}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Завершили все = ВСЕ 4 теста имеют статус 'completed'
  const completedStudents = data.students.filter(
    (s: any) => allTestsCompleted(s)
  ).length;

  // В процессе = есть тест со статусом 'in_progress' или 'started'
  const inProgressStudents = data.students.filter(
    (s: any) => hasTestInProgress(s)
  ).length;

  // Не начали = все остальные
  const notStartedStudents = data.students.length - completedStudents - inProgressStudents;

  return (
    <div className="p-6">
      <Card className="mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => window.history.back()}
          className="mb-4"
        >
          {t.common.back}
        </Button>

        <Breadcrumb
          routes={[
            { name: t.nav.assignTests, href: "/tests/assign/classrooms" },
            { name: data.classroom.name },
          ]}
        />
        
        <div className="mt-4">
          <h1 className="text-3xl font-bold">{data.classroom.name}</h1>
          <p className="text-gray-600 mt-1">
            {data.classroom.school.name}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {data.students.length}
            </div>
            <div className="text-gray-600 mt-1">{t.counselor.classroomResults.totalStudents}</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {completedStudents}
            </div>
            <div className="text-gray-600 mt-1">{t.counselor.classroomResults.completedAllTests}</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {inProgressStudents}
            </div>
            <div className="text-gray-600 mt-1">{t.counselor.classroomResults.inProgress}</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-600">
              {notStartedStudents}
            </div>
            <div className="text-gray-600 mt-1">{t.counselor.classroomResults.notStarted}</div>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-bold mb-4">{t.counselor.classroomResults.studentResults}</h2>
        <Table
          columns={columns}
          dataSource={data.students}
          rowKey="student_id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `${t.common.total}: ${total}`,
            locale: { items_per_page: t.common.itemsPerPage },
          }}
        />
      </Card>
    </div>
  );
};

