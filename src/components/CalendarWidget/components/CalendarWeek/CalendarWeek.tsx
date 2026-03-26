import {daysPerWeek} from '../../constants'
import {getFirstDayOfWeek} from '../../utils/get-first-day-of-week'
import {CalendarDay} from '../CalendarDay'
import {useTranslation} from '../../../../hooks/useTranslation'
import "./CalendarWeek.css"

interface CalendarWeekProps {
    year: number
    month: number
    week: number
    onEventClick?: (event: any) => void
    onDayClick?: (date: Date) => void
}

export function CalendarWeek({year, month, week, onEventClick, onDayClick}: CalendarWeekProps) {
    const firstDayOfWeek = getFirstDayOfWeek(year, month, week).getDate()
    const { t } = useTranslation()
    const weekdaysNames = t.events.weekdays as string[]

    return (
        <div className="calendar-week calendar-grid">
            {weekdaysNames.map(weekday => (
                <div
                    className="calendar-header-cell"
                    key={weekday}
                >
                    {weekday}
                </div>
            ))}

            {new Array(daysPerWeek).fill(0).map((_, index) => (
                <CalendarDay
                    date={new Date(year, month, firstDayOfWeek + index).getTime()}
                    key={index}
                    onEventClick={onEventClick}
                    onDayClick={onDayClick}
                />
            ))}
        </div>
    )
}