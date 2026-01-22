import { useEffect, useState } from "react";
import { Spin, App } from "antd";
import axiosClient from "../../api/axiosClient";
import { TestCard } from "../../components/TestCard";
import { useNavigate, Link } from "@tanstack/react-router";
import { useTranslation } from "../../hooks/useTranslation";
import '../counselor/CounselorTestsPage.css';

interface Test {
  id: string;
  name: {
    ru: string;
    kk: string;
    en: string;
  };
  description: {
    ru: string;
    kk: string;
    en: string;
  };
  type: string;
  is_locked: boolean;
  is_assigned: boolean;
  status: "not_started" | "in_progress" | "completed";
  progress: number;
  session_id: number | null;
  assignment_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  answered_count?: number;
  total_questions?: number;
}

// Маппинг типов тестов на изображения
const testImages: Record<string, string> = {
  'high5': '/test-images/gallup.png',
  'soft-skills': '/test-images/soft-skills.png',
  'riasec': '/test-images/holland.png',
  'questionnaire': '/test-images/questionnaire.png',
};

// Маппинг типов тестов на URL
const testUrls: Record<string, string> = {
  'high5': '/student/tests/high5',
  'soft-skills': '/student/tests/soft-skills',
  'riasec': '/student/tests/riasec',
  'questionnaire': '/student/tests/questionnaire',
};

export const MyTestsPage = () => {
  const { t, locale } = useTranslation();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get("/student/tests");
      setTests(data.tests || []);
    } catch (error: any) {
      message.error(t.testPage.errorLoading);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestClick = (test: Test) => {
    if (test.is_locked) {
      message.warning(t.tests.testLocked || 'Тест недоступен');
      return;
    }

    const baseUrl = testUrls[test.id];
    if (!baseUrl) {
      message.error(t.common.error);
      return;
    }

    // Если есть активная сессия, продолжаем её
    if (test.session_id && test.status === 'in_progress') {
      navigate({ to: `${baseUrl}/${test.session_id}` });
    } else if (test.status === 'completed') {
      // Если завершен, показываем результат
      navigate({ to: `${baseUrl}/result/${test.session_id}` });
    } else {
      // Начинаем новый тест
      // Если assignment_id есть, передаем его, иначе используем placeholder
      const assignmentOrPlaceholder = test.assignment_id || 'new';
      navigate({ to: `${baseUrl}/${assignmentOrPlaceholder}` });
    }
  };

  // Получаем текст на нужном языке
  const getLocalizedText = (textObj: { ru: string; kk: string; en: string }) => {
    return textObj[locale] || textObj.ru;
  };

  if (loading) {
    return (
      <div className="counselor-tests-page">
        <div className="page-header">
          <div className="breadcrumb">
            <span className="breadcrumb-item current">{t.nav.tests}</span>
          </div>
          <div className="page-title-wrapper">
            <h1 className="page-title">{t.nav.tests}</h1>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="counselor-tests-page">
      <div className="page-header">
        <div className="breadcrumb">
          <span className="breadcrumb-item current">{t.nav.tests}</span>
        </div>
        <div className="page-title-wrapper">
          <h1 className="page-title">{t.nav.tests}</h1>
        </div>
      </div>

      <div className="tests-grid">
        {tests.map((test) => (
          <TestCard
            key={test.id}
            title={getLocalizedText(test.name)}
            description={getLocalizedText(test.description)}
            image={testImages[test.id] || '/test-images/gallup.png'}
            progress={test.progress}
            answeredCount={test.answered_count}
            totalQuestions={test.total_questions}
            isLocked={test.is_locked}
            status={test.status}
            onTitleClick={() => handleTestClick(test)}
          />
        ))}
      </div>

      {tests.length === 0 && (
        <div style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
          <p style={{ fontSize: '18px', marginBottom: '8px' }}>{t.tests.noTestsAvailable || 'Тесты пока не доступны'}</p>
          <p style={{ fontSize: '14px' }}>
            {t.tests.contactCounselor || 'Обратитесь к профориентатору для назначения тестов'}
          </p>
        </div>
      )}
    </div>
  );
};

