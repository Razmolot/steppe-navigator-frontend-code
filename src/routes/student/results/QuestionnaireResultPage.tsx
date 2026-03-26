import { Card, Button } from "antd";
import { useNavigate, Link } from "@tanstack/react-router";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "../../../hooks/useTranslation";
import '../../counselor/CounselorTestsPage.css';
import './QuestionnaireResultPage.css';

export const QuestionnaireResultPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="counselor-tests-page">
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
        <Card className="questionnaire-result-card">
          {/* Иконка и заголовок */}
          <div className="result-header">
            <CheckCircleOutlined className="result-icon" />
            <h1 className="result-title">{t.questionnaire.completedTitle}</h1>
            <p className="result-subtitle">{t.questionnaire.completedSubtitle}</p>
          </div>

          {/* Информационное сообщение */}
          <div className="info-message">
            <p>{t.questionnaire.completedMessage}</p>
          </div>

          {/* Кнопка возврата */}
          <div className="result-actions">
            <Button 
              type="primary" 
              size="large" 
              onClick={() => navigate({ to: "/student/tests" })}
              className="return-button"
            >
              {t.questionnaire.returnToTests}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

