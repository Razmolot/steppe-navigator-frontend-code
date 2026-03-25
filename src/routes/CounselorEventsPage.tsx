import { useEffect, useState } from "react";
import {
    Modal,
    Form,
    Input,
    DatePicker,
    TimePicker,
    Select,
    Card,
    Button,
    Tag,
    Descriptions,
    Popconfirm, App,
    Divider,
    Typography,
} from "antd";
import axiosClient from "../api/axiosClient";
import dayjs from "dayjs";
import Breadcrumb from "../components/Breadcrumb.tsx";
import { CalendarWidget } from "../components/CalendarWidget";
import {
    updateEventsSelector,
    useCalendarWidgetStore,
} from "../components/CalendarWidget/store.ts";
import { useTranslation } from "../hooks/useTranslation";
import { EventReflectionViewer } from "../components/EventReflectionViewer";

export const CounselorEventsPage = () => {
    const { t } = useTranslation();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isViewModalVisible, setIsViewModalVisible] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [form] = Form.useForm();
    const { message } = App.useApp();

    const updateEvents = useCalendarWidgetStore(updateEventsSelector);

    const eventTypeKeys = ['test', 'lesson', 'consultation', 'excursion', 'meetingProfessional', 'game', 'meetingParents', 'other'] as const;
    const getEventTypeLabel = (key: string) => {
        const types = t.events.eventTypes as Record<string, string>;
        return types[key] || key;
    };

    /** Загрузка событий в календарь */
    const fetchCalendarEvents = async (dateFrom: string, dateTo: string) => {
        try {
            const response = await axiosClient.get("/counselor/my-events", {
                params: {
                    date_from: dateFrom,
                    date_to: dateTo,
                },
            });
            updateEvents(response.data);
        } catch (error) {
            console.error("Error loading calendar events:", error);
            message.error(t.events.errorLoading);
        }
    };

    /** Загрузка классов и учеников */
    const fetchMetaData = async () => {
        try {
            const [classroomsRes, studentsRes] = await Promise.all([
                axiosClient.get("/counselor/my-classrooms" , { params: { limit: 100 } }),
                axiosClient.get("/counselor/my-students", { params: { limit: 1000 } }),
            ]);
            setClassrooms(classroomsRes.data.items);
            setStudents(studentsRes.data.items);
        } catch {
            message.error(t.events.errorLoadingData);
        }
    };

    useEffect(() => {
        fetchMetaData();
    }, []);

    /** Создание / редактирование события */
    const handleCreateOrUpdate = async (values: any) => {
        const payload = {
            ...values,
            date: values.date.format("YYYY-MM-DD"),
            time_from: values.time_from.format("HH:mm"),
            time_to: values.time_to.format("HH:mm"),
        };

        try {
            if (editingEvent) {
                await axiosClient.put(`/counselor/events/${editingEvent.id}`, payload);
                message.success(t.events.eventUpdated);
            } else {
                await axiosClient.post("/counselor/events", payload);
                message.success(t.events.eventAdded);
            }
            setIsModalVisible(false);
            setEditingEvent(null);
            form.resetFields();
            // обновляем календарь
            const today = dayjs();
            await fetchCalendarEvents(today.startOf("month").format("YYYY-MM-DD"), today.endOf("month").format("YYYY-MM-DD"));
        } catch (error: any) {
            // Laravel возвращает ошибки валидации в error.response.data.errors
            const errors = error.response?.data?.errors;
            if (errors) {
                // Показываем первую ошибку валидации
                const firstError = Object.values(errors)[0];
                const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
                message.error(errorMessage as string);
            } else {
                const errorMessage = error.response?.data?.message || t.events.errorSaving;
                message.error(errorMessage);
            }
        }
    };

    /** Удаление события */
    const handleDelete = async (id: number) => {
        try {
            await axiosClient.delete(`/counselor/events/${id}`);
            message.success(t.events.eventDeleted);
            setIsViewModalVisible(false);
            const today = dayjs();
            await fetchCalendarEvents(today.startOf("month").format("YYYY-MM-DD"), today.endOf("month").format("YYYY-MM-DD"));
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.events.errorDeleting;
            message.error(errorMessage);
        }
    };

    return (
        <div className="p-6">
            <Card className="mb-4!">
                <Breadcrumb routes={[{ name: t.nav.events }]} />
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl">{t.nav.events}</h3>
                    <Button
                        type="primary"
                        onClick={() => {
                            form.resetFields();
                            setEditingEvent(null);
                            setIsModalVisible(true);
                        }}
                    >
                        {t.events.addEvent}
                    </Button>
                </div>
            </Card>

            <div>
                <CalendarWidget
                    onDateRangeChange={fetchCalendarEvents}
                    onEventClick={(event) => {
                        setSelectedEvent(event);
                        setIsViewModalVisible(true);
                    }}
                    onDayClick={(date) => {
                        form.resetFields();
                        form.setFieldsValue({ date: dayjs(date) });
                        setEditingEvent(null);
                        setIsModalVisible(true);
                    }}
                />
            </div>

            {/* Модалка просмотра события */}
            <Modal
                title={t.events.eventDetails}
                open={isViewModalVisible}
                onCancel={() => {
                    setIsViewModalVisible(false);
                    setSelectedEvent(null);
                }}
                destroyOnHidden
                maskClosable
                footer={[
                    <Button
                        key="edit"
                        onClick={() => {
                            setEditingEvent(selectedEvent);
                            form.setFieldsValue({
                                ...selectedEvent,
                                date: dayjs(selectedEvent.date),
                                time_from: dayjs(selectedEvent.time_from, "HH:mm"),
                                time_to: dayjs(selectedEvent.time_to, "HH:mm"),
                                classrooms: Array.isArray(selectedEvent.classrooms)
                                    ? selectedEvent.classrooms.map((c: any) => (typeof c === "object" ? c.id : c))
                                    : [],
                                students: Array.isArray(selectedEvent.students)
                                    ? selectedEvent.students.map((s: any) => (typeof s === "object" ? s.id : s))
                                    : [],

                            });
                            setIsViewModalVisible(false);
                            setIsModalVisible(true);
                        }}
                    >
                        {t.events.edit}
                    </Button>,
                    <Popconfirm
                        key="delete"
                        title={t.events.deleteConfirm}
                        onConfirm={() => handleDelete(selectedEvent.id)}
                        okText={t.events.yes}
                        cancelText={t.events.no}
                    >
                        <Button danger>{t.events.delete}</Button>
                    </Popconfirm>,
                ]}
            >
                {selectedEvent && (
                    <>
                        <Descriptions column={1} bordered>
                            <Descriptions.Item label={t.events.name}>{selectedEvent.title}</Descriptions.Item>
                            <Descriptions.Item label={t.events.description}>{selectedEvent.text}</Descriptions.Item>
                            <Descriptions.Item label={t.events.type}>
                                {selectedEvent.type?.map((tag: string) => (
                                    <Tag key={tag}>{getEventTypeLabel(tag)}</Tag>
                                ))}
                            </Descriptions.Item>
                            <Descriptions.Item label={t.events.date}>
                                {dayjs(selectedEvent.date).format("DD.MM.YYYY")}
                            </Descriptions.Item>
                            <Descriptions.Item label={t.events.time}>{`${selectedEvent.time_from} - ${selectedEvent.time_to}`}</Descriptions.Item>
                            <Descriptions.Item label={t.events.place}>{selectedEvent.place}</Descriptions.Item>
                            <Descriptions.Item label={t.events.classrooms}>
                                {selectedEvent.classrooms?.map((cls: any) => (
                                    <Tag key={cls.id}>{cls.name}</Tag>
                                ))}
                            </Descriptions.Item>
                            <Descriptions.Item label={t.events.students}>
                                {selectedEvent.students?.map((s: any) => (
                                    <Tag key={s.id}>{s.name}</Tag>
                                ))}
                            </Descriptions.Item>
                        </Descriptions>
                        {(() => {
                            const assignedStudents =
                                selectedEvent.assigned_students?.length
                                    ? selectedEvent.assigned_students
                                    : (selectedEvent.students ?? []);

                            if (assignedStudents.length === 0) return null;

                            return (
                                <div className="mt-4">
                                    <Divider>
                                        <Typography.Text strong>{t.events.reflection.studentReflection}</Typography.Text>
                                    </Divider>
                                    {assignedStudents.map((s: any) => (
                                        <div key={s.id} className="mb-3">
                                            <EventReflectionViewer
                                                studentId={s.id}
                                                eventId={selectedEvent.id}
                                                studentName={s.name}
                                            />
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </>
                )}
            </Modal>

            {/* Модалка создания/редактирования */}
            <Modal
                title={editingEvent ? t.events.editEvent : t.events.createEvent}
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    setEditingEvent(null);
                    form.resetFields();
                }}
                footer={null}
                destroyOnHidden
                maskClosable
            >
                <Form layout="vertical" form={form} onFinish={handleCreateOrUpdate}>
                    <Form.Item
                        label={t.events.name}
                        name="title"
                        rules={[{ required: true, message: t.events.enterName }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label={t.events.description}
                        name="text"
                        rules={[{ required: true, message: t.events.enterDescription }]}
                    >
                        <Input.TextArea rows={3} />
                    </Form.Item>

                    <Form.Item label={t.events.eventType} name="type">
                        <Select mode="multiple" placeholder={t.events.selectTypes}>
                            {eventTypeKeys.map((key) => (
                                <Select.Option key={key} value={key}>
                                    {getEventTypeLabel(key)}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label={t.events.date}
                        name="date"
                        rules={[{ required: true, message: t.events.selectDate }]}
                    >
                        <DatePicker className="w-full" />
                    </Form.Item>

                    <Form.Item
                        label={t.events.timeStart}
                        name="time_from"
                        rules={[{ required: true, message: t.events.enterTimeStart }]}
                    >
                        <TimePicker 
                            format="HH:mm" 
                            className="w-full"
                            minuteStep={5}
                            disabledTime={() => ({
                                disabledHours: () => [0, 1, 2, 3, 4, 5, 6, 7, 21, 22, 23],
                            })}
                            hideDisabledOptions
                        />
                    </Form.Item>

                    <Form.Item
                        label={t.events.timeEnd}
                        name="time_to"
                        rules={[{ required: true, message: t.events.enterTimeEnd }]}
                    >
                        <TimePicker 
                            format="HH:mm" 
                            className="w-full"
                            minuteStep={5}
                            disabledTime={() => ({
                                disabledHours: () => [0, 1, 2, 3, 4, 5, 6, 7, 21, 22, 23],
                            })}
                            hideDisabledOptions
                        />
                    </Form.Item>

                    <Form.Item label={t.events.place} name="place">
                        <Input />
                    </Form.Item>

                    <Form.Item label={t.events.classrooms} name="classrooms">
                        <Select
                            mode="multiple"
                            placeholder={t.events.selectClassrooms}
                            allowClear={true}
                            showSearch={true}
                            optionFilterProp={"children"}
                        >
                            {classrooms.map((cls) => (
                                <Select.Option key={cls.id} value={cls.id}>
                                    {cls.name} - {cls.school.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item label={t.events.students} name="students">
                        <Select
                            mode="multiple"
                            placeholder={t.events.selectStudents}
                            allowClear={true}
                            showSearch={true}
                            optionFilterProp={"children"}
                        >
                            {students.map((s) => (
                                <Select.Option key={s.id} value={s.id}>
                                    {s.name} ({s.email}) - {s.classroom.name} ({s.classroom.school.name})
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="w-full">
                            {editingEvent ? t.events.saveChanges : t.events.createEvent}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
