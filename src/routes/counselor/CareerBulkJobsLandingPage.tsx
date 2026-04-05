import { useEffect, useState } from 'react';
import { App, Button, Card, Spin } from 'antd';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeftOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';
import Breadcrumb from '../../components/Breadcrumb';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * Landing page for bulk jobs.
 * Starts (or reuses) active bulk job for the counselor's school and redirects to /bulk-jobs/:jobId.
 */
export const CareerBulkJobsLandingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [starting, setStarting] = useState(true);

  const startOrReuse = async () => {
    setStarting(true);
    try {
      const { data: available } = await axiosClient.get('/counselor/reports/available');
      const schools = (available?.schools || []) as Array<{ id: number; name: string }>;
      const schoolId = schools?.[0]?.id;

      if (!schoolId) {
        message.warning(t.careerBulkJobsLanding.selectSchoolFirst);
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

      message.error(e.response?.data?.message || t.careerBulkJobsLanding.startError);
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    startOrReuse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Card className="mb-4">
        <Breadcrumb routes={[{ name: t.careerBulkJobsLanding.title }]} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 12 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate({ to: '/counselor/tests' })}>
            {t.common.back}
          </Button>

          <Button onClick={startOrReuse} loading={starting}>
            {t.careerBulkJobsLanding.retry}
          </Button>
        </div>

        <h1 className="text-2xl font-bold" style={{ marginTop: 16 }}>
          {t.careerBulkJobsLanding.title}
        </h1>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Spin spinning={starting} />
          <div style={{ color: 'rgba(0,0,0,0.65)' }}>{t.careerBulkJobsLanding.starting}</div>
        </div>
      </Card>
    </div>
  );
};
