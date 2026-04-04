import { useEffect, useMemo, useRef, useState } from 'react';
import { App, Button, Card, Descriptions, List, Spin, Tag } from 'antd';
import axiosClient from '../../api/axiosClient';
import Breadcrumb from '../../components/Breadcrumb';
import { useTranslation } from '../../hooks/useTranslation';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeftOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons';

type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'canceled';

interface BulkJobResponse {
  job: {
    id: string;
    status: JobStatus;
    total: number;
    processed: number;
    success: number;
    skipped: number;
    failed: number;
    started_at?: string;
    finished_at?: string;
    school: {
      id: number;
      name: string;
    };
  };
  items: Array<{
    id: number;
    student_id: number;
    student_name?: string;
    status: 'queued' | 'processing' | 'done' | 'skipped' | 'failed';
    error?: string | null;
    updated_at: string;
  }>;
}

const statusColor = (status: JobStatus) => {
  switch (status) {
    case 'queued':
      return 'default';
    case 'running':
      return 'processing';
    case 'completed':
      return 'success';
    case 'failed':
      return 'error';
    case 'canceled':
      return 'warning';
    default:
      return 'default';
  }
};

export const CareerBulkJobPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const jobId = (params as any).jobId as string;

  const { message } = App.useApp();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [data, setData] = useState<BulkJobResponse | null>(null);

  const pollTimer = useRef<number | null>(null);

  const canCancel = useMemo(() => {
    const st = data?.job.status;
    return st === 'queued' || st === 'running';
  }, [data?.job.status]);

  const shouldPoll = useMemo(() => {
    const st = data?.job.status;
    return st === 'queued' || st === 'running';
  }, [data?.job.status]);

  const fetchStatus = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setRefreshing(true);
    try {
      const res = await axiosClient.get(`/counselor/career/bulk-jobs/${jobId}`);
      setData(res.data);
    } catch (err: any) {
      message.error(err.response?.data?.message || t.careerBulkJobPage.loadError);
    } finally {
      if (!opts?.silent) setRefreshing(false);
      setLoading(false);
    }
  };

  const cancelJob = async () => {
    setCanceling(true);
    try {
      await axiosClient.post(`/counselor/career/bulk-jobs/${jobId}/cancel`);
      message.success(t.careerBulkJobPage.canceled);
      await fetchStatus({ silent: true });
    } catch (err: any) {
      message.error(err.response?.data?.message || t.careerBulkJobPage.cancelError);
    } finally {
      setCanceling(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  useEffect(() => {
    // polling
    if (pollTimer.current) {
      window.clearInterval(pollTimer.current);
      pollTimer.current = null;
    }

    if (shouldPoll) {
      pollTimer.current = window.setInterval(() => {
        fetchStatus({ silent: true });
      }, 2500);
    }

    return () => {
      if (pollTimer.current) {
        window.clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldPoll, jobId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  const job = data?.job;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Card className="mb-4">
        <Breadcrumb routes={[{ name: t.nav.schoolReports }, { name: t.careerBulkJobPage.title }]} />

        <div className="flex items-center justify-between gap-4" style={{ marginTop: 12 }}>
          <div>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate({ to: '/counselor/reports/school' })}>
              {t.common.back}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button icon={<ReloadOutlined />} onClick={() => fetchStatus()} loading={refreshing}>
              {t.careerBulkJobPage.refresh}
            </Button>
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={cancelJob}
              disabled={!canCancel}
              loading={canceling}
            >
              {t.careerBulkJobPage.cancel}
            </Button>
          </div>
        </div>

        <h1 className="text-2xl font-bold" style={{ marginTop: 16 }}>
          {t.careerBulkJobPage.title}
        </h1>
      </Card>

      {job && (
        <Card className="mb-4">
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label={t.careerBulkJobPage.school}>{job.school.name}</Descriptions.Item>
            <Descriptions.Item label={t.careerBulkJobPage.status}>
              <Tag color={statusColor(job.status)}>{job.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t.careerBulkJobPage.progress}>
              {job.processed} / {job.total}
            </Descriptions.Item>
            <Descriptions.Item label={t.careerBulkJobPage.counters}>
              {t.careerBulkJobPage.success}: {job.success} · {t.careerBulkJobPage.skipped}: {job.skipped} · {t.careerBulkJobPage.failed}: {job.failed}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card>
        <h3 className="text-lg font-semibold" style={{ marginBottom: 12 }}>
          {t.careerBulkJobPage.latestItems}
        </h3>

        <List
          dataSource={data?.items || []}
          locale={{ emptyText: t.careerBulkJobPage.noItems }}
          renderItem={(it) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span>
                      #{it.student_id} {it.student_name ? `— ${it.student_name}` : ''}
                    </span>
                    <Tag>{it.status}</Tag>
                  </div>
                }
                description={it.error ? `${t.careerBulkJobPage.error}: ${it.error}` : undefined}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};
