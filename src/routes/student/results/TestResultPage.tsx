import { Card, Button } from "antd";
import { useNavigate, useParams, Link } from "@tanstack/react-router";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "../../../hooks/useTranslation";
import '../../counselor/CounselorTestsPage.css';

export const TestResultPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Из URL получаем testType
  const params = useParams({ strict: false });
  const testType = params.testType || "riasec";

  const getTestName = () => {
    const names: Record<string, string> = {
      riasec: t.tests.riasec,
      "soft-skills": t.tests.softSkills,
      high5: t.tests.high5,
      questionnaire: t.tests.questionnaire,
    };
    return names[testType] || t.nav.tests;
  };

  return (
    <div className="counselor-tests-page">
      <div className="page-header">
        <div className="breadcrumb">
          <span className="breadcrumb-item"><Link to="/student/tests">{t.nav.tests}</Link></span>
          <span className="breadcrumb-item"> / </span>
          <span className="breadcrumb-item current">{getTestName()}</span>
        </div>
        <div className="page-title-wrapper">
          <h1 className="page-title">{getTestName()}</h1>
        </div>
      </div>

      <div className="px-6 pb-6">
        <Card className="text-center">
          <div className="py-12">
            <CheckCircleOutlined className="text-8xl text-green-600 mb-6" />
            <h1 className="text-4xl font-bold mb-4">{t.tests.testCompleted}</h1>
            <p className="text-xl text-gray-600 mb-8">
              {t.tests.testCompletedDesc}
            </p>
            <Button 
              type="primary" 
              size="large" 
              onClick={() => navigate({ to: "/student/tests" })}
              className="px-8"
            >
              {t.questionnaire.returnToTests}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
