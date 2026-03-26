import {
    currentMonthSelector,
    currentWeekSelector,
    currentYearSelector,
    displayModeSelector,
    useCalendarWidgetStore
} from '../../store'
import {calendarModeMonth, calendarModeWeek} from '../../constants'
import {CalendarMonth} from '../CalendarMonth'
import {CalendarWeek} from '../CalendarWeek'
import "./CalendarBody.css"

interface CalendarBodyProps {
    onEventClick?: (event: any) => void
    onDayClick?: (date: Date) => void
}

export function CalendarBody({onEventClick, onDayClick}: CalendarBodyProps) {
    const displayMode = useCalendarWidgetStore(displayModeSelector)

    const year = useCalendarWidgetStore(currentYearSelector)
    const month = useCalendarWidgetStore(currentMonthSelector)
    const week = useCalendarWidgetStore(currentWeekSelector)

    return (
        <div className="calendar-body">
            {displayMode === calendarModeMonth ? (
                <CalendarMonth year={year} month={month} onEventClick={onEventClick} onDayClick={onDayClick}/>
            ) : null}

            {displayMode === calendarModeWeek ? (
                <CalendarWeek year={year} month={month} week={week} onEventClick={onEventClick} onDayClick={onDayClick}/>
            ) : null}
        </div>
    )
}