import { InfoCircleOutlined } from '@ant-design/icons';
import { useTranslation } from '../hooks/useTranslation';
import './TestCard.css';

interface TestCardProps {
  title: string;
  description: string;
  image: string;
  completionRate?: number;
  completedCount?: number;
  totalCount?: number;
  onTitleClick?: () => void;
  // Для студентов
  progress?: number;
  answeredCount?: number;
  totalQuestions?: number;
  isLocked?: boolean;
  status?: 'not_started' | 'in_progress' | 'completed';
}

export const TestCard = ({
  title,
  description,
  image,
  completionRate,
  completedCount,
  totalCount,
  onTitleClick,
  progress,
  answeredCount,
  totalQuestions,
  isLocked = false,
  status = 'not_started',
}: TestCardProps) => {
  const { t, locale } = useTranslation();
  
  // Определяем, это карточка профориентатора или студента
  const isCounselorView = completionRate !== undefined;
  const displayProgress = Math.round(isCounselorView ? completionRate : (progress || 0));
  
  // Если статус "не начат" но есть прогресс - значит есть abandoned сессия
  // Считаем что тест в процессе если есть хоть какой-то прогресс
  const actualStatus = (status === 'not_started' && displayProgress > 0) ? 'in_progress' : status;
  
  const getStatusText = () => {
    if (isCounselorView) {
      const studentsText = locale === 'ru' ? 'учеников завершили тест' : 
                          locale === 'kk' ? 'оқушы тестті аяқтады' : 
                          'students completed the test';
      return `${completedCount} ${t.testPage.of} ${totalCount} ${studentsText}`;
    }
    
    // Для студента - проверяем completed ПЕРВЫМ, чтобы статус 100% отображался корректно
    if (actualStatus === 'completed') {
      return t.tests.completed;
    }
    
    if (actualStatus === 'in_progress') {
      if (answeredCount !== undefined && answeredCount !== null && 
          totalQuestions !== undefined && totalQuestions !== null) {
        const answeredText = locale === 'ru' ? 'Отвечено на' : 
                            locale === 'kk' ? 'Жауап берілді' : 
                            'Answered';
        return `${answeredText} ${answeredCount} ${t.testPage.of} ${totalQuestions}`;
      }
      return t.tests.inProgress;
    }
    
    // not_started или любой другой неизвестный статус
    return t.tests.notStarted;
  };
  
    // ВОТ СЮДА (после закрытия getStatusText и перед return JSX)
  const resolvedImage = image?.startsWith('/')
    ? `${import.meta.env.BASE_URL}${image.slice(1)}`
    : image;

  
  return (
    <div className={`test-card ${isLocked ? 'test-card-locked' : ''}`}>
      <div 
        className="test-card-cover" 
        style={{ 
          backgroundImage: `url(${resolvedImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="test-card-aspect-ratio-keeper"></div>
      </div>
      
      <div className="test-card-body">
        <div className="test-card-title-wrapper">
          <h3 className="test-card-title" onClick={onTitleClick}>
            {title}
          </h3>
        </div>
        
        <div className="test-card-description">
          <p>{description}</p>
        </div>
        
        <div className="test-card-stats">
          <div className="test-card-stat-header">
            <span className="test-card-stat-label">
              {isCounselorView 
                ? (locale === 'ru' ? 'Прошли тестирование' : locale === 'kk' ? 'Тесттен өтті' : 'Completed testing')
                : t.testPage.progress}
            </span>
            <InfoCircleOutlined className="test-card-info-icon" />
          </div>
          
          <div className="test-card-percentage">
            <span className="test-card-percentage-value">{displayProgress}%</span>
          </div>
          
          <div className="test-card-progress-bar">
            <div 
              className="test-card-progress-fill" 
              style={{ width: `${displayProgress}%` }}
            ></div>
          </div>
          
          <div className="test-card-divider"></div>
          
          <div className="test-card-completion-text">
            <span>{getStatusText()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
