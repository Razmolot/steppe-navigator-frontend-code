import { useEffect, useState } from "react";
import { Card, Spin, App, Button, Tag, Collapse, Switch, Empty } from "antd";
import { useNavigate } from "@tanstack/react-router";
import { DownloadOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import axiosClient from "../../api/axiosClient";
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
  has_report: boolean;
  report?: {
    id: string;
    status: string;
    created_at: string;
    pdf_path?: string;
  };
  spheres?: Sphere[];
  professions?: {
    higher: Record<string, SphereWithProfessions>;
    tvet: Record<string, SphereWithProfessions>;
  };
  ai_resume?: {
    ru: string;
    kk: string;
    en: string;
  };
  test_results?: {
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

export const StudentCareerReportPage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [educationLevel, setEducationLevel] = useState<'higher' | 'tvet'>('higher');
  
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { t, locale } = useTranslation();

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const { data: response } = await axiosClient.get('/student/career/report');
      setData(response);
    } catch (error: any) {
      message.error(t.careerReportPage.errorLoading);
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedText = (obj: Record<string, string> | undefined, fallback = "") => {
    if (!obj) return fallback;
    return obj[locale] || obj.ru || obj.en || fallback;
  };

  const getRiasecRadarData = () => {
    const vector = data?.test_results?.riasec?.riasec_vector;
    if (!vector) return [];
    
    const values = Object.values(vector);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return Object.entries(vector).map(([key, value]) => {
      const z = (value - min) / (max - min + 0.0001);
      const normalized = Math.round((0.2 + 0.8 * z) * 100);
      
      return {
        type: RIASEC_LABELS[key]?.[locale] || key,
        value: normalized,
        fullMark: 100,
      };
    });
  };

  const getSoftSkillsRadarData = () => {
    const vector = data?.test_results?.soft_skills?.soft_vector;
    if (!vector) return [];
    
    const values = Object.values(vector);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return Object.entries(vector).map(([key, value]) => {
      const z = (value - min) / (max - min + 0.0001);
      const normalized = Math.round((0.2 + 0.8 * z) * 100);
      
      return {
        type: SOFT_LABELS[key]?.[locale] || key,
        value: normalized,
        fullMark: 100,
      };
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Spin size="large" />
        <div className="mt-4 text-gray-500">{t.careerReportPage.loadingReport}</div>
      </div>
    );
  }

  if (!data?.has_report) {
    return (
      <div className="student-career-report-page p-6 max-w-4xl mx-auto">
        <Card>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate({ to: "/student/tests" })}
            className="mb-4"
          >
            {t.studentCareerReportPage.toTests}
          </Button>
          
          <Empty
            description={
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">{t.studentCareerReportPage.reportNotReady}</h2>
                <p className="text-gray-500">
                  {t.studentCareerReportPage.reportNotReadyDesc}
                </p>
              </div>
            }
          />
        </Card>
      </div>
    );
  }

  const { report, spheres, professions, ai_resume, test_results } = data;
  const currentProfessions = educationLevel === 'higher' ? professions?.higher : professions?.tvet;

  return (
    <div className="student-career-report-page p-6 max-w-4xl mx-auto">
      {/* Шапка */}
      <Card className="mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate({ to: "/student/tests" })}
          className="mb-4"
        >
          {t.studentCareerReportPage.toTests}
        </Button>

        <div className="report-header">
          <div>
            <h1 className="text-2xl font-bold">{t.studentCareerReportPage.careerReport}</h1>
            <p className="text-gray-400 text-sm mt-2">
              {t.studentCareerReportPage.date}: {report && new Date(report.created_at).toLocaleDateString()}
            </p>
          </div>
          
          <Button 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={async () => {
              try {
                const response = await axiosClient.get('/student/career/report/pdf', {
                  params: { locale },
                  responseType: 'blob'
                });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'my_career_report.pdf');
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
              } catch (error) {
                message.error(t.studentCareerReportPage.downloadPdfError);
              }
            }}
          >
            {t.studentCareerReportPage.downloadPdf}
          </Button>
        </div>
      </Card>

      {/* Резюме */}
      <Card className="mb-4">
        <h2 className="text-xl font-semibold mb-4">{t.studentCareerReportPage.aboutYou}</h2>
        
        {ai_resume && ai_resume[locale] && (
          <div className="ai-resume-block mb-6">
            <p>{ai_resume[locale]}</p>
          </div>
        )}
        
        <div className="charts-grid">
          {/* RIASEC Chart */}
          {test_results?.riasec && (
            <div className="chart-container">
              <h3 className="text-lg font-semibold mb-2">{t.studentCareerReportPage.yourRiasec}</h3>
              <Tag color="blue" className="mb-2">
                {t.studentCareerReportPage.code}: {test_results.riasec.riasec_triplet}
              </Tag>
              <ResponsiveContainer width="100%" height={280}>
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
          {test_results?.soft_skills && (
            <div className="chart-container">
              <h3 className="text-lg font-semibold mb-2">{t.studentCareerReportPage.yourSoftSkills}</h3>
              <Tag color="green" className="mb-2">
                {t.studentCareerReportPage.top}: {test_results.soft_skills.soft_triplet}
              </Tag>
              <ResponsiveContainer width="100%" height={280}>
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
        </div>
        
        {/* High5 */}
        {test_results?.high5 && (
          <div className="high5-section mt-4">
            <h3 className="text-lg font-semibold mb-2">{t.studentCareerReportPage.yourSuperPowers}</h3>
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
      {spheres && professions && (
        <Card className="mb-4">
          <div className="spheres-professions-header">
            <h2 className="text-xl font-semibold">{t.studentCareerReportPage.suitableSpheres}</h2>
            <div className="education-toggle">
              <span className={educationLevel === 'tvet' ? 'active' : ''}>{t.studentCareerReportPage.college}</span>
              <Switch 
                checked={educationLevel === 'higher'}
                onChange={(checked) => setEducationLevel(checked ? 'higher' : 'tvet')}
              />
              <span className={educationLevel === 'higher' ? 'active' : ''}>{t.studentCareerReportPage.university}</span>
            </div>
          </div>
          
          <Collapse defaultActiveKey={spheres.map(s => s.id)}>
            {spheres.map((sphere, sphereIdx) => {
              const sphereData = currentProfessions?.[sphere.id];
              
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
                          </div>
                          
                          <p className="profession-description">
                            {getLocalizedText(prof.description)}
                          </p>
                          
                          {prof.education && (
                            <div className="profession-education">
                              <div className="edu-item">
                                <strong>{t.studentCareerReportPage.programsGroup}:</strong>{" "}
                                <a href={prof.education.group_url} target="_blank" rel="noopener noreferrer">
                                  {prof.education.group_code} - {getLocalizedText(prof.education.group_name)}
                                </a>
                              </div>
                              
                              {prof.education.programs.length > 0 && (
                                <div className="edu-item">
                                  <strong>{t.studentCareerReportPage.programs}:</strong>
                                  <ul>
                                    {prof.education.programs.slice(0, 3).map((p, i) => (
                                      <li key={i}>{p}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              <div className="edu-item">
                                <strong>{t.studentCareerReportPage.entSubjects}:</strong>{" "}
                                {getLocalizedText(prof.education.ent_subjects)}
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      {t.studentCareerReportPage.noProfessions
                        .replace('{level}', educationLevel === 'higher' 
                          ? t.studentCareerReportPage.higherEducation 
                          : t.studentCareerReportPage.collegeEducation)}
                    </p>
                  )}
                </Panel>
              );
            })}
          </Collapse>
        </Card>
      )}
    </div>
  );
};

