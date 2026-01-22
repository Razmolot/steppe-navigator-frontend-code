import { Card } from "antd";
import { useParams, Link } from "@tanstack/react-router";
import { High5Report } from "../../../components/High5Report/High5Report";
import { useTranslation } from "../../../hooks/useTranslation";
import '../../counselor/CounselorTestsPage.css';
import './High5ResultPage.css';

export const High5ResultPage = () => {
  const { sessionId } = useParams({ strict: false });
  const { t } = useTranslation();

  if (!sessionId) {
    return null;
  }

  return (
    <div className="counselor-tests-page">
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
        <Card>
          <High5Report 
            sessionId={sessionId} 
            mode="student"
          />
        </Card>
      </div>
    </div>
  );
};
