import { useEffect, useState, useMemo, useRef } from "react";
import { Spin, App } from "antd";
import { useNavigate, useParams, Link } from "@tanstack/react-router";
import axiosClient from "../../../api/axiosClient";
import { QuestionOrder } from "../../../components/quiz-widgets/QuestionOrder/QuestionOrder";
import { TestProgressBar } from "../../../components/quiz-widgets/TestProgressBar";
import { TestNavigation } from "../../../components/quiz-widgets/TestNavigation";
import { useTranslation } from "../../../hooks/useTranslation";
import '../../counselor/CounselorTestsPage.css';
import "./SoftSkillsTestPage.css";

interface MultilingualText {
  ru: string;
  kk: string;
  en: string;
}

interface CurrentCase {
  case_id: string;
  stem: MultilingualText;
  options: Array<{
    option_id: string;
    label: MultilingualText;
    soft_skill: string;
  }>;
  block_id: string;
  block_picture: string | null;
  block_title: MultilingualText;
  block_description: MultilingualText;
}

interface SessionInfo {
  total_cases: number;
  answered_cases: number;
  current_case_number: number;
  progress_percent: number;
}

export const SoftSkillsTestPage = () => {
  const { id } = useParams({ strict: false });
  const { t, locale } = useTranslation();
  const [session, setSession] = useState<any>(null);
  const [currentCase, setCurrentCase] = useState<CurrentCase | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answer, setAnswer] = useState<string[]>([]);
  const [caseStartTime, setCaseStartTime] = useState<number>(Date.now());
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const topRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ block: 'start' });
  };

  useEffect(() => {
    if (id) {
      initSession();
    }
  }, [id]);

  const initSession = async () => {
    try {
      setLoading(true);
      
      const { data: sessionData } = await axiosClient.post("/student/soft-skills/sessions", {
        assignment_id: id,
        locale: locale,
      });
      
      setSession(sessionData.session);
      await loadCurrentCase(sessionData.session.id);
    } catch (error: any) {
      // Если тест уже пройден - редирект на результаты
      if (error?.response?.status === 409 && error?.response?.data?.status === 'completed') {
        const sessionId = error.response.data.session_id;
        message.info(t.tests.testAlreadyCompleted || 'Тест уже пройден');
        navigate({ to: `/student/tests/soft-skills/result/${sessionId}` });
        return;
      }
      message.error(error?.response?.data?.error || t.testPage.errorCreatingSession);
      navigate({ to: "/student/tests" });
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentCase = async (sessionId: string) => {
    try {
      const { data } = await axiosClient.get(`/student/soft-skills/sessions/${sessionId}/cases/next`);
      
      if (data.case_id) {
        setCurrentCase({
          case_id: String(data.case_id),
          stem: data.stem,
          options: data.options,
          block_id: String(data.block_id),
          block_picture: data.block_picture || null,
          block_title: data.block_title,
          block_description: data.block_description,
        });
        setSessionInfo(data.session_info);
        
        // Загружаем сохраненный ответ если есть
        if (data.saved_answer) {
          const mostId = data.saved_answer.most_option_id;
          const leastId = data.saved_answer.least_option_id;
          const middleOptions = data.options
            .map((opt: any) => opt.option_id)
            .filter((id: string) => id !== mostId && id !== leastId);
          
          setAnswer([mostId, ...middleOptions, leastId]);
        } else {
          // Начальный порядок
          setAnswer(data.options.map((opt: any) => opt.option_id));
        }
        
        setCaseStartTime(Date.now());
      }
    } catch (error: any) {
      if (error?.response?.status === 409 || 
          error?.response?.data?.error === 'All cases have been answered' ||
          (error?.response?.status === 400 && error?.response?.data?.status === 'completed')) {
        message.success(t.tests.testCompleted);
        navigate({ to: `/student/tests/soft-skills/result/${sessionId}` });
      } else if (error?.response?.status === 400 && error?.response?.data?.error === 'Session cannot be continued') {
        message.info(t.testPage.errorCreatingSession);
        navigate({ to: "/student/tests" });
      } else {
        message.error(error?.response?.data?.error || t.testPage.errorLoading);
        navigate({ to: "/student/tests" });
      }
    }
  };

  const handleAnswerChange = (orderedOptions: any[]) => {
    setAnswer(orderedOptions.map(opt => opt.option_id));
  };

  const handleSaveAndNavigate = async (direction: 'next' | 'previous') => {
    if (!session || !currentCase) return;

    if (direction === 'next' && answer.length !== currentCase.options.length) {
      message.warning(t.riasec.selectMostAndLeast);
      return;
    }

    setSubmitting(true);

    const caseEndTime = Date.now();
    const latencyMs = caseEndTime - caseStartTime;

    // 1. Сохраняем ответ ТОЛЬКО при переходе вперед
    if (direction === 'next' && answer.length === currentCase.options.length) {
      try {
        await axiosClient.post(`/student/soft-skills/sessions/${session.id}/answers`, {
          block_id: String(currentCase.block_id),
          case_id: String(currentCase.case_id),
          most_option_id: answer[0],
          least_option_id: answer[answer.length - 1],
          timestamp_client: new Date().toISOString(),
          latency_ms: latencyMs,
        });
      } catch (error: any) {
        setSubmitting(false);
        if (error?.response?.status === 409 || 
            error?.response?.data?.error === 'All cases have been answered' ||
            (error?.response?.status === 400 && error?.response?.data?.status === 'completed')) {
          message.success(t.tests.testCompleted);
          navigate({ to: `/student/tests/soft-skills/result/${session.id}` });
        } else {
          message.error(error?.response?.data?.error || t.testPage.errorSaving);
        }
        return;
      }
    }

    // 2. Загружаем следующий/предыдущий кейс (отдельный try/catch)
    try {
      let endpoint = '';
      if (direction === 'next') {
        endpoint = `/student/soft-skills/sessions/${session.id}/cases/next?current_case_id=${currentCase.case_id}&current_block_id=${currentCase.block_id}`;
      } else {
        endpoint = `/student/soft-skills/sessions/${session.id}/cases/previous?current_case_id=${currentCase.case_id}&current_block_id=${currentCase.block_id}`;
      }

      const { data } = await axiosClient.get(endpoint);

      if (data.case_id) {
        setCurrentCase({
          case_id: String(data.case_id),
          stem: data.stem,
          options: data.options,
          block_id: String(data.block_id),
          block_picture: data.block_picture || null,
          block_title: data.block_title,
          block_description: data.block_description,
        });
        setSessionInfo(data.session_info);
        
        if (data.saved_answer) {
          const mostId = data.saved_answer.most_option_id;
          const leastId = data.saved_answer.least_option_id;
          const middleOptions = data.options
            .map((opt: any) => opt.option_id)
            .filter((id: string) => id !== mostId && id !== leastId);
          
          setAnswer([mostId, ...middleOptions, leastId]);
        } else {
          setAnswer(data.options.map((opt: any) => opt.option_id));
        }
        
        setCaseStartTime(Date.now());
        message.success(direction === 'next' ? t.testPage.answersSaved : t.testPage.returnToPrevious);
        scrollToTop();
      }
    } catch (error: any) {
      if (error?.response?.status === 409 || 
          error?.response?.data?.error === 'All cases have been answered' ||
          (error?.response?.status === 400 && error?.response?.data?.status === 'completed')) {
        message.success(t.tests.testCompleted);
        navigate({ to: `/student/tests/soft-skills/result/${session.id}` });
      } else {
        message.error(error?.response?.data?.error || t.testPage.errorLoading);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreviousCase = () => {
    handleSaveAndNavigate('previous');
  };

  const handleNextCase = () => {
    handleSaveAndNavigate('next');
  };

  // Helper function для получения текста с fallback
  const getLocalizedText = (textObj: MultilingualText | string | undefined): string => {
    if (!textObj) return '';
    if (typeof textObj === 'string') return textObj;
    return textObj[locale as keyof MultilingualText] || textObj.ru || textObj.kk || textObj.en || '';
  };

  const questionOptions = useMemo(() => {
    if (!currentCase) return [];
    
    // Используем текущий порядок из answer state
    if (answer.length === currentCase.options.length) {
      return answer.map(optionId => {
        const option = currentCase.options.find(opt => opt.option_id === optionId);
        return option ? { 
          ...option, 
          value: option.option_id,
          label: getLocalizedText(option.label)
        } : null;
      }).filter(Boolean) as Array<{ option_id: string; label: string; soft_skill: string; value: string }>;
    }
    
    // Начальный порядок
    return currentCase.options.map(opt => ({
      ...opt,
      value: opt.option_id,
      label: getLocalizedText(opt.label)
    }));
  }, [currentCase?.case_id, answer, locale]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip={t.common.loading}>
          <div style={{ padding: '50px' }} />
        </Spin>
      </div>
    );
  }

  if (!session || !currentCase || !sessionInfo) {
    return null;
  }

  const allAnswered = answer.length === currentCase.options.length;

  return (
    <div className="counselor-tests-page" ref={topRef}>
      <div className="page-header">
        <div className="breadcrumb">
          <span className="breadcrumb-item"><Link to="/student/tests">{t.nav.tests}</Link></span>
          <span className="breadcrumb-item"> / </span>
          <span className="breadcrumb-item current">{t.tests.softSkills}</span>
        </div>
        <div className="page-title-wrapper">
          <h1 className="page-title">{t.tests.softSkills}</h1>
        </div>
      </div>

      <div className="px-6 pb-6">
        {/* Основной контейнер с тестом */}
        <div className="ant-card ant-card-bordered soft-skills-content">
          <div className="ant-card-body">
            {/* Заголовок блока */}
            <h1 className="soft-skills-title">{getLocalizedText(currentCase.block_title)}</h1>

            {/* Картинка блока */}
            {currentCase.block_picture && (
              <div className="soft-skills-block-image">
                <img 
                  src={`${import.meta.env.BASE_URL}test-images/${currentCase.block_picture}`} 
                  alt={getLocalizedText(currentCase.block_title)}
                />
              </div>
            )}

            {/* Описание блока */}
            {currentCase.block_description && (
              <div className={`soft-skills-block-description ${isDescriptionExpanded ? 'expanded' : 'collapsed'}`}>
                <p className="soft-skills-block-description-text">{getLocalizedText(currentCase.block_description)}</p>
                <button 
                  className="soft-skills-block-description-toggle"
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                >
                  {isDescriptionExpanded ? t.common.collapse : t.common.expand}
                  <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 12 12" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className={isDescriptionExpanded ? 'rotated' : ''}
                  >
                    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}

            {/* Подзаголовок (вопрос) */}
            <h2 className="soft-skills-subtitle">{getLocalizedText(currentCase.stem)}</h2>

            {/* Инструкция */}
            <div className="soft-skills-instruction">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="7" cy="7" r="6.5" stroke="#0088FF" />
                <path d="M7 3.5V7M7 10.5H7.01" stroke="#0088FF" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>{t.riasec.instruction}</span>
            </div>

            {/* Варианты для упорядочивания */}
            <QuestionOrder 
              key={currentCase.case_id}
              options={questionOptions}
              onChange={handleAnswerChange}
            />

            {/* Навигационные кнопки */}
            <TestNavigation
              onPrevious={handlePreviousCase}
              onNext={handleNextCase}
              canGoPrevious={sessionInfo.current_case_number > 1}
              canGoNext={allAnswered}
              loading={submitting}
            />

            {/* Прогресс-бар внизу */}
            <TestProgressBar 
              currentQuestion={sessionInfo.current_case_number}
              totalQuestions={sessionInfo.total_cases}
              answeredQuestions={sessionInfo.answered_cases}
              progressPercent={sessionInfo.progress_percent}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
