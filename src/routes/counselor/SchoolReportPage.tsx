import { useEffect, useState } from "react";
import { Card, Spin, App, Button, Select, DatePicker, Table, Empty, Collapse } from "antd";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeftOutlined, FileTextOutlined, DownloadOutlined } from "@ant-design/icons";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axiosClient from "../../api/axiosClient";
import Breadcrumb from "../../components/Breadcrumb";
import { useTranslation } from "../../hooks/useTranslation";
import dayjs from "dayjs";
import "./SchoolReportPage.css";

const { RangePicker } = DatePicker;

interface School {
  id: number;
  name: string;
  total_students: number;
  grades: {
    grade: string;
    classrooms: { id: number; name: string; student_count: number }[];
    total_students: number;
  }[];
  classrooms: { id: number; name: string; student_count: number }[];
}

interface ChartData {
  type: string;
  title: string;
  total?: number;
  total_selections?: number;
  data: {
    option_id?: string;
    sphere_id?: string;
    label: string;
    subjects?: string[];
    count: number;
    percentage: number;
  }[];
}

interface ReportData {
  header: {
    title: string;
    school: string;
    period: { from: string; to: string };
    type: string;
    subtitle?: string;
    student_count: number;
  };
  events_statistics: {
    type: string;
    label: { ru: string; kk: string; en: string };
    count: number;
  }[];
  survey_charts: Record<string, ChartData>;
  spheres_distribution: ChartData;
  ent_subjects: {
    pairs_table: { pair: string; count: number; percentage: number }[];
    top5_subjects: string[];
  };
  events_list: {
    date: string;
    type: string;
    title: string;
    description: string;
    classrooms: string;
  }[];
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF6B6B', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#DDA0DD'
];

export const SchoolReportPage = () => {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const [schools, setSchools] = useState<School[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  
  // Фильтры
  const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
  const [reportType, setReportType] = useState<'classroom' | 'parallel' | 'school'>('classroom');
  const [selectedClassroom, setSelectedClassroom] = useState<number | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { t, locale } = useTranslation();

  useEffect(() => {
    fetchAvailableReports();
  }, []);

  // Перегенерировать отчёт при смене языка
  useEffect(() => {
    if (report) {
      generateReport();
    }
  }, [locale]);

  const fetchAvailableReports = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get('/counselor/reports/available');
      setSchools(data.schools || []);
      
      if (data.schools?.length > 0) {
        setSelectedSchool(data.schools[0].id);
      }
    } catch (error: any) {
      message.error(t.schoolReportPage.loadError);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    
    try {
      let endpoint = '';
      const params = new URLSearchParams();
      params.append('locale', locale);
      
      if (dateRange) {
        params.append('date_from', dateRange[0].format('YYYY-MM-DD'));
        params.append('date_to', dateRange[1].format('YYYY-MM-DD'));
      }
      
      if (reportType === 'classroom' && selectedClassroom !== null) {
        endpoint = `/counselor/reports/classroom/${selectedClassroom}`;
      } else if (reportType === 'parallel' && selectedSchool !== null && selectedGrade !== null) {
        endpoint = `/counselor/reports/parallel/${selectedSchool}/${selectedGrade}`;
      } else if (reportType === 'school' && selectedSchool !== null) {
        endpoint = `/counselor/reports/school/${selectedSchool}`;
      } else {
        message.warning(t.schoolReportPage.selectReportParams);
        setGenerating(false);
        return;
      }
      
      const { data } = await axiosClient.get(`${endpoint}?${params.toString()}`);
      setReport(data);
    } catch (error: any) {
      message.error(error.response?.data?.message || t.schoolReportPage.generateError);
    } finally {
      setGenerating(false);
    }
  };

  const downloadPdf = async () => {
    setDownloadingPdf(true);
    
    try {
      let endpoint = '';
      const params = new URLSearchParams();
      params.append('locale', locale);
      
      if (dateRange) {
        params.append('date_from', dateRange[0].format('YYYY-MM-DD'));
        params.append('date_to', dateRange[1].format('YYYY-MM-DD'));
      }
      
      if (reportType === 'classroom' && selectedClassroom !== null) {
        endpoint = `/counselor/reports/classroom/${selectedClassroom}/pdf`;
      } else if (reportType === 'parallel' && selectedSchool !== null && selectedGrade !== null) {
        endpoint = `/counselor/reports/parallel/${selectedSchool}/${selectedGrade}/pdf`;
      } else if (reportType === 'school' && selectedSchool !== null) {
        endpoint = `/counselor/reports/school/${selectedSchool}/pdf`;
      } else {
        message.warning(t.schoolReportPage.generateReportFirst);
        setDownloadingPdf(false);
        return;
      }
      
      const response = await axiosClient.get(`${endpoint}?${params.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      message.success(t.schoolReportPage.pdfDownloadSuccess);
    } catch (error: any) {
      message.error(error.response?.data?.message || t.schoolReportPage.pdfDownloadError);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const currentSchool = schools.find(s => s.id === selectedSchool);

  const renderPieChart = (chartData: ChartData) => {
    if (!chartData?.data?.length) return <Empty description={t.schoolReportPage.noData} />;
    
    return (
      <div className="chart-wrapper">
        <h4>{chartData.title}</h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData.data}
              dataKey="percentage"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={100}
            >
              {chartData.data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string) => [`${value}%`, name]}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          {chartData.data.map((item, index) => (
            <div key={index} className="legend-item">
              <span className="legend-color" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="legend-label">{item.label}</span>
              <span className="legend-value">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSpheresChart = (chartData: ChartData) => {
    if (!chartData?.data?.length) return <Empty description={t.schoolReportPage.noData} />;
    
    return (
      <div className="chart-wrapper">
        <h4>{chartData.title}</h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData.data}
              dataKey="percentage"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={100}
            >
              {chartData.data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string) => [`${value}%`, name]}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="spheres-legend">
          {chartData.data.map((item, index) => (
            <div key={index} className="sphere-legend-item">
              <div className="sphere-header">
                <span className="legend-color" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="legend-label">{item.label}</span>
                <span className="legend-value">{item.percentage}%</span>
              </div>
              {item.subjects && item.subjects.length > 0 && (
                <div className="sphere-subjects">
                  {t.schoolReportPage.entSubjectsLabel}: {item.subjects.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBarChart = (chartData: ChartData, horizontal = false) => {
    if (!chartData?.data?.length) return <Empty description={t.schoolReportPage.noData} />;
    
    return (
      <div className="chart-wrapper">
        <h4>{chartData.title}</h4>
        <ResponsiveContainer width="100%" height={300}>
          {horizontal ? (
            <BarChart layout="vertical" data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} unit="%" tick={false} />
              <YAxis type="category" dataKey="label" width={150} tick={false} />
              <Tooltip 
                formatter={(value: number) => [`${value}%`]}
                labelFormatter={(label) => label}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <Bar dataKey="percentage">
                {chartData.data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <BarChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={false} />
              <YAxis domain={[0, 100]} unit="%" tick={false} />
              <Tooltip 
                formatter={(value: number) => [`${value}%`]}
                labelFormatter={(label) => label}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <Bar dataKey="percentage">
                {chartData.data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
        <div className="chart-legend">
          {chartData.data.map((item, index) => (
            <div key={index} className="legend-item">
              <span className="legend-color" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="legend-label">{item.label}</span>
              <span className="legend-value">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="school-report-page p-6 max-w-6xl mx-auto">
      <Card className="mb-4">
        <Breadcrumb routes={[{ name: t.nav.schoolReports }]} />

        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => window.history.back()}
          className="mb-4"
        >
          {t.schoolReportPage.back}
        </Button>

        <h1 className="text-2xl font-bold mb-4">{t.schoolReportPage.title}</h1>
        
        {/* Фильтры */}
        <div className="filters-grid">
          <div className="filter-item">
            <label>{t.schoolReportPage.school}</label>
            <Select
              style={{ width: '100%' }}
              value={selectedSchool}
              onChange={setSelectedSchool}
              options={schools.map(s => ({ value: s.id, label: s.name }))}
            />
          </div>
          
          <div className="filter-item">
            <label>{t.schoolReportPage.reportType}</label>
            <Select
              style={{ width: '100%' }}
              value={reportType}
              onChange={(val) => {
                setReportType(val);
                setSelectedClassroom(null);
                setSelectedGrade(null);
              }}
              options={[
                { value: 'classroom', label: t.schoolReportPage.byClassroom },
                { value: 'parallel', label: t.schoolReportPage.byParallel },
                { value: 'school', label: t.schoolReportPage.bySchool },
              ]}
            />
          </div>
          
          {reportType === 'classroom' && currentSchool && (
            <div className="filter-item">
              <label>{t.schoolReportPage.classroom}</label>
              <Select
                style={{ width: '100%' }}
                value={selectedClassroom}
                onChange={setSelectedClassroom}
                options={currentSchool.classrooms.map(c => ({
                  value: c.id,
                  label: `${c.name} (${c.student_count} ${t.schoolReportPage.studentsCount})`
                }))}
                placeholder={t.schoolReportPage.selectClassroom}
              />
            </div>
          )}
          
          {reportType === 'parallel' && currentSchool && (
            <div className="filter-item">
              <label>{t.schoolReportPage.parallel}</label>
              <Select
                style={{ width: '100%' }}
                value={selectedGrade}
                onChange={setSelectedGrade}
                options={currentSchool.grades.map(g => ({
                  value: g.grade,
                  label: `${g.grade} ${t.schoolReportPage.classesWord} (${g.total_students} ${t.schoolReportPage.studentsCount})`
                }))}
                placeholder={t.schoolReportPage.selectParallel}
              />
            </div>
          )}
          
          <div className="filter-item">
            <label>{t.schoolReportPage.period}</label>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              placeholder={[t.schoolReportPage.startDate, t.schoolReportPage.endDate]}
              popupClassName="compact-date-popup"
              placement="bottomLeft"
            />
          </div>
          
          <div className="filter-item filter-actions">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>              <Button
                type="primary"
                icon={<FileTextOutlined />}
                onClick={generateReport}
                loading={generating}
              >
                {t.schoolReportPage.generateReport}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Отчёт */}
      {report && (
        <>
          {/* Шапка отчёта */}
          <Card className="mb-4 report-header-card">
            <div className="report-header-content">
              <div>
                <h2>{report.header.title}</h2>
                <div className="report-meta">
                  <p><strong>{t.schoolReportPage.schoolLabel}:</strong> {report.header.school}</p>
                  <p><strong>{t.schoolReportPage.periodLabel}:</strong> {report.header.period.from} — {report.header.period.to}</p>
                  {report.header.subtitle && <p><strong>{t.schoolReportPage.classParallelLabel}:</strong> {report.header.subtitle}</p>}
                  <p><strong>{t.schoolReportPage.studentCountLabel}:</strong> {report.header.student_count}</p>
                </div>
              </div>
              <div className="report-actions">
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={downloadPdf}
                  loading={downloadingPdf}
                >
                  {t.schoolReportPage.downloadPdf}
                </Button>
              </div>
            </div>
          </Card>

          {/* Статистика мероприятий */}
          <Card className="mb-4">
            <h3 className="text-xl font-semibold mb-4">{t.schoolReportPage.eventsStatistics}</h3>
            <Table
              dataSource={report.events_statistics.map(item => ({
                ...item,
                displayLabel: item.label?.[locale as keyof typeof item.label] || item.label?.ru || item.type,
              }))}
              columns={[
                {
                  title: t.schoolReportPage.eventType,
                  dataIndex: 'displayLabel',
                  key: 'type',
                },
                {
                  title: t.schoolReportPage.count,
                  dataIndex: 'count',
                  key: 'count',
                  align: 'center',
                },
              ]}
              pagination={false}
              rowKey="type"
            />
          </Card>

          {/* Диаграммы опроса */}
          <Card className="mb-4">
            <h3 className="text-xl font-semibold mb-4">{t.schoolReportPage.surveyResults}</h3>
            
            <div className="charts-grid">
              {report.survey_charts.plans_after_school && (
                <div className="chart-card">
                  {renderPieChart(report.survey_charts.plans_after_school)}
                </div>
              )}
              
              {report.survey_charts.study_location && (
                <div className="chart-card">
                  {renderPieChart(report.survey_charts.study_location)}
                </div>
              )}
              
              {report.survey_charts.criteria_choice && (
                <div className="chart-card">
                  {renderPieChart(report.survey_charts.criteria_choice)}
                </div>
              )}
              
              {report.survey_charts.profession_decided && (
                <div className="chart-card">
                  {renderBarChart(report.survey_charts.profession_decided)}
                </div>
              )}
              
              {report.survey_charts.opinion_matters && (
                <div className="chart-card chart-card-wide">
                  {renderBarChart(report.survey_charts.opinion_matters, true)}
                </div>
              )}
            </div>
          </Card>

          {/* Распределение по сферам */}
          <Card className="mb-4">
            <h3 className="text-xl font-semibold mb-4">{t.schoolReportPage.recommendedSpheres}</h3>
            {renderSpheresChart(report.spheres_distribution)}
          </Card>

          {/* Предметы ЕНТ */}
          <Card className="mb-4">
            <h3 className="text-xl font-semibold mb-4">{t.schoolReportPage.entSubjects}</h3>
            
            {report.ent_subjects.pairs_table.length > 0 && (
              <Table
                dataSource={report.ent_subjects.pairs_table}
                columns={[
                  {
                    title: t.schoolReportPage.subjectPair,
                    dataIndex: 'pair',
                    key: 'pair',
                  },
                  {
                    title: t.schoolReportPage.percentage,
                    dataIndex: 'percentage',
                    key: 'percentage',
                    align: 'center',
                    render: (val) => `${val}%`,
                  },
                ]}
                pagination={false}
                rowKey="pair"
                className="mb-4"
              />
            )}
            
            {report.ent_subjects.top5_subjects.length > 0 && (
              <div className="top5-subjects">
                <h4>{t.schoolReportPage.top5Subjects}:</h4>
                <ol>
                  {report.ent_subjects.top5_subjects.map((subject, idx) => (
                    <li key={idx}>{subject}</li>
                  ))}
                </ol>
              </div>
            )}
          </Card>

          {/* Приложение: Список мероприятий */}
          <Collapse 
            className="mb-4"
            items={[
              {
                key: 'events',
                label: t.schoolReportPage.appendixEventsList,
                children: (
                  <Table
                    dataSource={report.events_list.map((event, idx) => ({ ...event, _key: `${event.date}-${event.type}-${idx}` }))}
                    columns={[
                      { title: t.schoolReportPage.date, dataIndex: 'date', key: 'date', width: 100 },
                      { title: t.schoolReportPage.type, dataIndex: 'type', key: 'type', width: 150 },
                      { title: t.schoolReportPage.eventTitle, dataIndex: 'title', key: 'title' },
                      { title: t.schoolReportPage.description, dataIndex: 'description', key: 'description' },
                      { title: t.schoolReportPage.classroom || 'Класс', dataIndex: 'classrooms', key: 'classrooms', width: 120 },
                    ]}
                    pagination={{ pageSize: 20 }}
                    rowKey="_key"
                  />
                ),
              },
            ]}
          />
        </>
      )}
    </div>
  );
};

