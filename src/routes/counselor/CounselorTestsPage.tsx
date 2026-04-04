import { TestCard } from '../../components/TestCard';
import './CounselorTestsPage.css';
import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Button, Spin, App } from 'antd';
import { useNavigate } from '@tanstack/react-router';
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
  const [startingBulk, setStartingBulk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { message } = App.useApp();

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
      // We reuse existing endpoint that returns counselor schools (used in SchoolReportPage)
      const { data: available } = await axiosClient.get('/counselor/reports/available');
      const schools = (available?.schools || []) as Array<{ id: number; name: string }>;

      const schoolId = schools?.[0]?.id;
      if (!schoolId) {
        message.warning(t.counselor.testsPage.selectSchoolFirst);
        return;
      }

      const { data } = await axiosClient.post(`/counselor/career/schools/${schoolId}/bulk-generate`);
      const jobId = data.job_id as string | undefined;
      if (jobId) {
        navigate({ to: `/counselor/career/bulk-jobs/${jobId}` });
      }
    } catch (error: unknown) {
      const e = error as { response?: { data?: { job_id?: string; message?: string } } };
      const jobId = e.response?.data?.job_id;
      if (jobId) {
        navigate({ to: `/counselor/career/bulk-jobs/${jobId}` });
        return;
      }

      message.error(e.response?.data?.message || t.counselor.testsPage.bulkStartError);
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
        <div className="page-title-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h1 className="page-title">{t.counselor.testsPage.title}</h1>

          <Button onClick={startBulkAiReports} loading={startingBulk}>
            {t.counselor.testsPage.bulkGenerateAiReports}
          </Button>
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

