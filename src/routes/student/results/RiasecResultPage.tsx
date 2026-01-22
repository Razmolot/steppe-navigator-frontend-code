import { Card } from "antd";
import { useParams, Link } from "@tanstack/react-router";
import { RiasecReport } from "../../../components/RiasecReport/RiasecReport";
import { useTranslation } from "../../../hooks/useTranslation";
import '../../counselor/CounselorTestsPage.css';
import './RiasecResultPage.css';

export const RiasecResultPage = () => {
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
          <span className="breadcrumb-item current">{t.tests.riasec}</span>
        </div>
        <div className="page-title-wrapper">
          <h1 className="page-title">{t.tests.riasec}</h1>
        </div>
      </div>

      <div className="px-6 pb-6">
        <Card>
          <RiasecReport 
            sessionId={sessionId} 
            mode="student"
            studentGender="male"
          />
        </Card>
      </div>
    </div>
  );
};

