import { useEffect, useState } from "react";
import { Card, Spin, App, Button, Tabs, Popconfirm } from "antd";
import { useNavigate, useParams } from "@tanstack/react-router";
import axiosClient from "../../api/axiosClient";
import Breadcrumb from "../../components/Breadcrumb";
import { QuestionnaireReport } from "../../components/QuestionnaireReport/QuestionnaireReport";
import { High5Report } from "../../components/High5Report/High5Report";
import { RiasecReport } from "../../components/RiasecReport/RiasecReport";
import { SoftSkillReport } from "../../components/SoftSkillReport/SoftSkillReport";
import { ArrowLeftOutlined, CheckCircleOutlined, DeleteOutlined, FileTextOutlined } from "@ant-design/icons";
import { useTranslation } from "../../hooks/useTranslation";

export const StudentResultsPage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  
  const params = useParams({ strict: false });
  const studentId = params.studentId;

  useEffect(() => {
    if (studentId) {
      fetchResults();
    }
  }, [studentId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const { data: response } = await axiosClient.get(`/counselor/students/${studentId}/results`);
      setData(response);
    } catch (error: any) {
      message.error(t.counselor.studentResults.errorLoading);
      navigate({ to: "/tests/assign/classrooms" });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const localeMap = { ru: 'ru-RU', kk: 'kk-KZ', en: 'en-US' };
    return new Date(dateString).toLocaleDateString(localeMap[locale] || 'ru-RU');
  };

  const handleResetTestResults = async (testType: string) => {
    try {
      await axiosClient.delete(`/counselor/students/${studentId}/results/${testType}`);
      message.success(t.counselor.studentResults.resetTestSuccess);
      fetchResults(); // Refresh data after reset
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || t.counselor.studentResults.resetTestError;
      message.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Spin size="large" />
        <div className="mt-4 text-gray-500">{t.counselor.studentResults.loadingResults}</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const renderRiasecTab = () => {
    const result = data.tests.riasec;

    if (!result) {
      return (
        <Card>
          <p className="text-gray-500 text-center py-8">{t.counselor.studentResults.notCompleted}</p>
        </Card>
      );
    }

    return (
      <div>
        <Card className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircleOutlined className="text-green-600 text-xl" />
              <span className="text-gray-600">
                {t.counselor.studentResults.completedAt}: {formatDate(result.completed_at)}
              </span>
            </div>
            <Popconfirm
              title={t.counselor.studentResults.resetTestConfirm}
              onConfirm={() => handleResetTestResults('riasec')}
              okText={t.common.yes}
              cancelText={t.common.no}
            >
              <Button danger icon={<DeleteOutlined />} size="small">
                {t.counselor.studentResults.resetTestResults}
              </Button>
            </Popconfirm>
          </div>
        </Card>
        
        <RiasecReport sessionId={result.session_id} />
      </div>
    );
  };

  const renderSoftSkillsTab = () => {
    const result = data.tests.soft_skills;

    if (!result) {
      return (
        <Card>
          <p className="text-gray-500 text-center py-8">{t.counselor.studentResults.notCompleted}</p>
        </Card>
      );
    }

    return (
      <div>
        <Card className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircleOutlined className="text-green-600 text-xl" />
              <span className="text-gray-600">
                {t.counselor.studentResults.completedAt}: {formatDate(result.completed_at)}
              </span>
            </div>
            <Popconfirm
              title={t.counselor.studentResults.resetTestConfirm}
              onConfirm={() => handleResetTestResults('soft_skills')}
              okText={t.common.yes}
              cancelText={t.common.no}
            >
              <Button danger icon={<DeleteOutlined />} size="small">
                {t.counselor.studentResults.resetTestResults}
              </Button>
            </Popconfirm>
          </div>
        </Card>
        
        <SoftSkillReport sessionId={result.session_id} />
      </div>
    );
  };

  const renderHigh5Tab = () => {
    const result = data.tests.high5;

    if (!result) {
      return (
        <Card>
          <p className="text-gray-500 text-center py-8">{t.counselor.studentResults.notCompleted}</p>
        </Card>
      );
    }

    return (
      <div>
        <Card className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircleOutlined className="text-green-600 text-xl" />
              <span className="text-gray-600">
                {t.counselor.studentResults.completedAt}: {formatDate(result.completed_at)}
              </span>
            </div>
            <Popconfirm
              title={t.counselor.studentResults.resetTestConfirm}
              onConfirm={() => handleResetTestResults('high5')}
              okText={t.common.yes}
              cancelText={t.common.no}
            >
              <Button danger icon={<DeleteOutlined />} size="small">
                {t.counselor.studentResults.resetTestResults}
              </Button>
            </Popconfirm>
          </div>
        </Card>
        
        <High5Report sessionId={result.session_id} />
      </div>
    );
  };

  const renderQuestionnaireTab = () => {
    const result = data.tests.questionnaire;

    if (!result) {
      return (
        <Card>
          <p className="text-gray-500 text-center py-8">{t.counselor.studentResults.notCompleted}</p>
        </Card>
      );
    }

    return (
      <div>
        <Card className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircleOutlined className="text-green-600 text-xl" />
              <span className="text-gray-600">
                {t.counselor.studentResults.completedAt}: {formatDate(result.completed_at)}
              </span>
            </div>
            <Popconfirm
              title={t.counselor.studentResults.resetTestConfirm}
              onConfirm={() => handleResetTestResults('questionnaire')}
              okText={t.common.yes}
              cancelText={t.common.no}
            >
              <Button danger icon={<DeleteOutlined />} size="small">
                {t.counselor.studentResults.resetTestResults}
              </Button>
            </Popconfirm>
          </div>
        </Card>
        
        <QuestionnaireReport sessionId={result.session_id} />
      </div>
    );
  };

  const completedCount = [
    data.tests.riasec,
    data.tests.soft_skills,
    data.tests.high5,
    data.tests.questionnaire,
  ].filter(Boolean).length;

  const tabItems = [
    {
      key: "riasec",
      label: (
        <span>
          RIASEC {data.tests.riasec && <CheckCircleOutlined className="text-green-600 ml-2" />}
        </span>
      ),
      children: renderRiasecTab(),
    },
    {
      key: "soft-skills",
      label: (
        <span>
          Soft Skills {data.tests.soft_skills && <CheckCircleOutlined className="text-green-600 ml-2" />}
        </span>
      ),
      children: renderSoftSkillsTab(),
    },
    {
      key: "high5",
      label: (
        <span>
          High5 {data.tests.high5 && <CheckCircleOutlined className="text-green-600 ml-2" />}
        </span>
      ),
      children: renderHigh5Tab(),
    },
    {
      key: "questionnaire",
      label: (
        <span>
          {t.common.questionnaire} {data.tests.questionnaire && <CheckCircleOutlined className="text-green-600 ml-2" />}
        </span>
      ),
      children: renderQuestionnaireTab(),
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card className="mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => window.history.back()}
          className="mb-4"
        >
          {t.common.backToList}
        </Button>

        <Breadcrumb
          routes={[
            { name: t.nav.assignTests, href: "/tests/assign/classrooms" },
            { name: data.student.name },
          ]}
        />
        
        <div className="mt-4">
          <h1 className="text-3xl font-bold">{data.student.name}</h1>
          <p className="text-gray-600 mt-1">{data.student.email}</p>
          {data.student.classroom && (
            <p className="text-gray-600">
              {t.common.classroom}: {data.student.classroom.name}
            </p>
          )}
        </div>
      </Card>

      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{t.counselor.studentResults.testProgress}</h3>
            <p className="text-gray-600">
              {t.common.completed} {completedCount} / 4
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-blue-600">
              {completedCount}/4
            </div>
            {completedCount === 4 && (
              <Button
                type="primary"
                icon={<FileTextOutlined />}
                onClick={() => navigate({ to: `/counselor/career/students/${studentId}` })}
              >
                {t.counselor.studentResults.careerGuidance || 'Профориентация'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
};

