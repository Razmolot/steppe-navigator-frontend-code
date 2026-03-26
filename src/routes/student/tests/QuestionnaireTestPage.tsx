import { useEffect, useState, useRef } from "react";
import { Input, Spin, App } from "antd";
import { useNavigate, useParams, Link } from "@tanstack/react-router";
import axiosClient from "../../../api/axiosClient";
import { TestProgressBar } from "../../../components/quiz-widgets/TestProgressBar";
import { TestNavigation } from "../../../components/quiz-widgets/TestNavigation";
import { QuestionCheckboxes } from "../../../components/quiz-widgets/QuestionCheckboxes/QuestionCheckboxes";
import { QuestionChoice } from "../../../components/quiz-widgets/QuestionChoice/QuestionChoice";
import { useTranslation } from "../../../hooks/useTranslation";
import '../../counselor/CounselorTestsPage.css';
import "./QuestionnaireTestPage.css";

interface Question {
  question_id: string;
  type: "single_choice" | "multiple_choice";
  text: {
    ru: string;
    kk: string;
    en: string;
  };
  options: Array<{
    option_id: string;
    text: {
      ru: string;
      kk: string;
      en: string;
    };
    has_custom_input: boolean;
  }>;
}

interface SessionInfo {
  total_questions: number;
  answered_questions: number;
  current_question_number: number;
  progress_percent: number;
}

export const QuestionnaireTestPage = () => {
  const { id } = useParams({ strict: false });
  const { t, locale } = useTranslation();
  const [session, setSession] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [customText, setCustomText] = useState("");
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
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
      
      const { data: sessionData } = await axiosClient.post("/student/questionnaire/sessions", {
        assignment_id: id,
        locale: locale,
      });
      
      setSession(sessionData.session);
      await loadCurrentQuestion(sessionData.session.id);
    } catch (error: any) {
      // Если опросник уже пройден - редирект на результаты
      if (error?.response?.status === 409 && error?.response?.data?.status === 'completed') {
        const sessionId = error.response.data.session_id;
        message.info(t.tests.testAlreadyCompleted || 'Опросник уже пройден');
        navigate({ to: `/student/tests/questionnaire/result/${sessionId}` });
        return;
      }
      message.error(error?.response?.data?.error || t.testPage.errorCreatingSession);
      navigate({ to: "/student/tests" });
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentQuestion = async (sessionId: string) => {
    try {
      const { data } = await axiosClient.get(`/student/questionnaire/sessions/${sessionId}/questions/next`);
      
      if (data.question_id) {
        setCurrentQuestion({
          question_id: data.question_id,
          type: data.type,
          text: data.text,
          options: data.options,
        });
        setSessionInfo(data.session_info);
        
        // Загружаем сохраненный ответ если есть
        if (data.saved_answer) {
          setSelectedOptions(data.saved_answer.selected_options || []);
          setCustomText(data.saved_answer.custom_text || "");
        } else {
          setSelectedOptions([]);
          setCustomText("");
        }
        
        setQuestionStartTime(Date.now());
      } else if (data.error === 'All questions have been answered') {
        message.success(t.tests.testCompleted);
        navigate({ to: `/student/tests/questionnaire/result/${sessionId}` });
      }
    } catch (error: any) {
      if (error?.response?.status === 409 || 
          (error?.response?.status === 400 && error?.response?.data?.status === 'completed')) {
        message.success(t.tests.testCompleted);
        navigate({ to: `/student/tests/questionnaire/result/${sessionId}` });
      } else {
        message.error(error?.response?.data?.error || t.testPage.errorLoading);
      }
    }
  };

  const handleSingleChoiceChange = (optionId: string | null) => {
    if (optionId) {
      setSelectedOptions([optionId]);
    } else {
      setSelectedOptions([]);
    }
  };

  const handleMultipleChoiceChange = (optionIds: string[]) => {
    setSelectedOptions(optionIds);
  };

  const handleSaveAndNavigate = async (direction: 'next' | 'previous') => {
    if (!session || !currentQuestion) return;

    if (selectedOptions.length === 0 && direction === 'next') {
      message.warning(t.testPage.answerAllQuestions);
      return;
    }

    setSubmitting(true);

    const questionEndTime = Date.now();
    const latencyMs = questionEndTime - questionStartTime;

    // 1. Сохраняем ответ если выбраны опции
    if (selectedOptions.length > 0) {
      try {
        await axiosClient.post(`/student/questionnaire/sessions/${session.id}/answers`, {
          question_id: currentQuestion.question_id,
          selected_options: selectedOptions,
          custom_text: customText || null,
          timestamp_client: new Date().toISOString(),
          latency_ms: latencyMs,
        });
      } catch (error: any) {
        setSubmitting(false);
        if (error?.response?.status === 409 || 
            (error?.response?.status === 400 && error?.response?.data?.status === 'completed')) {
          message.success(t.tests.testCompleted);
          navigate({ to: `/student/tests/questionnaire/result/${session.id}` });
        } else {
          message.error(error?.response?.data?.error || t.testPage.errorSaving);
        }
        return;
      }
    }

    // 2. Загружаем следующий/предыдущий вопрос (отдельный try/catch)
    try {
      let endpoint = '';
      if (direction === 'next') {
        endpoint = `/student/questionnaire/sessions/${session.id}/questions/next?current_question_id=${currentQuestion.question_id}`;
      } else {
        endpoint = `/student/questionnaire/sessions/${session.id}/questions/previous?current_question_id=${currentQuestion.question_id}`;
      }

      const { data } = await axiosClient.get(endpoint);

      if (data.question_id) {
        setCurrentQuestion({
          question_id: data.question_id,
          type: data.type,
          text: data.text,
          options: data.options,
        });
        setSessionInfo(data.session_info);
        
        if (data.saved_answer) {
          setSelectedOptions(data.saved_answer.selected_options || []);
          setCustomText(data.saved_answer.custom_text || "");
        } else {
          setSelectedOptions([]);
          setCustomText("");
        }
        
        setQuestionStartTime(Date.now());
        message.success(direction === 'next' ? t.testPage.answersSaved : t.testPage.returnToPrevious);
        scrollToTop();
      } else if (data.error === 'All questions have been answered') {
        message.success(t.tests.testCompleted);
        navigate({ to: `/student/tests/questionnaire/result/${session.id}` });
      }
    } catch (error: any) {
      if (error?.response?.status === 409 || 
          (error?.response?.status === 400 && error?.response?.data?.status === 'completed')) {
        message.success(t.tests.testCompleted);
        navigate({ to: `/student/tests/questionnaire/result/${session.id}` });
      } else {
        message.error(error?.response?.data?.error || t.testPage.errorLoading);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreviousQuestion = () => {
    handleSaveAndNavigate('previous');
  };

  const handleNextQuestion = () => {
    handleSaveAndNavigate('next');
  };

  const handleAbort = async () => {
    if (!session) return;

    try {
      await axiosClient.post(`/student/questionnaire/sessions/${session.id}/abort`);
      message.info(t.common.testAborted || "Тест прерван");
      navigate({ to: "/student/tests" });
    } catch (error) {
      message.error(t.testPage.errorSaving);
    }
  };

  if (loading) {
    return (
      <div className="counselor-tests-page">
        <Spin size="large" tip={t.common.loading}>
          <div style={{ padding: '50px' }} />
        </Spin>
      </div>
    );
  }

  if (!session || !currentQuestion || !sessionInfo) {
    return null;
  }

  const showCustomInput = currentQuestion.options.some(
    opt => opt.has_custom_input && selectedOptions.includes(opt.option_id)
  );

  const progress = sessionInfo.progress_percent || 0;

  // Helper function для получения текста с fallback
  const getLocalizedText = (textObj: { ru?: string; kk?: string; en?: string }) => {
    return textObj[locale as keyof typeof textObj] || textObj.ru || textObj.kk || textObj.en || '';
  };

  return (
    <div className="counselor-tests-page" ref={topRef}>
      <div className="page-header">
        <div className="breadcrumb">
          <span className="breadcrumb-item"><Link to="/student/tests">{t.nav.tests}</Link></span>
          <span className="breadcrumb-item"> / </span>
          <span className="breadcrumb-item current">{t.tests.questionnaire}</span>
        </div>
        <div className="page-title-wrapper">
          <h1 className="page-title">{t.tests.questionnaire}</h1>
        </div>
      </div>

      <div className="px-6 pb-6">
        {/* Основной контейнер с тестом */}
        <div className="ant-card ant-card-bordered questionnaire-content">
          <div className="ant-card-body">
            {/* Заголовок */}
            <h1 className="questionnaire-title">{t.tests.questionnaire}</h1>

            {/* Инструкция */}
            <div className="questionnaire-instruction">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="7" cy="7" r="6.5" stroke="#0088FF" />
                <path d="M7 3.5V7M7 10.5H7.01" stroke="#0088FF" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>
                {currentQuestion.type === "single_choice"
                  ? t.questionnaire.selectOne
                  : t.questionnaire.selectOneOrMore}
              </span>
            </div>

            {/* Вопрос */}
            <h2 className="questionnaire-question">
              {getLocalizedText(currentQuestion.text)}
            </h2>

            {/* Варианты ответов */}
            <div className="questionnaire-options">
              {currentQuestion.type === "single_choice" ? (
                <QuestionChoice
                  key={currentQuestion.question_id}
                  options={currentQuestion.options}
                  locale={locale}
                  value={selectedOptions.length > 0 ? selectedOptions[0] : null}
                  onChange={handleSingleChoiceChange}
                />
              ) : (
                <QuestionCheckboxes
                  key={currentQuestion.question_id}
                  options={currentQuestion.options}
                  locale={locale}
                  value={selectedOptions}
                  onChange={handleMultipleChoiceChange}
                />
              )}

              {showCustomInput && (
                <div className="questionnaire-custom-input">
                  <Input.TextArea
                    placeholder={t.questionnaire.enterCustom}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    rows={3}
                    maxLength={500}
                    showCount
                  />
                </div>
              )}
            </div>

            {/* Навигационные кнопки */}
            <TestNavigation
              onPrevious={handlePreviousQuestion}
              onNext={handleNextQuestion}
              canGoPrevious={sessionInfo ? sessionInfo.current_question_number > 1 : false}
              canGoNext={selectedOptions.length > 0}
              loading={submitting}
            />
          </div>

          {/* Прогресс бар под тестом - на всю ширину */}
          <TestProgressBar 
            currentQuestion={sessionInfo.current_question_number}
            totalQuestions={sessionInfo.total_questions}
            answeredQuestions={sessionInfo.answered_questions}
            progressPercent={progress}
          />
        </div>
      </div>
    </div>
  );
};
