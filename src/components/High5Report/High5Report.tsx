import { useEffect, useState } from "react";
import { Card, Spin, App, Table, Tag, Alert, Button, Collapse } from "antd";
import { useNavigate } from "@tanstack/react-router";
import axiosClient from "../../api/axiosClient";
import { useTranslation } from "../../hooks/useTranslation";
import "./High5Report.css";

const { Panel } = Collapse;

interface StrengthScore {
  raw: number;
  score: number;
  rank: number;
  median_latency: number;
}

interface InstructionCheck {
  control_id: string;
  expected: number;
  actual: number | null;
  passed: boolean;
}

interface Quality {
  instruction_checks_passed: number;
  instruction_checks: InstructionCheck[];
  straightlining_flag: boolean;
  randomness_flag: boolean;
  time_flags: string[];
  long_pauses_count: number;
  overall_status: "ok" | "warning" | "fail";
}

interface High5Result {
  scores: Record<string, StrengthScore>;
  top5: string[];
  quality: Quality;
  timing: {
    total_time_sec: number;
    active_time_ms: number;
  };
}

interface High5ReportData {
  session: {
    id: string;
    user_id: number;
    status: string;
    locale: string;
    completed_at: string;
    total_time_sec: number;
    active_time_ms: number;
  };
  student: {
    id: number;
    name: string;
    email: string;
  };
  result: High5Result;
}

interface Props {
  sessionId: string;
  mode?: "counselor" | "student"; // counselor показывает метрики, student - нет
}

// Эмодзи и буквы для сил (не переводятся)
const STRENGTH_ICONS: Record<string, { emoji: string; letter: string }> = {
  Thinker: { emoji: "💡", letter: "T" },
  ProblemSolver: { emoji: "🧩", letter: "P" },
  Strategist: { emoji: "♟️", letter: "S" },
  Philomath: { emoji: "📚", letter: "P" },
  Coach: { emoji: "🧭", letter: "C" },
  Empathizer: { emoji: "💞", letter: "E" },
  Storyteller: { emoji: "📖", letter: "S" },
  Catalyst: { emoji: "⚡", letter: "C" },
  Believer: { emoji: "🌱", letter: "B" },
  SelfBeliever: { emoji: "🚀", letter: "S" }
};

export const High5Report = ({ sessionId, mode = "counselor" }: Props) => {
  const [data, setData] = useState<High5ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [developmentOpen, setDevelopmentOpen] = useState(false);
  const [delegationOpen, setDelegationOpen] = useState(false);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Helper для получения информации о силе
  const getStrengthInfo = (key: string) => {
    const translations = t.high5Report.strengths[key as keyof typeof t.high5Report.strengths];
    const icons = STRENGTH_ICONS[key];
    return translations && icons ? {
      title: translations.title,
      slogan: translations.slogan,
      description: translations.description,
      emoji: icons.emoji,
      letter: icons.letter
    } : null;
  };

  useEffect(() => {
    fetchData();
  }, [sessionId, mode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (mode === "student") {
        // Для студента используем другой endpoint
        const { data: response } = await axiosClient.get(
          `/student/high5/sessions/${sessionId}/result`
        );
        // Преобразуем формат ответа студента в формат компонента
        setData({
          session: {
            id: response.session_id,
            user_id: 0,
            status: response.status,
            locale: 'ru',
            completed_at: response.completed_at,
            total_time_sec: response.result.timing.total_time_sec,
            active_time_ms: response.result.timing.active_time_ms,
          },
          student: {
            id: 0,
            name: '',
            email: '',
          },
          result: response.result,
        });
      } else {
        // Для ориентатора
        const { data: response } = await axiosClient.get(
          `/counselor/high5/sessions/${sessionId}/details`
        );
        setData(response);
      }
    } catch (error: any) {
      message.error(t.high5Report.errorLoading);
    } finally {
      setLoading(false);
    }
  };

  const getProfileCode = () => {
    if (!data) return "";
    const top3 = data.result.top5.slice(0, 3);
    return top3.map(s => STRENGTH_ICONS[s]?.letter || s[0]).join("");
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const countLongPauses = () => {
    if (!data) return 0;
    // Используем значение с бэкенда, где считаются прерывания > 60 сек между ответами
    return data.result.quality.long_pauses_count || 0;
  };

  const getControlChecksFailed = () => {
    if (!data?.result.quality.instruction_checks) {
      // Fallback на старую логику
      return 4 - (data?.result.quality.instruction_checks_passed || 0);
    }
    
    // Считаем количество failed проверок
    return data.result.quality.instruction_checks.filter(check => !check.passed).length;
  };

  const getStatusTag = (status: string, value?: any, threshold?: any) => {
    if (status === "ok" || status === "Норма") {
      return <Tag color="success">{t.high5Report.statusOk}</Tag>;
    } else {
      return <Tag color="error">{t.high5Report.statusFail}</Tag>;
    }
  };

  const renderStrength = (strengthKey: string, showDescription: boolean = true) => {
    const info = getStrengthInfo(strengthKey);
    if (!info) return null;

    return (
      <Card key={strengthKey} className="strength-card mb-4">
        <div className="strength-header">
          <span className="strength-emoji">{info.emoji}</span>
          <div className="strength-info">
            <h3 className="strength-title">{info.title}</h3>
            <p className="strength-slogan">{info.slogan}</p>
          </div>
        </div>
        {showDescription && (
          <p className="strength-description">{info.description}</p>
        )}
      </Card>
    );
  };

  const getDevelopmentZones = () => {
    if (!data) return [];
    const sortedByRank = Object.entries(data.result.scores)
      .sort(([, a], [, b]) => a.rank - b.rank);
    // Зоны развития: места 4-7
    return sortedByRank.slice(3, 7).map(([key]) => key);
  };

  const getDelegationZones = () => {
    if (!data) return [];
    const sortedByRank = Object.entries(data.result.scores)
      .sort(([, a], [, b]) => a.rank - b.rank);
    // Зоны делегирования: места 8-10
    return sortedByRank.slice(7, 10).map(([key]) => key);
  };

  const getAllStrengthsSorted = () => {
    if (!data) return [];
    // Все 10 сил, отсортированные по рангу
    return Object.entries(data.result.scores)
      .sort(([, a], [, b]) => a.rank - b.rank)
      .map(([key]) => key);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Spin size="large" />
        <div className="mt-4 text-gray-500">{t.high5Report.loading}</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const controlChecksFailed = getControlChecksFailed();
  const longPauses = countLongPauses();
  const isReliable = data.result.quality.overall_status === "ok";

  // В High5 4 контрольных вопроса. По ТЗ: если 2+ ошибок = fail
  // instruction_checks_passed < 2 = fail на бэкенде, значит:
  // 0-1 ошибка = ok (3-4 прошло), 2+ ошибок = fail (< 2 прошло)
  const getControlChecksStatus = () => {
    if (controlChecksFailed < 2) {
      return getStatusTag("ok", null, null);
    } else {
      return getStatusTag("fail", null, null);
    }
  };

  const getLongPausesStatus = () => {
    if (longPauses < 5) {
      return getStatusTag("ok", null, null);
    } else if (longPauses < 10) {
      return getStatusTag("warning", null, null);
    } else {
      return getStatusTag("fail", null, null);
    }
  };

  // Проверка времени: < 5 минут (300 сек) = warning, также учитываем time_flags с бэкенда
  const getTimeStatus = () => {
    const totalTimeSec = data.session.total_time_sec;
    const minTotalTimeSec = 300; // 5 минут - порог с бэкенда
    const hasTimeFlags = data.result.quality.time_flags && data.result.quality.time_flags.length > 0;
    
    if (totalTimeSec < minTotalTimeSec || hasTimeFlags) {
      return getStatusTag("warning", null, null);
    }
    return getStatusTag("ok", null, null);
  };

  // Статус прокликивания
  const getStraightliningStatus = () => {
    if (data.result.quality.straightlining_flag) {
      return getStatusTag("fail", null, null);
    }
    return getStatusTag("ok", null, null);
  };

  const metricsData = [
    {
      key: "time",
      metric: t.high5Report.timeSpent,
      value: formatTime(data.session.total_time_sec),
      status: getTimeStatus()
    },
    {
      key: "control",
      metric: t.high5Report.controlDiscrepancies,
      value: controlChecksFailed,
      status: getControlChecksStatus()
    },
    {
      key: "straightlining",
      metric: t.riasecReport.straightlining,
      value: data.result.quality.straightlining_flag ? '2+' : '0',
      status: getStraightliningStatus()
    }
  ];

  const metricsColumns = [
    {
      title: t.high5Report.metricColumn,
      dataIndex: "metric",
      key: "metric",
    },
    {
      title: t.high5Report.valueColumn,
      dataIndex: "value",
      key: "value",
    },
    {
      title: t.high5Report.statusColumn,
      dataIndex: "status",
      key: "status",
    },
  ];

  const showReliabilityBadge = mode === "student";

  return (
    <div className="high5-report">
      {mode === "student" && isReliable && (
        <Alert
          title={t.high5Report.resultReliable}
          type="success"
          showIcon
          className="mb-4"
        />
      )}
      
      {!isReliable && mode !== "student" && (
        <Alert
          title={t.high5Report.unreliableResults}
          type="warning"
          showIcon
          className="mb-4"
        />
      )}

      <Card className="profile-card mb-4">
        <h2 className="profile-title">
          {mode === "student" 
            ? t.high5Report.yourSuperPowers 
            : `${t.high5Report.yourProfile}: ${getProfileCode()} (${t.high5Report.top3})`
          }
        </h2>
        <p className="profile-description">
          {t.high5Report.profileDescription}
        </p>
      </Card>

      <div className="strengths-list">
        {data.result.top5.slice(0, 3).map(strength =>
          renderStrength(strength, true)
        )}
      </div>

      <div className="zones-section mb-4">
        <Collapse 
          ghost 
          activeKey={developmentOpen ? ['development'] : []}
          onChange={(keys) => setDevelopmentOpen(keys.includes('development'))}
        >
          <Panel header={t.high5Report.developmentZones} key="development">
            {getDevelopmentZones().map(strength => renderStrength(strength, false))}
          </Panel>
        </Collapse>

        <Collapse 
          ghost 
          activeKey={delegationOpen ? ['delegation'] : []}
          onChange={(keys) => setDelegationOpen(keys.includes('delegation'))}
        >
          <Panel header={t.high5Report.delegationZones} key="delegation">
            {getDelegationZones().map(strength => renderStrength(strength, false))}
          </Panel>
        </Collapse>
      </div>

      <div className="text-center mb-4">
        <Button onClick={() => {
          const newShowAll = !showAll;
          setShowAll(newShowAll);
          // При нажатии "Смотреть все" раскрываем обе секции
          if (newShowAll) {
            setDevelopmentOpen(true);
            setDelegationOpen(true);
          } else {
            setDevelopmentOpen(false);
            setDelegationOpen(false);
          }
        }}>
          {showAll ? t.high5Report.collapse : t.high5Report.viewAll}
        </Button>
      </div>

      {!isReliable && mode !== "student" && (
        <Alert
          title={t.high5Report.unreliableResults}
          type="warning"
          showIcon
          className="mb-4"
        />
      )}

      {mode === "counselor" && (
        <Card className="metrics-card">
          <h3 className="metrics-title">{t.high5Report.metrics}</h3>
          <Table
            columns={metricsColumns}
            dataSource={metricsData}
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {mode === "student" && (
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Button 
            type="primary" 
            size="large"
            onClick={() => navigate({ to: "/student/tests" })}
          >
            {t.high5Report.backToTests}
          </Button>
        </div>
      )}
    </div>
  );
};

