import { useEffect, useState } from "react";
import { Card, Spin, App, Button, Tabs, Tag, Collapse, Switch } from "antd";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeftOutlined, DownloadOutlined, EditOutlined, FilePdfOutlined, ReloadOutlined } from "@ant-design/icons";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import axiosClient from "../../api/axiosClient";
import Breadcrumb from "../../components/Breadcrumb";
import { useTranslation } from "../../hooks/useTranslation";
import "./CareerReportPage.css";

const { Panel } = Collapse;

interface Profession {
  slug: string;
  title: { ru: string; kk: string; en: string };
  description: { ru: string; kk: string; en: string };
  riasec: string;
  soft_skills: string[];
  high5: string[];
  education?: {
    group_code: string;
    group_name: { ru: string; kk: string; en: string };
    programs: string[];
    ent_subjects: { ru: string; kk: string; en: string };
    group_url: string;
  };
  similarity: number;
}

interface Sphere {
  id: string;
  name_ru: string;
  name_kk: string;
  name_en: string;
  reasoning_ru?: string;
  reasoning_kk?: string;
  reasoning_en?: string;
}

interface SphereWithProfessions {
  sphere_id: string;
  sphere_title: { ru: string; kk: string; en: string };
  professions: Profession[];
}

interface ReportData {
  report: {
    id: string;
    status: string;
    created_at: string;
    pdf_path?: string;
  };
  student: {
    id: number;
    name: string;
    email: string;
    classroom?: {
      id: number;
      name: string;
      school?: {
        id: number;
        name: string;
      };
    };
  };
  spheres: Sphere[];
  professions: {
    higher: Record<string, SphereWithProfessions>;
    tvet: Record<string, SphereWithProfessions>;
  };
  ai_resume: {
    ru: string;
    kk: string;
    en: string;
  };
  test_results: {
    riasec?: {
      riasec_vector: Record<string, number>;
      riasec_triplet: string;
    };
    soft_skills?: {
      soft_vector: Record<string, number>;
      soft_triplet: string;
    };
    high5?: {
      top5: string[];
      full_ranking: string[];
    };
  };
}

// Данные RIASEC для подписей
const RIASEC_LABELS: Record<string, { ru: string; kk: string; en: string }> = {
  R: { ru: "Реалистический", kk: "Реалистік", en: "Realistic" },
  I: { ru: "Исследовательский", kk: "Зерттеушілік", en: "Investigative" },
  A: { ru: "Артистический", kk: "Шығармашылық", en: "Artistic" },
  S: { ru: "Социальный", kk: "Әлеуметтік", en: "Social" },
  E: { ru: "Предпринимательский", kk: "Кәсіпкерлік", en: "Enterprising" },
  C: { ru: "Конвенциональный", kk: "Ұйымдастырушылық", en: "Conventional" },
};

const SOFT_LABELS: Record<string, { ru: string; kk: string; en: string }> = {
  comm: { ru: "Коммуникация", kk: "Қарым-қатынас", en: "Communication" },
  team: { ru: "Командная работа", kk: "Командалық жұмыс", en: "Teamwork" },
  creat: { ru: "Креативность", kk: "Шығармашылық", en: "Creativity" },
  crit: { ru: "Системное мышление", kk: "Жүйелік ойлау", en: "Systems Thinking" },
  emot: { ru: "Эмоциональный интеллект", kk: "Эмоциялық интеллект", en: "Emotional Intelligence" },
  unc: { ru: "Работа в неопределённости", kk: "Белгісіздікте жұмыс", en: "Uncertainty Tolerance" },
};

const HIGH5_LABELS: Record<string, { ru: string; kk: string; en: string; emoji: string }> = {
  Thinker: { ru: "Мыслитель", kk: "Ойшыл", en: "Thinker", emoji: "💡" },
  ProblemSolver: { ru: "Решатель проблем", kk: "Мәселе шешуші", en: "Problem Solver", emoji: "🧩" },
  Strategist: { ru: "Стратег", kk: "Стратег", en: "Strategist", emoji: "♟️" },
  Philomath: { ru: "Любитель учиться", kk: "Білімқұмар", en: "Philomath", emoji: "📚" },
  Coach: { ru: "Наставник", kk: "Тәлімгер", en: "Coach", emoji: "🧭" },
  Empathizer: { ru: "Эмпат", kk: "Эмпат", en: "Empathizer", emoji: "💞" },
  Storyteller: { ru: "Рассказчик", kk: "Әңгімеші", en: "Storyteller", emoji: "📖" },
  Catalyst: { ru: "Катализатор", kk: "Катализатор", en: "Catalyst", emoji: "⚡" },
  Believer: { ru: "Верящий", kk: "Сенуші", en: "Believer", emoji: "🌱" },
  SelfBeliever: { ru: "Верящий в себя", kk: "Өзіне сенуші", en: "Self-Believer", emoji: "🚀" },
};

export const CareerReportPage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [educationLevel, setEducationLevel] = useState<'higher' | 'tvet'>('higher');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  
  const params = useParams({ strict: false });
  const reportId = params.reportId;

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const { data: response } = await axiosClient.get(`/counselor/career/reports/${reportId}`);
      setData(response);
    } catch (error: any) {
      message.error(t.careerReportPage.errorLoading);
      navigate({ to: "/" });
    } finally {
      setLoading(false);
    }
  };

  const generatePdf = async () => {
    try {
      setGeneratingPdf(true);
      await axiosClient.post(`/counselor/career/reports/${reportId}/pdf`, { locale });
      message.success(t.careerReportPage.pdfGenerated);
      await fetchReport();
    } catch (error: any) {
      message.error(t.careerReportPage.pdfGenerationError);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const downloadPdf = async () => {
    try {
      setGeneratingPdf(true);
      const response = await axiosClient.get(`/counselor/career/reports/${reportId}/pdf/download?locale=${locale}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `career_report_${data?.student?.name || 'student'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      message.error(t.careerReportPage.downloadPdfError);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const regenerateReport = async () => {
    try {
      setLoading(true);
      await axiosClient.delete(`/counselor/career/reports/${reportId}`);
      message.success(t.careerReportPage.reportDeletedRedirect);
      navigate({ to: `/counselor/career/students/${data?.student?.id}` });
    } catch (error: any) {
      message.error(t.careerReportPage.errorDeletingReport);
      setLoading(false);
    }
  };

  const editSpheres = () => {
    const studentId = data?.student?.id;
    if (!studentId) {
      message.error(t.careerReportPage.errorLoading);
      return;
    }
    // Allow editing spheres even if current report is generated
    navigate({
      to: `/counselor/career/students/${studentId}` ,
      search: { editSpheres: '1', fromReportId: reportId },
    });
  };


  const getLocalizedText = (obj: Record<string, string> | undefined, fallback = "") => {
    if (!obj) return fallback;
    return obj[locale] || obj.ru || obj.en || fallback;
  };

  const getRiasecRadarData = () => {
    const vector = data?.test_results?.riasec?.riasec_vector;
    if (!vector) return [];
    
    // Фиксированный порядок ключей RIASEC (как в RiasecReport.tsx)
    const orderedKeys = ['R', 'I', 'A', 'S', 'E', 'C'];
    const values = orderedKeys.map(key => vector[key] || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    const normalize = (value: number): number => {
      const z = (value - min) / (max - min + 0.0001);
      return Math.round((0.2 + 0.8 * z) * 100);
    };
    
    return [
      { type: RIASEC_LABELS.R?.[locale] || 'R', value: normalize(vector.R || 0), fullMark: 100 },
      { type: RIASEC_LABELS.I?.[locale] || 'I', value: normalize(vector.I || 0), fullMark: 100 },
      { type: RIASEC_LABELS.A?.[locale] || 'A', value: normalize(vector.A || 0), fullMark: 100 },
      { type: RIASEC_LABELS.S?.[locale] || 'S', value: normalize(vector.S || 0), fullMark: 100 },
      { type: RIASEC_LABELS.E?.[locale] || 'E', value: normalize(vector.E || 0), fullMark: 100 },
      { type: RIASEC_LABELS.C?.[locale] || 'C', value: normalize(vector.C || 0), fullMark: 100 },
    ];
  };

  const getSoftSkillsRadarData = () => {
    const vector = data?.test_results?.soft_skills?.soft_vector;
    if (!vector) return [];
    
    // Фиксированный порядок ключей Soft Skills (как в SoftSkillReport.tsx)
    const orderedKeys = ['comm', 'team', 'crit', 'creat', 'emot', 'unc'];
    const values = orderedKeys.map(key => vector[key] || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    const normalize = (value: number): number => {
      const z = (value - min) / (max - min + 0.0001);
      return Math.round((0.2 + 0.8 * z) * 100);
    };
    
    return [
      { type: SOFT_LABELS.comm?.[locale] || 'comm', value: normalize(vector.comm || 0), fullMark: 100 },
      { type: SOFT_LABELS.team?.[locale] || 'team', value: normalize(vector.team || 0), fullMark: 100 },
      { type: SOFT_LABELS.crit?.[locale] || 'crit', value: normalize(vector.crit || 0), fullMark: 100 },
      { type: SOFT_LABELS.creat?.[locale] || 'creat', value: normalize(vector.creat || 0), fullMark: 100 },
      { type: SOFT_LABELS.emot?.[locale] || 'emot', value: normalize(vector.emot || 0), fullMark: 100 },
      { type: SOFT_LABELS.unc?.[locale] || 'unc', value: normalize(vector.unc || 0), fullMark: 100 },
    ];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Spin size="large" />
        <div className="mt-4 text-gray-500">{t.careerReportPage.loadingReport}</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { student, spheres, professions, ai_resume, test_results } = data;
  const currentProfessions = educationLevel === 'higher' ? professions.higher : professions.tvet;

  return (
    <div className="career-report-page p-6 max-w-6xl mx-auto">
      {/* Шапка */}
      <Card className="mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate({ to: `/counselor/students/${student.id}/results` })}
          className="mb-4"
        >
          {t.careerReportPage.back}
        </Button>

        <div className="report-header">
          <div>
            <h1 className="text-2xl font-bold">{t.careerReportPage.careerReport}</h1>
            <h2 className="text-xl text-gray-600">{student.name}</h2>
            {student.classroom && (
              <p className="text-gray-500">
                {student.classroom.school?.name}, {student.classroom.name}
              </p>
            )}
            <p className="text-gray-400 text-sm">
              {t.careerReportPage.generatedAt}: {new Date(data.report.created_at).toLocaleDateString()}
            </p>
          </div>
          
          <div className="pdf-buttons">
            {!data.report.pdf_path ? (
              <Button 
                type="primary" 
                icon={<FilePdfOutlined />}
                onClick={generatePdf}
                loading={generatingPdf}
              >
                {t.careerReportPage.generatePdf}
              </Button>
            ) : (
              <>
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />}
                  onClick={downloadPdf}
                >
                  {t.careerReportPage.downloadPdf}
                </Button>
                <Button 
                  icon={<FilePdfOutlined />}
                  onClick={generatePdf}
                  loading={generatingPdf}
                  className="ml-2"
                >
                  {t.careerReportPage.updatePdf}
                </Button>
              </>
            )}
            <Button
              icon={<EditOutlined />}
              onClick={editSpheres}
              className="ml-2"
            >
              {t.careerReportPage.editSpheres}
            </Button>

            <Button 
              icon={<ReloadOutlined />}
              onClick={regenerateReport}
              className="ml-2"
              danger
            >
              {t.careerReportPage.regenerate}
            </Button>
          </div>
        </div>
      </Card>

      {/* Резюме */}
      <Card className="mb-4">
        <h2 className="text-xl font-semibold mb-4">{t.careerReportPage.resume}</h2>
        
        {ai_resume[locale] && (
          <div className="ai-resume-block mb-6">
            <p>{ai_resume[locale]}</p>
          </div>
        )}
        
          {/* RIASEC Chart */}
        {test_results.riasec && (
          <div className="chart-container mb-6">
            <h3 className="text-lg font-semibold mb-2">{t.careerReportPage.riasecProfile}</h3>
                <Tag color="blue" className="mb-2">
                  {t.careerReportPage.code}: {test_results.riasec.riasec_triplet}
                </Tag>
            <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={getRiasecRadarData()}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="type" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="RIASEC"
                      dataKey="value"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
          </div>
        )}
          
          {/* Soft Skills Chart */}
        {test_results.soft_skills && (
          <div className="chart-container mb-6">
            <h3 className="text-lg font-semibold mb-2">{t.careerReportPage.softSkills}</h3>
                <Tag color="green" className="mb-2">
                  {t.careerReportPage.top}: {test_results.soft_skills.soft_triplet}
                </Tag>
            <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={getSoftSkillsRadarData()}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="type" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Soft Skills"
                      dataKey="value"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
          </div>
        )}
        
        {/* High5 */}
        {test_results.high5 && test_results.high5.top5 && test_results.high5.top5.length > 0 && (
          <div className="high5-section mt-4">
            <h3 className="text-lg font-semibold mb-2">{t.careerReportPage.top5Strengths}</h3>
            <div className="high5-tags">
              {test_results.high5.top5.map((strength, idx) => {
                const label = HIGH5_LABELS[strength];
                return (
                <Tag key={idx} color="purple" className="high5-tag">
                    {label?.emoji} #{idx + 1} {label?.[locale] || strength}
                </Tag>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Сферы и профессии */}
      <Card className="mb-4">
        <div className="spheres-professions-header">
          <h2 className="text-xl font-semibold">{t.careerReportPage.recommendedSpheres}</h2>
          <div className="education-toggle">
            <span className={educationLevel === 'tvet' ? 'active' : ''}>{t.careerReportPage.tvetEducation}</span>
            <Switch 
              checked={educationLevel === 'higher'}
              onChange={(checked) => setEducationLevel(checked ? 'higher' : 'tvet')}
            />
            <span className={educationLevel === 'higher' ? 'active' : ''}>{t.careerReportPage.higherEducation}</span>
          </div>
        </div>
        
        <Collapse defaultActiveKey={spheres.map(s => s.id)}>
          {spheres.map((sphere, sphereIdx) => {
            const sphereData = currentProfessions[sphere.id];
            
            return (
              <Panel
                key={sphere.id}
                header={
                  <div className="sphere-panel-header">
                    <Tag color="blue">#{sphereIdx + 1}</Tag>
                    <span className="sphere-title">
                      {getLocalizedText({ ru: sphere.name_ru, kk: sphere.name_kk, en: sphere.name_en }, sphere.id)}
                    </span>
                  </div>
                }
              >
                {/* Reasoning */}
                {(sphere.reasoning_ru || sphere.reasoning_kk || sphere.reasoning_en) && (
                  <div className="sphere-reasoning-block mb-4">
                    <p>{getLocalizedText({
                      ru: sphere.reasoning_ru || '',
                      kk: sphere.reasoning_kk || '',
                      en: sphere.reasoning_en || '',
                    })}</p>
                  </div>
                )}
                
                {/* Профессии */}
                {sphereData?.professions?.length > 0 ? (
                  <div className="professions-list">
                    {sphereData.professions.map((prof, profIdx) => (
                      <Card key={prof.slug} size="small" className="profession-card">
                        <div className="profession-header">
                          <h4>
                            <Tag color="purple">{profIdx + 1}</Tag>
                            {getLocalizedText(prof.title)}
                          </h4>
                          <Tag>{Math.round(prof.similarity * 100)}% {t.careerReportPage.matchPercent}</Tag>
                        </div>
                        
                        <p className="profession-description">
                          {getLocalizedText(prof.description)}
                        </p>
                        
                        {prof.education && (
                          <div className="profession-education">
                            <div className="edu-item">
                              <strong>{t.careerReportPage.programsGroup}:</strong>{" "}
                              <a href={prof.education.group_url} target="_blank" rel="noopener noreferrer">
                                {prof.education.group_code} - {getLocalizedText(prof.education.group_name)}
                              </a>
                            </div>
                            
                            {prof.education.programs.length > 0 && (
                              <div className="edu-item">
                                <strong>{t.careerReportPage.programs}:</strong>
                                <ul>
                                  {prof.education.programs.slice(0, 3).map((p, i) => (
                                    <li key={i}>{p}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <div className="edu-item">
                              <strong>{t.careerReportPage.entSubjects}:</strong>{" "}
                              {getLocalizedText(prof.education.ent_subjects)}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    {educationLevel === 'higher' 
                      ? t.careerReportPage.noProfessionsHigher
                      : t.careerReportPage.noProfessionsCollege
                    }
                  </p>
                )}
              </Panel>
            );
          })}
        </Collapse>
      </Card>
    </div>
  );
};

