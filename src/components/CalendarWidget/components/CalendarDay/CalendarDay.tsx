import type {CalendarEvent} from '../../../entities/event.interface'
import {CalendarEventItem} from '../CalendarEventItem'
import {useDateEvents} from '../../hooks/use-date-events'
import {getDateData} from '../../utils/get-date-data'
import './CalendarDay.css'

interface CalendarDayProps {
    date: number

    onEventClick?: (event: any) => void
    onDayClick?: (date: Date) => void
    isActive?: boolean
    isDisabled?: boolean
}

export function CalendarDay({
                                date,

                                onEventClick = () => {
                                },
                                onDayClick,
                                isActive = false,
                                isDisabled = false
                            }: CalendarDayProps) {
    const events: CalendarEvent[] = useDateEvents(date)

    const {day} = getDateData(date)

    const handleDayClick = (e: React.MouseEvent) => {
        // Не срабатывать если клик был на событии
        if ((e.target as HTMLElement).closest('.calendar-event')) {
            return
        }
        if (!isDisabled && onDayClick) {
            onDayClick(new Date(date))
        }
    }

    return (
        <div
            className={`calendar-day ${isActive && 'calendar-day--active'} ${isDisabled && 'calendar-day--disabled'} ${onDayClick && !isDisabled ? 'calendar-day--clickable' : ''}`}
            onClick={handleDayClick}
        >
            <div className="calendar-day__header">
                <div className="calendar-day__number">{day}</div>
            </div>
            <div className="calendar-day__body">
                {events.map(event => (
                    <CalendarEventItem
                        event={event}
                        key={event.id}
                        onClick={() => onEventClick?.(event)}
                    />
                ))}
            </div>
        </div>
    )
}