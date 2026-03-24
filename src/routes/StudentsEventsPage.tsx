import {useEffect, useState} from "react";
import {
    Table,
    Button,
    Modal,
    Card,
    Space,
    Descriptions,
    Tag, App,
} from "antd";
import axiosClient from "../api/axiosClient";
import dayjs from "dayjs";
import {updateEventsSelector, useCalendarWidgetStore} from "../components/CalendarWidget/store.ts";
import {CalendarWidget} from "../components/CalendarWidget";
import Breadcrumb from "../components/Breadcrumb.tsx";
import { useTranslation } from "../hooks/useTranslation";
import { EventReflectionEditor } from "../components/EventReflectionEditor";

export const StudentsEventsPage = () => {
    const { t } = useTranslation();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);

    const updateEvents = useCalendarWidgetStore(updateEventsSelector);

    const getEventTypeLabel = (key: string) => {
        const types = t.events.eventTypes as Record<string, string>;
        return types[key] || key;
    };

    const fetchCalendarEvents = async (dateFrom: string, dateTo: string) => {
        try {
            const response = await axiosClient.get("/student/events/assigned-to-me", {
                params: {
                    date_from: dateFrom,
                    date_to: dateTo,
                },
            });
            updateEvents(response.data);
        } catch (error) {
            console.error("Error loading calendar events:", error);
        }
    };

    return (
        <div>
            <Card className={'mb-4!'}>
                <Breadcrumb
                    routes={[{name: t.nav.events}]}
                />
                <h3 className={'text-2xl'}>{t.nav.events}</h3>
            </Card>

            <div className={'p-6'}>
                <CalendarWidget
                    onDateRangeChange={fetchCalendarEvents}
                    onEventClick={(event) => {
                        setSelectedEvent(event);
                        setIsModalVisible(true);
                    }}
                />
            </div>

            <Modal
                title={t.events.eventDetails}
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    setSelectedEvent(null);
                }}
                footer={null}
                destroyOnHidden
                maskClosable
            >
                {selectedEvent && (
                    <>
                        <Descriptions column={1} bordered>
                            <Descriptions.Item label={t.events.name}>{selectedEvent.title}</Descriptions.Item>
                            <Descriptions.Item label={t.events.description}>{selectedEvent.text}</Descriptions.Item>
                            <Descriptions.Item label={t.events.type}>
                                {selectedEvent.type.map((tag: string) => (
                                    <Tag key={tag}>{getEventTypeLabel(tag)}</Tag>
                                ))}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t.events.date}>{dayjs(selectedEvent.date).format("DD.MM.YYYY")}</Descriptions.Item>
                            <Descriptions.Item
                                label={t.events.time}>{`${selectedEvent.time_from} - ${selectedEvent.time_to}`}</Descriptions.Item>
                            <Descriptions.Item label={t.events.place}>{selectedEvent.place}</Descriptions.Item>
                            <Descriptions.Item label={t.events.classrooms}>
                                {selectedEvent.classrooms.map((cls: any) => (
                                    <Tag key={cls.id}>{cls.name}</Tag>
                                ))}
                            </Descriptions.Item>
                            <Descriptions.Item label={t.events.assignedBy}>
                                {selectedEvent.creator.name} ({selectedEvent.creator.email})
                            </Descriptions.Item>
                        </Descriptions>
                        <EventReflectionEditor eventId={selectedEvent.id} />
                    </>
                )}
            </Modal>
        </div>
    );
};