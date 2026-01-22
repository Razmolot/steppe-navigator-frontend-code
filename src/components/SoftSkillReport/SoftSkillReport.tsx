import { useEffect, useState } from "react";
import { Card, Spin, App, Table, Tag, Alert, Collapse } from "antd";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import axiosClient from "../../api/axiosClient";
import { useTranslation } from "../../hooks/useTranslation";
import "./SoftSkillReport.css";

const { Panel } = Collapse;

interface SoftVector {
  comm: number;
  team: number;
  crit: number;
  creat: number;
  unc: number;
  emot: number;
}

interface QualityCheckDetail {
  status: 'ok' | 'warning' | 'fail';
  message?: string;
  count?: number;
  checked?: number;
  discrepancies?: number;
  flags_count?: number;
}

interface SoftResult {
  soft_vector: SoftVector;
  soft_triplet: string;
  quality_flags: string[];
  quality_details?: {
    control_internals?: QualityCheckDetail;
    straightlining?: QualityCheckDetail;
    randomness?: QualityCheckDetail;
    timing?: QualityCheckDetail;
    total_time?: QualityCheckDetail;
    long_pauses_count?: number;
  };
}

interface SoftSkillReportData {
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
  result: SoftResult;
}

interface Props {
  sessionId: string;
  mode?: "student" | "counselor";
}

// Данные о типах soft skills из ТЗ
const SOFT_SKILL_INFO: Record<string, {
  title: { ru: string; kk: string };
  studentDescription: { ru: string; kk: string };
  counselorDescription: { ru: string; kk: string };
}> = {
  comm: {
    title: { ru: "Коммуникация", kk: "Коммуникация" },
    studentDescription: {
      ru: "Я умею ясно объяснять мысли, задавать вопросы и слушать других так, чтобы понимать.",
      kk: "Мен өз ойымды анық жеткізе аламын, сұрақ қоя аламын және басқаларды түсіне отырып тыңдаймын."
    },
    counselorDescription: {
      ru: "Ученик предпочитает прояснять задачи через разговор, уточнять детали и договариваться с другими. Ему ближе действие через общение, а не в одиночку. Иногда может уделять больше внимания обсуждению, чем выполнению дела.",
      kk: "Оқушы тапсырмаларды әңгіме арқылы нақтылап, егжей-тегжейін анықтап және басқалармен келісуді жөн көреді. Ол жалғыз жұмыс істеуден гөрі байланыс арқылы әрекет етуді қалайды. Кейде істі орындаудан гөрі талқылауға көбірек көңіл бөледі."
    }
  },
  team: {
    title: { ru: "Командная работа", kk: "Топпен жұмыс" },
    studentDescription: {
      ru: "Я умею сотрудничать, делить задачи и поддерживать общий ритм, чтобы у всех получилось.",
      kk: "Мен бірлесіп жұмыс істеймін, тапсырмаларды бөлісемін және барлығына ыңғайлы қарқын ұстаймын."
    },
    counselorDescription: {
      ru: "Ученик чаще выбирает совместные действия, распределяет роли и старается, чтобы всем было удобно. Ему важно чувство общей цели и поддержка внутри группы. Иногда может уступать инициативу ради согласия.",
      kk: "Оқушы жиі бірлескен әрекетті таңдап, рөлдерді бөліп және барлығына ыңғайлы болуына тырысады. Оған ортақ мақсат пен топ ішіндегі қолдау маңызды. Кейде келісім үшін бастаманы беріп қоюы мүмкін."
    }
  },
  crit: {
    title: { ru: "Системное мышление", kk: "Жүйелі ойлау" },
    studentDescription: {
      ru: "Я умею разложить задачу на части, увидеть связи и найти главное, с чего начать.",
      kk: "Мен тапсырманы бөліктерге бөліп, байланыстарды көріп, неден бастау керегін анықтай аламын."
    },
    counselorDescription: {
      ru: "Ученик предпочитает действовать через анализ: разбирается в структуре, ищет закономерности, планирует шаги. Ему важно понимать систему целиком, прежде чем перейти к делу. Иногда может задержаться на этапе размышлений.",
      kk: "Оқушы талдау арқылы әрекет етуді жөн көреді: құрылымды түсініп, заңдылықтарды іздеп және қадамдарды жоспарлайды. Ол іске кіріспес бұрын жүйені толық түсінгісі келеді. Кейде ұзақ ойлану кезеңінде кідіріп қалады."
    }
  },
  creat: {
    title: { ru: "Креативность", kk: "Шығармашылық" },
    studentDescription: {
      ru: "Я придумываю новые идеи и ищу необычные способы сделать привычные вещи по-другому.",
      kk: "Мен жаңа идеялар ойлап табамын және таныс нәрселерді өзгеше жасаудың жолын іздеймін."
    },
    counselorDescription: {
      ru: "Ученик предпочитает действовать через поиск новых идей и необычных решений. Ему ближе свобода выбора и возможность проявить себя. Может терять интерес к рутинным заданиям, если они не дают пространства для выдумки.",
      kk: "Оқушы жаңа идеялар мен ерекше шешімдер іздеу арқылы әрекет етуді жөн көреді. Ол үшін еркіндік пен өзін көрсету мүмкіндігі маңызды. Шығармашылыққа орын жоқ тапсырмалар оған қызықсыз болуы мүмкін."
    }
  },
  emot: {
    title: { ru: "Эмоциональный интеллект", kk: "Эмоциялық интеллект" },
    studentDescription: {
      ru: "Я замечаю чувства — свои и чужие — и умею подстраивать общение, чтобы всем было комфортно.",
      kk: "Мен өзімнің және басқалардың сезімін байқаймын және бәріне жайлы болатындай сөйлесуді реттеймін."
    },
    counselorDescription: {
      ru: "Ученик предпочитает действовать с оглядкой на чувства других, стремится сохранить спокойную атмосферу и понимание в группе. Ему ближе мягкое влияние, чем прямое давление. Иногда может избегать острых тем, чтобы не задеть никого.",
      kk: "Оқушы басқалардың сезімін ескеріп әрекет етуді жөн көреді, топта тыныш және түсіністік атмосфера сақтауға тырысады. Ол үшін тікелей қысымнан гөрі жұмсақ әсер ету тән. Кейде ешкімнің көңілі қалмас үшін өткір тақырыптардан қашады."
    }
  },
  unc: {
    title: { ru: "Работа в условиях неопределённости", kk: "Белгісіз жағдайда жұмыс" },
    studentDescription: {
      ru: "Я не пугаюсь, когда всё непонятно: пробую варианты, учусь на ошибках и двигаюсь дальше.",
      kk: "Барлығы түсініксіз болғанда қорықпаймын: нұсқаларды байқап көремін, қателіктен үйренемін және алға жылжимын."
    },
    counselorDescription: {
      ru: "Ученик предпочитает пробовать и действовать даже без полной ясности. Ему ближе подход «разберусь по ходу», чем долгие обсуждения. Иногда может менять направление, если результат не виден сразу.",
      kk: "Оқушы толық түсініксіз болса да іс жүзінде сынап, әрекет етуді жөн көреді. Ол үшін «жолай түсінемін» тәсілі ұзақ талқылаудан гөрі ыңғайлы. Нәтиже бірден көрінбесе, бағытын өзгертуі мүмкін."
    }
  }
};

// Данные о "попробовать уже сейчас"
const TRY_NOW_TASKS: Record<string, { ru: string; kk: string }> = {
  comm: {
    ru: "Собери 10-мин созвон: цель, роли, следующий шаг; вышли мини-резюме в чат",
    kk: "10 минуттық қоңырау жина: мақсат, рөлдер, келесі қадам; мини-резюмені чатқа жібер"
  },
  team: {
    ru: "Соберись с друзьями и сделайте вместе что-то небольшое: плакат, видео или презентацию",
    kk: "Достарыңмен бірігіп, кішкентай бір нәрсе жаса: плакат, бейне немесе презентация"
  },
  crit: {
    ru: "Нарисуй блок-схему задачи и найди «узкое горлышко»; сделай чек-лист",
    kk: "Тапсырманың блок-сызбасын сыз және «тар жерін» тап; тексеру тізімін жаса"
  },
  creat: {
    ru: "Сделай альтернативный формат объяснения темы (комикс/лента/аудио)",
    kk: "Тақырыпты түсіндірудің баламалы форматын жаса (комикс/таспа/аудио)"
  },
  emot: {
    ru: "Подумай о том, что чувствует другой человек в конфликте, и предложи решение с учетом всех",
    kk: "Жанжалда басқа адам не сезінетінін ойла және барлығын ескеріп шешім ұсын"
  },
  unc: {
    ru: "Выбери самую рисковую гипотезу и проверь её за день (мини-проба/прототип)",
    kk: "Ең тәуекелді болжамды таңда және оны бір күнде тексер (мини-сынақ/прототип)"
  }
};

export const SoftSkillReport = ({ sessionId, mode = "counselor" }: Props) => {
  const [data, setData] = useState<SoftSkillReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();
  const { t, locale } = useTranslation();

  // Helper для локализованного текста с fallback
  const getLocalizedText = (textObj: { ru: string; kk: string; en?: string }) => {
    if (locale === 'en') return textObj.ru; // fallback to ru for en
    return textObj[locale as keyof typeof textObj] || textObj.ru;
  };

  useEffect(() => {
    fetchData();
  }, [sessionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: response } = await axiosClient.get(
        `/counselor/soft-skills/sessions/${sessionId}/details`
      );
      setData(response);
    } catch (error: any) {
      message.error(t.softSkillsReport.errorLoading);
    } finally {
      setLoading(false);
    }
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

  // Нормализация баллов для радар-чарта (от 20 до 100)
  // Формула: находим min/max по пользователю, нормируем относительно них
  const getRadarData = () => {
    if (!data?.result.soft_vector) return [];
    
    const vector = data.result.soft_vector;
    const values = [vector.comm, vector.team, vector.crit, vector.creat, vector.emot, vector.unc];
    
    // 1. Находим min и max по пользователю
    const r_min = Math.min(...values);
    const r_max = Math.max(...values);
    
    // 2. Нормируем каждый показатель
    const normalize = (score: number): number => {
      // z = (r - r_min) / (r_max - r_min + 0.0001)
      const z = (score - r_min) / (r_max - r_min + 0.0001);
      // v = (0.2 + 0.8 * z) * 100 -> результат от 20 до 100
      return Math.round((0.2 + 0.8 * z) * 100);
    };
    
    return [
      { type: getLocalizedText(SOFT_SKILL_INFO.comm.title), value: normalize(vector.comm), fullMark: 100 },
      { type: getLocalizedText(SOFT_SKILL_INFO.team.title), value: normalize(vector.team), fullMark: 100 },
      { type: getLocalizedText(SOFT_SKILL_INFO.crit.title), value: normalize(vector.crit), fullMark: 100 },
      { type: getLocalizedText(SOFT_SKILL_INFO.creat.title), value: normalize(vector.creat), fullMark: 100 },
      { type: getLocalizedText(SOFT_SKILL_INFO.emot.title), value: normalize(vector.emot), fullMark: 100 },
      { type: getLocalizedText(SOFT_SKILL_INFO.unc.title), value: normalize(vector.unc), fullMark: 100 },
    ];
  };

  const getTop3Codes = () => {
    if (!data?.result.soft_triplet) return [];
    // Преобразуем строку вроде "comm-unc-crit" в массив ["comm", "unc", "crit"]
    // Или если это массив, возвращаем его напрямую
    if (Array.isArray(data.result.soft_triplet)) {
      return data.result.soft_triplet;
    }
    return data.result.soft_triplet.split('-');
  };

  const getTop3Names = () => {
    const codes = getTop3Codes();
    return codes.map(code => getLocalizedText(SOFT_SKILL_INFO[code]?.title) || code);
  };

  const isReliable = () => {
    if (!data?.result.quality_flags) return true;
    const flags = Array.isArray(data.result.quality_flags) 
      ? data.result.quality_flags 
      : [data.result.quality_flags];
    return !flags.includes('fail') && !flags.includes('warning');
  };

  const getControlChecksValue = () => {
    return data?.result.quality_details?.control_internals?.discrepancies || 0;
  };

  const getLongPausesValue = () => {
    return data?.result.quality_details?.long_pauses_count || 0;
  };

  const getStatusTag = (value: number, thresholds: { ok: number; warning: number }) => {
    if (value <= thresholds.ok) {
      return <Tag color="success">{t.softSkillsReport.resultReliable ? t.riasecReport.statusOk : 'OK'}</Tag>;
    } else if (value <= thresholds.warning) {
      return <Tag color="error">{t.riasecReport.statusWarning}</Tag>;
    } else {
      return <Tag color="error">{t.riasecReport.statusFail}</Tag>;
    }
  };

  // Проверка времени прохождения (минимум 10 минут = 600 секунд)
  const getTimeStatusTag = (totalTimeSec: number) => {
    if (totalTimeSec < 600) {
      return <Tag color="error">{t.riasecReport.statusFail}</Tag>;
    }
    return <Tag color="success">{t.riasecReport.statusOk}</Tag>;
  };

  // Статус контрольных вопросов от бэкенда
  const getControlStatusTag = () => {
    const status = data?.result.quality_details?.control_internals?.status;
    switch (status) {
      case 'ok':
        return <Tag color="success">{t.riasecReport.statusOk}</Tag>;
      case 'warning':
        return <Tag color="error">{t.riasecReport.statusWarning}</Tag>;
      case 'fail':
        return <Tag color="error">{t.riasecReport.statusFail}</Tag>;
      default:
        return <Tag color="success">{t.riasecReport.statusOk}</Tag>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Spin size="large" />
        <div className="mt-4 text-gray-500">{t.softSkillsReport.loading}</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const top3 = getTop3Codes();
  const top3Names = getTop3Names();
  const controlChecks = getControlChecksValue();
  const longPauses = getLongPausesValue();
  const reliable = isReliable();

  const metricsData = [
    {
      key: "time",
      metric: t.riasecReport.timeSpent,
      value: formatTime(data.session.total_time_sec),
      status: getTimeStatusTag(data.session.total_time_sec)
    },
    {
      key: "control",
      metric: t.high5Report.controlDiscrepancies,
      value: `${controlChecks} ${t.riasecReport.discrepancies}`,
      status: getControlStatusTag()
    },
    {
      key: "straightlining",
      metric: t.riasecReport.straightlining,
      value: data?.result.quality_details?.straightlining?.flags_count ?? 0,
      status: getStraightliningStatusTag()
    }
  ];

  // Статус прокликивания от бэкенда
  function getStraightliningStatusTag() {
    const status = data?.result.quality_details?.straightlining?.status;
    switch (status) {
      case 'ok':
        return <Tag color="success">{t.riasecReport.statusOk}</Tag>;
      case 'warning':
      case 'fail':
        return <Tag color="error">{t.riasecReport.statusFail}</Tag>;
      default:
        return <Tag color="success">{t.riasecReport.statusOk}</Tag>;
    }
  }

  const metricsColumns = [
    {
      title: t.riasecReport.metricColumn,
      dataIndex: "metric",
      key: "metric",
    },
    {
      title: t.riasecReport.valueColumn,
      dataIndex: "value",
      key: "value",
    },
    {
      title: t.riasecReport.statusColumn,
      dataIndex: "status",
      key: "status",
    },
  ];

  // Сортируем навыки по баллам для правильного порядка
  const getSortedSkills = () => {
    if (!data?.result.soft_vector) return [];
    const vector = data.result.soft_vector;
    return Object.entries(vector)
      .sort(([, a], [, b]) => b - a)
      .map(([code]) => code);
  };

  const sortedSkills = getSortedSkills();

  return (
    <div className="soft-skill-report">
      {!reliable && mode === "counselor" && (
        <Alert
          title={t.riasecReport.unreliableResults}
          type="warning"
          showIcon
          className="mb-4"
        />
      )}

      <Card className="soft-skill-profile-card mb-4">
        <h2 className="soft-skill-profile-title">
          {t.softSkillsReport.yourProfile}: {top3Names.join(' - ')} ({t.softSkillsReport.top3})
        </h2>
        <p className="soft-skill-profile-subtitle">
          {t.softSkillsReport.profileDescription}
        </p>
      </Card>

      <Card className="mb-4">
        <div className="soft-skill-radar-container">
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={getRadarData()}>
              <PolarGrid />
              <PolarAngleAxis dataKey="type" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Soft Skills"
                dataKey="value"
                stroke="#1890ff"
                fill="#1890ff"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="soft-skill-metrics-card mb-4">
        <h3 className="soft-skill-metrics-title">{t.riasecReport.metrics}</h3>
        <Table
          columns={metricsColumns}
          dataSource={metricsData}
          pagination={false}
          size="small"
        />
      </Card>

      <div className="soft-skill-sections">
        <Collapse defaultActiveKey={top3} ghost>
          {sortedSkills.map((code) => {
            const info = SOFT_SKILL_INFO[code];
            if (!info) return null;
            
            return (
              <Panel 
                header={getLocalizedText(info.title)} 
                key={code}
              >
                <p className="soft-skill-type-description">
                  {getLocalizedText(info.counselorDescription)}
                </p>
              </Panel>
            );
          })}
        </Collapse>
      </div>

      <Card className="soft-skill-try-now-card">
        <h3 className="soft-skill-try-now-title">{t.softSkillsReport.tryNow}</h3>
        <div className="soft-skill-try-now-list">
          {top3.map((code) => {
            const task = TRY_NOW_TASKS[code];
            const skillName = getLocalizedText(SOFT_SKILL_INFO[code]?.title);
            if (!task || !skillName) return null;
            
            return (
              <div key={code} className="soft-skill-try-now-item">
                <div className="soft-skill-try-now-label">
                  {skillName}:
                </div>
                <div className="soft-skill-try-now-task">
                  «{getLocalizedText(task)}»
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

