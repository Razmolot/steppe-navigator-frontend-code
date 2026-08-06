import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { ReloadOutlined, RollbackOutlined, SwapOutlined } from "@ant-design/icons";
import axiosClient from "../../api/axiosClient";
import type { AxiosError } from "axios";
import Breadcrumb from "../../components/Breadcrumb";
import { useTranslation } from "../../hooks/useTranslation";
import { useAuthStore } from "../../store/useAuthStore";

const { Text, Paragraph } = Typography;

type Locale = "ru" | "kk" | "en";

type School = {
  id: number;
  name: string;
};

type Classroom = {
  id: number;
  name: string;
  school_id: number;
};

type PromotionItem = {
  student_id: number;
  student_name: string;
  student_email: string;
  from_classroom_id: number;
  from_classroom_name: string;
  to_classroom_id: number | null;
  to_classroom_name: string | null;
  action: "promote" | "graduate" | "manual";
  status: "planned" | "skipped";
  is_manual_override: boolean;
  note: string | null;
};

type PromotionPreview = {
  school_id: number;
  school_name: string;
  from_academic_year: string;
  to_academic_year: string;
  graduation_year: number;
  graduation_classroom_name: string;
  summary: {
    total_students: number;
    promote: number;
    graduate: number;
    manual: number;
    skipped: number;
    by_route: Record<string, number>;
  };
  items: PromotionItem[];
};

type AppliedBatch = {
  id: number;
  status: "applied" | "rolled_back";
  applied_at?: string;
  rolled_back_at?: string | null;
  summary?: PromotionPreview["summary"];
};

type ApiValidationError = {
  message?: string;
  errors?: Record<string, string[]>;
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as AxiosError<ApiValidationError>;
  const validation = apiError.response?.data?.errors;
  const validationMessage = validation ? Object.values(validation).flat().join(" ") : null;

  return validationMessage || apiError.response?.data?.message || fallback;
};

const copy = {
  ru: {
    title: "Переход классов",
    subtitle: "Массовый перевод учеников на следующий учебный год с preview, apply и rollback.",
    setup: "Параметры перехода",
    school: "Школа",
    fromYear: "Текущий учебный год",
    toYear: "Новый учебный год",
    graduationYear: "Год выпуска",
    preview: "Показать preview",
    refreshPreview: "Обновить preview",
    apply: "Применить переход",
    rollback: "Откатить batch",
    noPreview: "Сначала выберите школу и постройте preview.",
    selectSchool: "Выберите школу",
    total: "Всего учеников",
    promote: "Переводятся",
    graduate: "Выпускаются",
    manual: "Ручные правки",
    skipped: "Пропущены",
    student: "Ученик",
    from: "Из класса",
    to: "В класс",
    action: "Действие",
    status: "Статус",
    override: "Ручной целевой класс",
    planned: "Запланировано",
    skippedStatus: "Нужно исправить",
    promoteAction: "Переход",
    graduateAction: "Выпуск",
    manualAction: "Ручная правка",
    routeSummary: "Маршруты",
    batchApplied: "Batch применён",
    batchRolledBack: "Batch откачен",
    duplicateOrError: "Не удалось применить переход",
    rollbackError: "Не удалось откатить batch",
    loadError: "Не удалось загрузить данные",
    previewError: "Не удалось построить preview",
    confirmApplyTitle: "Применить переход классов?",
    confirmApplyText: "Это массово изменит текущие классы учеников. Продолжить?",
    confirmRollbackTitle: "Откатить применённый переход?",
    confirmRollbackText: "Rollback вернёт учеников в исходные классы, если их не перемещали после apply.",
    blockedBySkipped: "Apply недоступен, пока в preview есть пропущенные ученики.",
    changedOverrides: "Есть ручные правки. Обновите preview перед apply, чтобы проверить итоговую раскладку.",
    graduationClassroom: "Класс выпускников",
    none: "—",
  },
  kk: {
    title: "Сыныптарды көшіру",
    subtitle: "Оқушыларды келесі оқу жылына preview, apply және rollback арқылы жаппай көшіру.",
    setup: "Көшіру параметрлері",
    school: "Мектеп",
    fromYear: "Ағымдағы оқу жылы",
    toYear: "Жаңа оқу жылы",
    graduationYear: "Бітіру жылы",
    preview: "Preview көрсету",
    refreshPreview: "Preview жаңарту",
    apply: "Көшіруді қолдану",
    rollback: "Batch қайтару",
    noPreview: "Алдымен мектепті таңдап, preview құрыңыз.",
    selectSchool: "Мектепті таңдаңыз",
    total: "Барлық оқушы",
    promote: "Көшіріледі",
    graduate: "Бітіреді",
    manual: "Қолмен түзету",
    skipped: "Өткізілген",
    student: "Оқушы",
    from: "Қай сыныптан",
    to: "Қай сыныпқа",
    action: "Әрекет",
    status: "Күйі",
    override: "Қолмен таңдалған сынып",
    planned: "Жоспарланған",
    skippedStatus: "Түзету керек",
    promoteAction: "Көшіру",
    graduateAction: "Бітіру",
    manualAction: "Қолмен түзету",
    routeSummary: "Маршруттар",
    batchApplied: "Batch қолданылды",
    batchRolledBack: "Batch қайтарылды",
    duplicateOrError: "Көшіруді қолдану мүмкін болмады",
    rollbackError: "Batch қайтару мүмкін болмады",
    loadError: "Деректер жүктелмеді",
    previewError: "Preview құру мүмкін болмады",
    confirmApplyTitle: "Сыныптарды көшіруді қолданасыз ба?",
    confirmApplyText: "Бұл оқушылардың ағымдағы сыныптарын жаппай өзгертеді. Жалғастыру керек пе?",
    confirmRollbackTitle: "Қолданылған көшіруді қайтару керек пе?",
    confirmRollbackText: "Rollback оқушыларды бастапқы сыныптарына қайтарады, егер apply-дан кейін олар көшірілмеген болса.",
    blockedBySkipped: "Preview ішінде өткізілген оқушылар бар кезде apply қолжетімсіз.",
    changedOverrides: "Қолмен түзетулер бар. Apply алдында preview жаңартып, қорытындыны тексеріңіз.",
    graduationClassroom: "Түлектер сыныбы",
    none: "—",
  },
  en: {
    title: "Classroom promotion",
    subtitle: "Bulk move students into the next academic year with preview, apply, and rollback.",
    setup: "Promotion setup",
    school: "School",
    fromYear: "Current academic year",
    toYear: "Next academic year",
    graduationYear: "Graduation year",
    preview: "Show preview",
    refreshPreview: "Refresh preview",
    apply: "Apply promotion",
    rollback: "Rollback batch",
    noPreview: "Select a school and generate a preview first.",
    selectSchool: "Select school",
    total: "Total students",
    promote: "Promoted",
    graduate: "Graduating",
    manual: "Manual overrides",
    skipped: "Skipped",
    student: "Student",
    from: "From classroom",
    to: "To classroom",
    action: "Action",
    status: "Status",
    override: "Manual target classroom",
    planned: "Planned",
    skippedStatus: "Needs fix",
    promoteAction: "Promote",
    graduateAction: "Graduate",
    manualAction: "Manual override",
    routeSummary: "Routes",
    batchApplied: "Batch applied",
    batchRolledBack: "Batch rolled back",
    duplicateOrError: "Could not apply promotion",
    rollbackError: "Could not rollback batch",
    loadError: "Could not load data",
    previewError: "Could not generate preview",
    confirmApplyTitle: "Apply classroom promotion?",
    confirmApplyText: "This will bulk update students’ current classrooms. Continue?",
    confirmRollbackTitle: "Rollback applied promotion?",
    confirmRollbackText: "Rollback will return students to their source classrooms if they were not moved after apply.",
    blockedBySkipped: "Apply is disabled while the preview contains skipped students.",
    changedOverrides: "Manual overrides changed. Refresh preview before applying to verify the final plan.",
    graduationClassroom: "Graduation classroom",
    none: "—",
  },
} as const;

const currentAcademicYears = () => {
  const now = new Date();
  const base = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return {
    from: `${base}-${base + 1}`,
    to: `${base + 1}-${base + 2}`,
    graduation: base + 1,
  };
};

const actionColor = (action: PromotionItem["action"]) => {
  if (action === "graduate") return "purple";
  if (action === "manual") return "blue";
  return "green";
};

export const ClassroomPromotionPage = () => {
  const { message } = App.useApp();
  const { t, locale } = useTranslation();
  const pageText = copy[locale as Locale] ?? copy.ru;
  const { user } = useAuthStore();
  const defaults = useMemo(() => currentAcademicYears(), []);
  const [form] = Form.useForm();

  const [schools, setSchools] = useState<School[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [preview, setPreview] = useState<PromotionPreview | null>(null);
  const [batch, setBatch] = useState<AppliedBatch | null>(null);
  const [overrides, setOverrides] = useState<Record<number, number>>({});
  const [dirtyOverrides, setDirtyOverrides] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState(false);

  const canUseAdminEndpoints = user?.role === "admin";

  const loadSchools = async () => {
    setLoadingSchools(true);
    try {
      const endpoint = canUseAdminEndpoints ? "/schools" : "/counselor/my-schools";
      const { data } = await axiosClient.get(endpoint, { params: { limit: 100 } });
      const items = data.items || data || [];
      setSchools(items);
      if (items.length > 0) {
        setSelectedSchoolId((current) => current ?? items[0].id);
        form.setFieldValue("school_id", form.getFieldValue("school_id") ?? items[0].id);
      }
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, pageText.loadError));
    } finally {
      setLoadingSchools(false);
    }
  };

  const loadClassrooms = async (schoolId: number) => {
    setLoadingClassrooms(true);
    try {
      const endpoint = canUseAdminEndpoints ? "/classrooms" : "/counselor/my-classrooms";
      const { data } = await axiosClient.get(endpoint, { params: { school_id: schoolId, limit: 100 } });
      setClassrooms(data.items || data || []);
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, pageText.loadError));
    } finally {
      setLoadingClassrooms(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, [user?.role, locale]);

  useEffect(() => {
    if (selectedSchoolId) {
      loadClassrooms(selectedSchoolId);
    } else {
      setClassrooms([]);
    }
    setPreview(null);
    setBatch(null);
    setOverrides({});
    setDirtyOverrides(false);
  }, [selectedSchoolId]);

  const buildPayload = () => {
    const values = form.getFieldsValue();
    return {
      from_academic_year: values.from_academic_year,
      to_academic_year: values.to_academic_year,
      graduation_year: Number(values.graduation_year),
      locale,
      overrides: Object.entries(overrides).map(([studentId, targetClassroomId]) => ({
        student_id: Number(studentId),
        target_classroom_id: targetClassroomId,
      })),
    };
  };

  const generatePreview = async () => {
    const values = await form.validateFields();
    setPreviewLoading(true);
    try {
      const { data } = await axiosClient.post(
        `/counselor/classroom-promotions/schools/${values.school_id}/preview`,
        buildPayload(),
      );
      setPreview(data);
      setBatch(null);
      setDirtyOverrides(false);
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, pageText.previewError));
    } finally {
      setPreviewLoading(false);
    }
  };

  const applyPromotion = async () => {
    const values = await form.validateFields();
    setApplyLoading(true);
    try {
      const { data } = await axiosClient.post(
        `/counselor/classroom-promotions/schools/${values.school_id}/apply`,
        buildPayload(),
      );
      setBatch(data);
      message.success(`${pageText.batchApplied} #${data.id}`);
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, pageText.duplicateOrError));
    } finally {
      setApplyLoading(false);
    }
  };

  const rollbackBatch = async () => {
    if (!batch?.id) return;
    setRollbackLoading(true);
    try {
      const { data } = await axiosClient.post(`/counselor/classroom-promotions/batches/${batch.id}/rollback`);
      setBatch(data);
      message.success(`${pageText.batchRolledBack} #${data.id}`);
      await generatePreview();
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, pageText.rollbackError));
    } finally {
      setRollbackLoading(false);
    }
  };

  const updateOverride = (studentId: number, targetClassroomId?: number) => {
    setOverrides((current) => {
      const next = { ...current };
      if (targetClassroomId) {
        next[studentId] = targetClassroomId;
      } else {
        delete next[studentId];
      }
      return next;
    });
    setDirtyOverrides(true);
  };

  const columns: ColumnsType<PromotionItem> = [
    {
      title: pageText.student,
      key: "student",
      render: (_, record) => (
        <div>
          <div>{record.student_name}</div>
          <Text type="secondary">{record.student_email}</Text>
        </div>
      ),
    },
    { title: pageText.from, dataIndex: "from_classroom_name", key: "from" },
    {
      title: pageText.to,
      key: "to",
      render: (_, record) => record.to_classroom_name || record.note || pageText.none,
    },
    {
      title: pageText.action,
      key: "action",
      render: (_, record) => (
        <Tag color={actionColor(record.action)}>
          {record.action === "graduate"
            ? pageText.graduateAction
            : record.action === "manual"
              ? pageText.manualAction
              : pageText.promoteAction}
        </Tag>
      ),
    },
    {
      title: pageText.status,
      key: "status",
      render: (_, record) => (
        <Tag color={record.status === "skipped" ? "red" : "green"}>
          {record.status === "skipped" ? pageText.skippedStatus : pageText.planned}
        </Tag>
      ),
    },
    {
      title: pageText.override,
      key: "override",
      width: 240,
      render: (_, record) => (
        <Select
          allowClear
          showSearch
          loading={loadingClassrooms}
          placeholder={pageText.to}
          value={overrides[record.student_id]}
          optionFilterProp="label"
          style={{ width: "100%" }}
          onChange={(value) => updateOverride(record.student_id, value)}
          options={classrooms.map((classroom) => ({
            value: classroom.id,
            label: classroom.name,
          }))}
        />
      ),
    },
  ];

  const summary = preview?.summary;
  const skippedCount = summary?.skipped ?? 0;
  const applyDisabled = !preview || skippedCount > 0 || dirtyOverrides || batch?.status === "applied";

  return (
    <div className="p-6">
      <Card className="mb-4!">
        <Breadcrumb routes={[{ name: pageText.title }]} />
        <h3 className="text-2xl">{pageText.title}</h3>
        <Paragraph type="secondary">{pageText.subtitle}</Paragraph>
      </Card>

      <Card title={pageText.setup} className="mb-4!">
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            from_academic_year: defaults.from,
            to_academic_year: defaults.to,
            graduation_year: defaults.graduation,
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="school_id" label={pageText.school} rules={[{ required: true, message: pageText.selectSchool }]}>
                <Select
                  loading={loadingSchools}
                  placeholder={pageText.selectSchool}
                  onChange={(value) => setSelectedSchoolId(value)}
                  options={schools.map((school) => ({ value: school.id, label: school.name }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={5}>
              <Form.Item name="from_academic_year" label={pageText.fromYear} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={5}>
              <Form.Item name="to_academic_year" label={pageText.toYear} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={3}>
              <Form.Item name="graduation_year" label={pageText.graduationYear} rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col xs={24} md={3}>
              <Form.Item label=" ">
                <Button type="primary" icon={<ReloadOutlined />} loading={previewLoading} onClick={generatePreview} block>
                  {preview ? pageText.refreshPreview : pageText.preview}
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {!preview && <Alert type="info" showIcon message={pageText.noPreview} className="mb-4!" />}

      {preview && (
        <>
          <Row gutter={16} className="mb-4!">
            <Col xs={12} md={4}><Card><Statistic title={pageText.total} value={summary?.total_students ?? 0} /></Card></Col>
            <Col xs={12} md={4}><Card><Statistic title={pageText.promote} value={summary?.promote ?? 0} /></Card></Col>
            <Col xs={12} md={4}><Card><Statistic title={pageText.graduate} value={summary?.graduate ?? 0} /></Card></Col>
            <Col xs={12} md={4}><Card><Statistic title={pageText.manual} value={summary?.manual ?? 0} /></Card></Col>
            <Col xs={12} md={4}><Card><Statistic title={pageText.skipped} value={summary?.skipped ?? 0} valueStyle={{ color: skippedCount > 0 ? "#cf1322" : undefined }} /></Card></Col>
            <Col xs={12} md={4}><Card><Statistic title={pageText.graduationClassroom} value={preview.graduation_classroom_name} /></Card></Col>
          </Row>

          {skippedCount > 0 && <Alert type="warning" showIcon message={pageText.blockedBySkipped} className="mb-4!" />}
          {dirtyOverrides && <Alert type="warning" showIcon message={pageText.changedOverrides} className="mb-4!" />}
          {batch && (
            <Alert
              type={batch.status === "applied" ? "success" : "info"}
              showIcon
              className="mb-4!"
              message={`${batch.status === "applied" ? pageText.batchApplied : pageText.batchRolledBack} #${batch.id}`}
              action={batch.status === "applied" ? (
                <Button
                  danger
                  size="small"
                  icon={<RollbackOutlined />}
                  loading={rollbackLoading}
                  onClick={() => Modal.confirm({
                    title: pageText.confirmRollbackTitle,
                    content: pageText.confirmRollbackText,
                    okText: pageText.rollback,
                    okButtonProps: { danger: true },
                    cancelText: t.common.cancel,
                    onOk: rollbackBatch,
                  })}
                >
                  {pageText.rollback}
                </Button>
              ) : undefined}
            />
          )}

          <Card
            title={pageText.routeSummary}
            className="mb-4!"
            extra={
              <Space>
                <Button icon={<ReloadOutlined />} loading={previewLoading} onClick={generatePreview}>
                  {pageText.refreshPreview}
                </Button>
                <Button
                  type="primary"
                  icon={<SwapOutlined />}
                  loading={applyLoading}
                  disabled={applyDisabled}
                  onClick={() => Modal.confirm({
                    title: pageText.confirmApplyTitle,
                    content: pageText.confirmApplyText,
                    okText: pageText.apply,
                    cancelText: t.common.cancel,
                    onOk: applyPromotion,
                  })}
                >
                  {pageText.apply}
                </Button>
              </Space>
            }
          >
            <Space wrap>
              {Object.entries(summary?.by_route || {}).map(([route, count]) => (
                <Tag key={route}>{route}: {count}</Tag>
              ))}
            </Space>
          </Card>

          <Card>
            <Table
              rowKey="student_id"
              dataSource={preview.items}
              columns={columns}
              pagination={{ pageSize: 20, showSizeChanger: true }}
              scroll={{ x: 900 }}
            />
          </Card>
        </>
      )}
    </div>
  );
};
