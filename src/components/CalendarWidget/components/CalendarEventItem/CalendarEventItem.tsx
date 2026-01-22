import type {CalendarEvent} from '../../../entities/event.interface'
import {Fragment} from 'react/jsx-runtime'
import {Popover} from 'antd'
import './CalendarEventItem.css'

interface CalendarEventItemProps {
    event: CalendarEvent
    onClick?: () => void
}

export function CalendarEventItem({event, onClick }: CalendarEventItemProps) {
    const content = (
        <div className="calendar-event__popover">
            <div className="calendar-event__popover-header">
                <div className="calendar-event__popover-title">{event.title}</div>
            </div>
            <div className="calendar-event__popover-body">
                <div className="calendar-event__popover-time">{event.time_from} - {event.time_to}</div>
                <div className="calendar-event__popover-classroom">
                    {event.classrooms.map((room, index) => (
                        <Fragment key={index}>
                            {room.name}
                        </Fragment>
                    ))}
                </div>
            </div>
        </div>
    )

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        onClick?.()
    }

    return (
        <div className="calendar-event" onClick={handleClick}>
            <Popover
                placement='bottomRight'
                content={content}
            >
                <div className="calendar-event__inner">
                    <div className="calendar-event__indicator"></div>
                    <div className="calendar-event__body">
                        <div className="calendar-event__time">{event.time_from} - {event.time_to}</div>
                        <div className="calendar-event__title">{event.title}</div>
                    </div>
                </div>
            </Popover>
        </div>
    )
}