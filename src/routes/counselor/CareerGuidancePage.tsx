import { useEffect, useState } from "react";
import { Card, Spin, App, Button, Tabs, Tag, Empty, Input, Modal, Select, Alert } from "antd";
import { useNavigate, useParams } from "@tanstack/react-router";
import { CheckCircleOutlined, RobotOutlined, EditOutlined, FileTextOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import axiosClient from "../../api/axiosClient";
import Breadcrumb from "../../components/Breadcrumb";
import { useTranslation } from "../../hooks/useTranslation";
import "./CareerGuidancePage.css";

const { TextArea } = Input;

interface Sphere {
  id: string;
  name_ru: string;
  name_kk: string;
  name_en: string;
  reasoning_en?: string;
  reasoning_ru?: string;
  reasoning_kk?: string;
  score?: number;
}

interface Readiness {
  is_ready: boolean;
  completed_tests: {
    riasec: boolean;
    soft_skills: boolean;
    high5: boolean;
    questionnaire: boolean;
  };
  has_report: boolean;
  report_status?: string;
  report_id?: string;
}

interface StudentData {
  id: number;
  name: string;
  email: string;
  classroom?: { name: string };
}

export const CareerGuidancePage = () => {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [availableSpheres, setAvailableSpheres] = useState<Sphere[]>([]);
  const [selectedSpheres, setSelectedSpheres] = useState<Sphere[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [counselorComment, setCounselorComment] = useState("");
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  
  const params = useParams({ strict: false });
  const studentId = params.studentId;

  useEffect(() => {
    if (studentId) {
      fetchData();
    }
  }, [studentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [studentRes, readinessRes, spheresRes] = await Promise.all([
        axiosClient.get(`/counselor/students/${studentId}/results`),
        axiosClient.get(`/counselor/career/students/${studentId}/readiness`),
        axiosClient.get('/counselor/career/spheres'),
      ]);
      
      if (readinessRes.data.has_report && readinessRes.data.report_status === 'generated') {
        navigate({ to: `/counselor/career/reports/${readinessRes.data.report_id}` });
        return;
      }
      
      setStudent(studentRes.data.student);
      setReadiness(readinessRes.data);
      setAvailableSpheres(spheresRes.data);
      
      if (readinessRes.data.report_id && readinessRes.data.report_status === 'draft') {
        const reportRes = await axiosClient.get(`/counselor/career/reports/${readinessRes.data.report_id}`);
        if (reportRes.data.spheres) {
          setSelectedSpheres(reportRes.data.spheres);
        }
      }
    } catch (error: any) {
      message.error(t.careerGuidance.errorLoading);
      navigate({ to: "/tests/assign/classrooms" });
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedName = (sphere: Sphere) => {
    const key = `name_${locale}` as keyof Sphere;
    return (sphere[key] as string) || sphere.name_ru;
  };

  const getLocalizedReasoning = (sphere: Sphere) => {
    const key = `reasoning_${locale}` as keyof Sphere;
    return (sphere[key] as string) || sphere.reasoning_ru || sphere.reasoning_en || "";
  };

  const handleSelectSphere = (sphere: Sphere) => {
    if (selectedSpheres.length >= 3) {
      message.warning(t.careerGuidance.maxSpheresWarning);
      return;
    }
    
    if (selectedSpheres.find(s => s.id === sphere.id)) {
      message.warning(t.careerGuidance.sphereAlreadySelected);
      return;
    }
    
    setSelectedSpheres([...selectedSpheres, sphere]);
  };

  const handleRemoveSphere = (sphereId: string) => {
    setSelectedSpheres(selectedSpheres.filter(s => s.id !== sphereId));
  };

  const handleGetAiRecommendation = async () => {
    setCommentModalVisible(true);
  };

  const confirmAiRecommendation = async () => {
    setCommentModalVisible(false);
    setAiLoading(true);
    
    try {
      const { data } = await axiosClient.post(`/counselor/career/students/${studentId}/ai-spheres`, {
        counselor_comment: counselorComment,
      });
      
      if (data.top_fields) {
        setSelectedSpheres(data.top_fields);
        message.success(t.careerGuidance.aiRecommendationReceived);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || t.careerGuidance.errorGettingRecommendation);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveSpheres = async () => {
    if (selectedSpheres.length !== 3) {
      message.warning(t.careerGuidance.needExactly3Spheres);
      return;
    }
    
    try {
      await axiosClient.post(`/counselor/career/students/${studentId}/spheres`, {
        spheres: selectedSpheres,
        from_ai: false,
      });
      
      message.success(t.careerGuidance.spheresSaved);
      fetchData();
    } catch (error: any) {
      message.error(t.careerGuidance.errorSaving);
    }
  };

  const handleGenerateReport = async () => {
    if (!readiness?.report_id) {
      message.error(t.careerGuidance.saveSphereFirst);
      return;
    }
    
    setGenerating(true);
    
    try {
      await axiosClient.post(`/counselor/career/reports/${readiness.report_id}/generate`);
      message.success(t.careerGuidance.reportGenSuccess);
      navigate({ to: `/counselor/career/reports/${readiness.report_id}` });
    } catch (error: any) {
      message.error(error.response?.data?.message || t.careerGuidance.errorGenerating);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Spin size="large" />
        <div className="mt-4 text-gray-500">{t.careerGuidance.loading}</div>
      </div>
    );
  }

  if (!student || !readiness) {
    return null;
  }

  const renderTestStatus = () => {
    const tests = readiness.completed_tests;
    const testList = [
      { key: 'riasec', name: 'RIASEC', completed: tests.riasec },
      { key: 'soft_skills', name: 'Soft Skills', completed: tests.soft_skills },
      { key: 'high5', name: 'High5', completed: tests.high5 },
      { key: 'questionnaire', name: t.careerGuidance.questionnaire, completed: tests.questionnaire },
    ];
    
    return (
      <div className="test-status-grid">
        {testList.map(test => (
          <div key={test.key} className={`test-status-item ${test.completed ? 'completed' : 'pending'}`}>
            {test.completed ? (
              <CheckCircleOutlined className="text-green-600" />
            ) : (
              <span className="status-dot pending" />
            )}
            <span>{test.name}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderSpheresSelection = () => {
    return (
      <div className="spheres-section">
        <div className="spheres-header">
          <h3>{t.careerGuidance.selectSpheres}</h3>
          <Button
            type="primary"
            icon={<RobotOutlined />}
            onClick={handleGetAiRecommendation}
            loading={aiLoading}
            disabled={!readiness.is_ready}
          >
            {t.careerGuidance.getAiRecommendation}
          </Button>
        </div>
        
        <div className="selected-spheres">
          <h4>{t.careerGuidance.selectedSpheres}:</h4>
          {selectedSpheres.length === 0 ? (
            <Empty description={t.careerGuidance.noSpheresSelected} />
          ) : (
            <div className="selected-spheres-list">
              {selectedSpheres.map((sphere, index) => (
                <Card key={sphere.id} size="small" className="selected-sphere-card">
                  <div className="sphere-card-header">
                    <Tag color="blue">#{index + 1}</Tag>
                    <span className="sphere-name">{getLocalizedName(sphere)}</span>
                    <Button 
                      type="text" 
                      danger 
                      size="small"
                      onClick={() => handleRemoveSphere(sphere.id)}
                    >
                      ✕
                    </Button>
                  </div>
                  {getLocalizedReasoning(sphere) && (
                    <p className="sphere-reasoning">{getLocalizedReasoning(sphere)}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <div className="available-spheres">
          <h4>{t.careerGuidance.availableSpheres}:</h4>
          <Select
            placeholder={t.careerGuidance.selectSphere}
            style={{ width: '100%' }}
            onChange={(value) => {
              const sphere = availableSpheres.find(s => s.id === value);
              if (sphere) {
                handleSelectSphere(sphere);
              }
            }}
            value={undefined}
            disabled={selectedSpheres.length >= 3}
          >
            {availableSpheres
              .filter(s => !selectedSpheres.find(sel => sel.id === s.id))
              .map(sphere => (
                <Select.Option key={sphere.id} value={sphere.id}>
                  {getLocalizedName(sphere)}
                </Select.Option>
              ))
            }
          </Select>
        </div>
        
        <div className="spheres-actions">
          <Button 
            onClick={handleSaveSpheres}
            disabled={selectedSpheres.length !== 3}
          >
            {t.careerGuidance.saveSpheres}
          </Button>
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            onClick={handleGenerateReport}
            loading={generating}
            disabled={!readiness.report_id || readiness.report_status !== 'draft'}
          >
            {t.careerGuidance.generateReport}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="career-guidance-page p-6 max-w-6xl mx-auto">
      <Card className="mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => window.history.back()}
          className="mb-4"
        >
          {t.careerGuidance.back}
        </Button>

        <Breadcrumb
          routes={[
            { name: t.nav.assignTests, href: "/tests/assign/classrooms" },
            { name: student.name },
          ]}
        />
        
        <div className="mt-4">
          <h1 className="text-3xl font-bold">{t.careerGuidance.title}: {student.name}</h1>
          <p className="text-gray-600 mt-1">{student.email}</p>
          {student.classroom && (
            <p className="text-gray-600">{t.careerGuidance.classroom}: {student.classroom.name}</p>
          )}
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="text-xl font-semibold mb-4">{t.careerGuidance.testStatus}</h2>
        {renderTestStatus()}
        
        {!readiness.is_ready && (
          <Alert
            type="warning"
            message={t.careerGuidance.notAllTestsCompleted}
            description={t.careerGuidance.needAllTests}
            className="mt-4"
          />
        )}
        
        {readiness.has_report && readiness.report_status === 'generated' && (
          <Alert
            type="success"
            message={t.careerGuidance.reportGenerated}
            description={
              <Button 
                type="link" 
                onClick={() => navigate({ to: `/counselor/career/reports/${readiness.report_id}` })}
              >
                {t.careerGuidance.viewReport}
              </Button>
            }
            className="mt-4"
          />
        )}
      </Card>

      {readiness.is_ready && (
        <Card className="mb-4">
          {renderSpheresSelection()}
        </Card>
      )}

      <Modal
        title={t.careerGuidance.aiCommentTitle}
        open={commentModalVisible}
        onOk={confirmAiRecommendation}
        onCancel={() => setCommentModalVisible(false)}
        okText={t.careerGuidance.getRecommendation}
        cancelText={t.common.cancel}
        destroyOnHidden
        maskClosable
      >
        <p className="mb-4">
          {t.careerGuidance.aiCommentDesc}
        </p>
        <TextArea
          rows={4}
          value={counselorComment}
          onChange={(e) => setCounselorComment(e.target.value)}
          placeholder={t.careerGuidance.aiCommentPlaceholder}
        />
      </Modal>
    </div>
  );
};
