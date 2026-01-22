import { useEffect, useState, useRef } from "react";
import { Spin, App } from "antd";
import { useNavigate, useParams, Link } from "@tanstack/react-router";
import axiosClient from "../../../api/axiosClient";
import { QuestionScale } from "../../../components/quiz-widgets/QuestionScale/QuestionScale";
import { TestNavigation } from "../../../components/quiz-widgets/TestNavigation";
import { TestProgressBar } from "../../../components/quiz-widgets/TestProgressBar";
import { useTranslation } from "../../../hooks/useTranslation";
import '../../counselor/CounselorTestsPage.css';
import "./High5TestPage.css";

interface Item {
  item_id: string;
  item_index: number;
  text: {
    ru: string;
    kk: string;
    en: string;
  };
  saved_answer?: {
    value: number;
  };
}

interface SessionInfo {
  total_items: number;
  answered_items: number;
  current_item_number: number;
  progress_percent: number;
}

export const High5TestPage = () => {
  const { id } = useParams({ strict: false });
  const { t, locale } = useTranslation();
  const [session, setSession] = useState<any>(null);
  const [currentItems, setCurrentItems] = useState<Item[]>([]);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [blockStartTime, setBlockStartTime] = useState<number>(Date.now());
  const [currentBatchStartIndex, setCurrentBatchStartIndex] = useState<number>(0);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const topRef = useRef<HTMLDivElement>(null);

  const BATCH_SIZE = 5;

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
      
      const { data: sessionData } = await axiosClient.post("/student/high5/sessions", {
        assignment_id: id,
        locale: locale,
      });
      
      setSession(sessionData.session);
      await loadNextBlock(sessionData.session);
    } catch (error: any) {
      // Если тест уже пройден - редирект на результаты
      if (error?.response?.status === 409 && error?.response?.data?.status === 'completed') {
        const sessionId = error.response.data.session_id;
        message.info(t.tests.testAlreadyCompleted || 'Тест уже пройден');
        navigate({ to: `/student/tests/high5/result/${sessionId}` });
        return;
      }
      message.error(error?.response?.data?.error || t.testPage.errorCreatingSession);
      navigate({ to: "/student/tests" });
    } finally {
      setLoading(false);
    }
  };

  const loadNextBlock = async (sessionData?: any, fromCurrentIndex?: number) => {
    const currentSession = sessionData || session;
    if (!currentSession) return;
    
    try {
      // Загружаем пачку из 5 вопросов через batch endpoint
      // Если передан fromCurrentIndex, загружаем батч после него (+BATCH_SIZE)
      let url = `/student/high5/sessions/${currentSession.id}/items/next-batch?count=${BATCH_SIZE}`;
      if (fromCurrentIndex !== undefined) {
        url += `&current_index=${fromCurrentIndex}`;
      }
      const { data } = await axiosClient.get(url);
      
      if (data.items && data.items.length > 0) {
        setCurrentItems(data.items);
        setCurrentBatchStartIndex(data.session_info.current_item_number - 1);
        
        // Загружаем сохраненные ответы
        const savedAnswersObj: Record<string, number> = {};
        data.items.forEach((item: Item) => {
          if (item.saved_answer) {
            savedAnswersObj[item.item_id] = item.saved_answer.value;
          }
        });
        setAnswers(savedAnswersObj);
        
        setBlockStartTime(Date.now());
        if (data.session_info) {
          setSessionInfo(data.session_info);
        }
        
        scrollToTop();
      } else {
        // Нет больше вопросов
        message.success(t.tests.testCompleted);
        navigate({ to: `/student/tests/high5/result/${currentSession.id}` });
      }
    } catch (error: any) {
      if (error?.response?.status === 409 || 
          (error?.response?.status === 400 && error?.response?.data?.status === 'completed')) {
        message.success(t.tests.testCompleted);
        navigate({ to: `/student/tests/high5/result/${currentSession.id}` });
      } else if (error?.response?.data?.error === 'All items have been answered') {
        message.success(t.tests.testCompleted);
        navigate({ to: `/student/tests/high5/result/${currentSession.id}` });
      } else {
        message.error(error?.response?.data?.error || t.testPage.errorLoading);
      }
    }
  };

  const loadPreviousBlock = async () => {
    if (!session) return;
    
    try {
      setSubmitting(true);

      // Загружаем предыдущую пачку без сохранения текущих ответов
      const { data } = await axiosClient.get(
        `/student/high5/sessions/${session.id}/items/previous-batch?count=${BATCH_SIZE}&current_index=${currentBatchStartIndex}`
      );
      
      if (data.items && data.items.length > 0) {
        setCurrentItems(data.items);
        setCurrentBatchStartIndex(data.session_info.current_item_number - 1);
        
        // Загружаем сохраненные ответы
        const savedAnswersObj: Record<string, number> = {};
        data.items.forEach((item: Item) => {
          if (item.saved_answer) {
            savedAnswersObj[item.item_id] = item.saved_answer.value;
          }
        });
        setAnswers(savedAnswersObj);
        
        setBlockStartTime(Date.now());
        if (data.session_info) {
          setSessionInfo(data.session_info);
        }
        message.success(t.testPage.returnToPrevious);
        scrollToTop();
      }
    } catch (error: any) {
      message.error(error?.response?.data?.error || t.testPage.errorGoingBack);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextBlock = async () => {
    // Проверяем что все вопросы отвечены
    const unansweredItems = currentItems.filter(item => !answers[item.item_id]);
    if (unansweredItems.length > 0) {
      message.warning(t.testPage.answerAllQuestions);
      return;
    }
    if (!session || currentItems.length === 0) return;

    try {
      setSubmitting(true);

      const blockEndTime = Date.now();
      const averageLatencyMs = Math.round((blockEndTime - blockStartTime) / currentItems.length);

      // Формируем массив ответов
      const answersArray = currentItems.map(item => ({
        item_id: item.item_id,
        value: answers[item.item_id],
        timestamp_client: new Date().toISOString(),
        latency_ms: averageLatencyMs,
      }));

      // Отправляем все ответы одним запросом
      const { data } = await axiosClient.post(`/student/high5/sessions/${session.id}/answers/batch`, {
        answers: answersArray
      });

      // Проверяем статус
      if (data.status === 'completed') {
        message.success(t.tests.testCompleted);
        navigate({ to: `/student/tests/high5/result/${session.id}` });
        return;
      }

      message.success(t.testPage.answersSaved);
      await loadNextBlock(undefined, currentBatchStartIndex);
    } catch (error: any) {
      if (error?.response?.status === 409 || 
          (error?.response?.status === 400 && error?.response?.data?.status === 'completed')) {
        message.success(t.tests.testCompleted);
        navigate({ to: `/student/tests/high5/result/${session.id}` });
      } else {
        message.error(error?.response?.data?.error || t.testPage.errorSaving);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreviousBlock = () => {
    loadPreviousBlock();
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip={t.common.loading}>
          <div style={{ padding: '50px' }} />
        </Spin>
      </div>
    );
  }

  if (!session || currentItems.length === 0 || !sessionInfo) {
    return null;
  }

  const likertOptions = [
    { value: 1, label: t.likert.stronglyDisagree },
    { value: 2, label: t.likert.disagree },
    { value: 3, label: t.likert.neutral },
    { value: 4, label: t.likert.agree },
    { value: 5, label: t.likert.stronglyAgree },
  ];

  const handleScaleChange = (itemId: string, index: number) => {
    setAnswers(prev => ({
      ...prev,
      [itemId]: likertOptions[index].value
    }));
  };

  const allAnswered = currentItems.every(item => answers[item.item_id] !== undefined);

  return (
    <div className="counselor-tests-page" ref={topRef}>
      <div className="page-header">
        <div className="breadcrumb">
          <span className="breadcrumb-item"><Link to="/student/tests">{t.nav.tests}</Link></span>
          <span className="breadcrumb-item"> / </span>
          <span className="breadcrumb-item current">{t.tests.high5}</span>
        </div>
        <div className="page-title-wrapper">
          <h1 className="page-title">{t.tests.high5}</h1>
        </div>
      </div>

      <div className="px-6 pb-6">
        {/* Основной контейнер с тестом */}
        <div className="ant-card ant-card-bordered high5-content">
          <div className="ant-card-body">
            {/* Заголовок */}
            <h1 className="high5-title">{t.tests.high5}</h1>

            {/* Инструкция */}
            <div className="high5-instruction">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="7" cy="7" r="6.5" stroke="#0088FF" />
                <path d="M7 3.5V7M7 10.5H7.01" stroke="#0088FF" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>{t.testPage.instruction}</span>
            </div>

            {/* Вопросы */}
            {currentItems.map((item) => {
              // Helper function для получения текста с fallback
              const getText = (textObj: { ru?: string; kk?: string; en?: string }) => {
                return textObj[locale as keyof typeof textObj] || textObj.ru || textObj.kk || textObj.en || '';
              };
              
              return (
              <div key={item.item_id} className="high5-question-block">
                <h2 className="high5-subtitle">
                  {getText(item.text)}
                </h2>

                <div className="high5-question-scale">
                  <QuestionScale 
                    options={likertOptions}
                    onChange={(optionIndex) => handleScaleChange(item.item_id, optionIndex)}
                    selectedIndex={answers[item.item_id] !== undefined 
                      ? likertOptions.findIndex(opt => opt.value === answers[item.item_id]) 
                      : -1
                    }
                  />
                </div>
              </div>
            )})}
            

            {/* Навигационные кнопки */}
            <TestNavigation
              onPrevious={handlePreviousBlock}
              onNext={handleNextBlock}
              canGoPrevious={currentBatchStartIndex > 0}
              canGoNext={allAnswered}
              loading={submitting}
            />

            {/* Прогресс-бар внизу */}
            <TestProgressBar 
              currentQuestion={sessionInfo.current_item_number}
              totalQuestions={sessionInfo.total_items}
              answeredQuestions={sessionInfo.answered_items}
              progressPercent={sessionInfo.progress_percent}
              startQuestion={currentBatchStartIndex + 1}
              endQuestion={currentBatchStartIndex + currentItems.length}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

