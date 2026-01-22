import { useEffect, useState } from "react";
import { Card, Button, Spin, App, Input, Modal, Checkbox, Radio, Space } from "antd";
import { EditOutlined } from "@ant-design/icons";
import axiosClient from "../../api/axiosClient";
import { useTranslation } from "../../hooks/useTranslation";
import "./QuestionnaireReport.css";

const { TextArea } = Input;

interface Option {
  option_id: string;
  text: {
    ru: string;
    kk: string;
    en: string;
  };
  has_custom_input: boolean;
}

interface Answer {
  id: number;
  selected_options: string[];
  custom_text: string | null;
}

interface Question {
  question_id: string;
  question_text: {
    ru: string;
    kk: string;
    en: string;
  };
  question_type: "single_choice" | "multiple_choice";
  options: Option[];
  answer: Answer | null;
}

interface QuestionnaireReportData {
  session: {
    id: string;
    user_id: number;
    status: string;
    locale: string;
    counselor_comment: string | null;
    completed_at: string;
  };
  student: {
    id: number;
    name: string;
    email: string;
  };
  questions: Question[];
}

interface Props {
  sessionId: string;
  onDataLoaded?: (data: QuestionnaireReportData) => void;
}

export const QuestionnaireReport = ({ sessionId, onDataLoaded }: Props) => {
  const [data, setData] = useState<QuestionnaireReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [customText, setCustomText] = useState("");
  const [savingAnswer, setSavingAnswer] = useState(false);
  const { message } = App.useApp();
  const { t, locale } = useTranslation();

  useEffect(() => {
    fetchData();
  }, [sessionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: response } = await axiosClient.get(
        `/counselor/questionnaire/sessions/${sessionId}/details`
      );
      setData(response);
      setComment(response.session.counselor_comment || "");
      
      if (onDataLoaded) {
        onDataLoaded(response);
      }
    } catch (error: any) {
      message.error(t.questionnaireReport.errorLoading);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveComment = async () => {
    try {
      setSavingComment(true);
      await axiosClient.put(
        `/counselor/questionnaire/sessions/${sessionId}/comment`,
        { counselor_comment: comment }
      );
      message.success(t.questionnaireReport.commentSaved);
    } catch (error: any) {
      message.error(t.questionnaireReport.commentError);
    } finally {
      setSavingComment(false);
    }
  };

  const handleEditClick = (question: Question) => {
    setEditingQuestion(question);
    setSelectedOptions(question.answer?.selected_options || []);
    setCustomText(question.answer?.custom_text || "");
    setEditModalVisible(true);
  };

  const handleSaveAnswer = async () => {
    if (!editingQuestion?.answer) return;

    try {
      setSavingAnswer(true);
      await axiosClient.put(
        `/counselor/questionnaire/answers/${editingQuestion.answer.id}`,
        {
          selected_options: selectedOptions,
          custom_text: customText,
        }
      );
      message.success(t.questionnaireReport.answerUpdated);
      setEditModalVisible(false);
      await fetchData();
    } catch (error: any) {
      message.error(t.questionnaireReport.answerError);
    } finally {
      setSavingAnswer(false);
    }
  };

  const getOptionText = (option: Option) => {
    return option.text[locale as keyof typeof option.text] || option.text.ru;
  };

  const getQuestionText = (question: Question) => {
    return question.question_text[locale as keyof typeof question.question_text] || question.question_text.ru;
  };

  const getAnswerText = (question: Question) => {
    if (!question.answer || question.answer.selected_options.length === 0) {
      return <span className="text-gray-400">{t.questionnaireReport.notAnswered}</span>;
    }

    const selectedOptionTexts = question.answer.selected_options.map((optionId) => {
      const option = question.options.find((opt) => opt.option_id === optionId);
      return option ? getOptionText(option) : optionId;
    });

    return (
      <div>
        {selectedOptionTexts.map((text, index) => (
          <div key={index} className="selected-option">
            <Checkbox checked disabled /> {text}
          </div>
        ))}
        {question.answer.custom_text && (
          <div className="custom-text">
            <strong>{t.questionnaireReport.additional}:</strong> {question.answer.custom_text}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Spin size="large" />
        <div className="mt-4 text-gray-500">{t.questionnaireReport.loading}</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="questionnaire-report">
      <div className="questions-list">
        {data.questions.map((question, index) => (
          <Card key={question.question_id} className="question-card mb-4">
            <div className="question-header">
              <h4 className="question-title">
                {index + 1}. {getQuestionText(question)}
              </h4>
              {question.answer && (
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => handleEditClick(question)}
                  className="edit-button"
                >
                  {t.questionnaireReport.editAnswer}
                </Button>
              )}
            </div>
            <div className="question-answer">{getAnswerText(question)}</div>
          </Card>
        ))}
      </div>

      <Card className="comment-card">
        <h4 className="comment-title">{t.questionnaireReport.counselorComment}</h4>
        <TextArea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t.questionnaireReport.enterComment}
          className="mb-4"
        />
        <Button
          type="primary"
          onClick={handleSaveComment}
          loading={savingComment}
          style={{ marginTop: '8px' }}
        >
          {t.questionnaireReport.saveComment}
        </Button>
      </Card>

      <Modal
        title={`${t.questionnaireReport.editAnswerTitle}: ${editingQuestion ? getQuestionText(editingQuestion) : ""}`}
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingQuestion(null);
        }}
        onOk={handleSaveAnswer}
        confirmLoading={savingAnswer}
        okText={t.common.save}
        cancelText={t.common.cancel}
        width={600}
        destroyOnHidden
        maskClosable
      >
        {editingQuestion && (
          <div className="edit-modal-content">
            {editingQuestion.question_type === "single_choice" ? (
              <Radio.Group
                value={selectedOptions[0]}
                onChange={(e) => setSelectedOptions([e.target.value])}
                className="w-full"
              >
                <Space direction="vertical" className="w-full">
                  {editingQuestion.options.map((option) => (
                    <Radio key={option.option_id} value={option.option_id}>
                      {getOptionText(option)}
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            ) : (
              <Checkbox.Group
                value={selectedOptions}
                onChange={(values) => setSelectedOptions(values as string[])}
                className="w-full"
              >
                <Space direction="vertical" className="w-full">
                  {editingQuestion.options.map((option) => (
                    <Checkbox key={option.option_id} value={option.option_id}>
                      {getOptionText(option)}
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            )}

            {editingQuestion.options.some((opt) => opt.has_custom_input && selectedOptions.includes(opt.option_id)) && (
              <div className="mt-3">
                <TextArea
                  rows={3}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={t.questionnaireReport.enterAdditional}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

