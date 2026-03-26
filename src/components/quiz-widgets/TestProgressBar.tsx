import { useTranslation } from "../../hooks/useTranslation";
import "./TestProgressBar.css";

interface TestProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredQuestions: number;
  progressPercent: number;
  // Опциональные параметры для отображения диапазона (для пачек вопросов)
  startQuestion?: number;
  endQuestion?: number;
}

export const TestProgressBar = ({ 
  currentQuestion, 
  totalQuestions, 
  answeredQuestions,
  progressPercent,
  startQuestion,
  endQuestion
}: TestProgressBarProps) => {
  const { t } = useTranslation();
  
  // Вычисляем прогресс на основе РЕАЛЬНОГО количества отвеченных вопросов
  // а не на основе текущей позиции пользователя в тесте
  // Это гарантирует, что прогресс-бар не будет уменьшаться при навигации назад
  const actualProgress = Math.round((answeredQuestions / totalQuestions) * 100);
  
  // Определяем текст в зависимости от того, показываем ли мы диапазон или один вопрос
  const isBatchMode = startQuestion !== undefined && endQuestion !== undefined;
  const questionText = isBatchMode
    ? `${t.testPage.questions} ${startQuestion}-${endQuestion} ${t.testPage.of} ${totalQuestions}`
    : `${t.testPage.question} ${currentQuestion} ${t.testPage.of} ${totalQuestions}`;
  
  return (
    <div className="test-bottom-progress">
      <div className="test-progress-bar-bottom">
        <div 
          className="test-progress-fill" 
          style={{ width: `${actualProgress}%` }}
        />
        <div className="test-progress-text-bottom">
          {questionText} • {t.testPage.answered}: {answeredQuestions} ({actualProgress}%)
        </div>
      </div>
    </div>
  );
};

