import { TestCard } from '../../components/TestCard';
import './CounselorTestsPage.css';
import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { App, Button, Spin } from 'antd';
import { useNavigate } from '@tanstack/react-router';
import { RobotOutlined } from '@ant-design/icons';
import { useTranslation } from '../../hooks/useTranslation';

interface TestData {
  id: number;
  type: string;
  title: string;
  description: string;
  image: string;
  completed_count: number;
  total_count: number;
  completion_rate: number;
}

export const CounselorTestsPage = () => {
  const [testsData, setTestsData] = useState<TestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { message } = App.useApp();
  const [startingBulk, setStartingBulk] = useState(false);

  // Получить переведённое название и описание теста по типу
  const getTestTranslation = (testType: string) => {
    const tests = t.counselor.testsPage.tests as Record<string, { title: string; description: string }>;
    return tests[testType] || { title: testType, description: '' };
  };

  useEffect(() => {
    const fetchTestsStatistics = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get('/counselor/tests/statistics');
        setTestsData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching tests statistics:', err);
        setError(t.counselor.testsPage.loadingError);
      } finally {
        setLoading(false);
      }
    };

    fetchTestsStatistics();
  }, [t]);

  const handleTestClick = () => {
    navigate({ to: '/tests/assign/classrooms' });
  };

  const startBulkAiReports = async () => {
    setStartingBulk(true);
    try {
      // For now assume counselor is linked to exactly one school.
      const { data } = await axiosClient.get('/counselor/my-schools?limit=1');
      const schoolId = data?.items?.[0]?.id;
      if (!schoolId) {
        message.error('School not found');
        return;
      }

      const res = await axiosClient.post(`/counselor/career/schools/${schoolId}/bulk-generate`);
      const jobId = res.data?.job_id || res.data?.jobId;
      if (jobId) {
        navigate({ to: `/counselor/career/bulk-jobs/${jobId}` });
      }
    } catch (error: any) {
      const jobId = error?.response?.data?.job_id;
      if (jobId) {
        navigate({ to: `/counselor/career/bulk-jobs/${jobId}` });
        return;
      }
      message.error(error?.response?.data?.message || 'Ошибка запуска массовой генерации');
    } finally {
      setStartingBulk(false);
    }
  };

  if (loading) {
    return (
      <div className="counselor-tests-page">
        <div className="page-header">
          <div className="breadcrumb">
            <span className="breadcrumb-item current">{t.counselor.testsPage.title}</span>
          </div>
          <div className="page-title-wrapper">
            <h1 className="page-title">{t.counselor.testsPage.title}</h1>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="counselor-tests-page">
        <div className="page-header">
          <div className="breadcrumb">
            <span className="breadcrumb-item current">{t.counselor.testsPage.title}</span>
          </div>
          <div className="page-title-wrapper">
            <h1 className="page-title">{t.counselor.testsPage.title}</h1>
          </div>
        </div>
        <div style={{ padding: '24px', textAlign: 'center', color: '#ff4d4f' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="counselor-tests-page">
      <div className="page-header">
        <div className="breadcrumb">
          <span className="breadcrumb-item current">{t.counselor.testsPage.title}</span>
        </div>
        <div className="page-title-wrapper">
          <h1 className="page-title">{t.counselor.testsPage.title}</h1>
          <div style={{ marginTop: 12 }}>
            <Button icon={<RobotOutlined />} onClick={startBulkAiReports} loading={startingBulk}>
              {t.counselor.testsPage.bulkGenerateReports}
            </Button>
          </div>
        </div>
      </div>

      <div className="tests-grid">
        {testsData.map((test) => {
          const translation = getTestTranslation(test.type);
          return (
            <TestCard
              key={test.id}
              title={translation.title}
              description={translation.description}
              image={test.image}
              completionRate={test.completion_rate}
              completedCount={test.completed_count}
              totalCount={test.total_count}
              onTitleClick={handleTestClick}
            />
          );
        })}
      </div>
    </div>
  );
};

