import {getCurrentDay, getCurrentMonth, getCurrentWeek, getCurrentYear} from './utils/get-date-data'
import {CalendarSettings} from './components/CalendarSettings'
import {useInitialValues} from './hooks/use-initial-values'
import {CalendarBody} from './components/CalendarBody'
import './CalendarWidget.css'
import {useEffect} from 'react'
import {
    currentMonthSelector,
    currentWeekSelector,
    currentYearSelector,
    displayModeSelector,
    useCalendarWidgetStore
} from './store'
import {calendarModeMonth, calendarModeWeek} from './constants'
import dayjs from 'dayjs'

interface CalendarWidgetProps {
    initialYear?: number
    initialMonth?: number
    initialWeek?: number
    initialDay?: number
    onDateRangeChange?: (dateFrom: string, dateTo: string) => void
    onEventClick?: (event: any) => void
    onDayClick?: (date: Date) => void
}

export function CalendarWidget({
                                   initialYear = getCurrentYear(),
                                   initialMonth = getCurrentMonth(),
                                   initialWeek = getCurrentWeek(),
                                   initialDay = getCurrentDay(),
                                   onDateRangeChange,
                                   onEventClick,
                                   onDayClick
                               }: CalendarWidgetProps) {
    useInitialValues(initialYear, initialMonth, initialWeek, initialDay)

    const year = useCalendarWidgetStore(currentYearSelector)
    const month = useCalendarWidgetStore(currentMonthSelector)
    const week = useCalendarWidgetStore(currentWeekSelector)
    const mode = useCalendarWidgetStore(displayModeSelector)

    useEffect(() => {
        if (!onDateRangeChange) return

        const dateFrom = dayjs().year(year).month(month).startOf('month').format('YYYY-MM-DD');
        const dateTo = dayjs().year(year).month(month).endOf('month').format('YYYY-MM-DD');

        onDateRangeChange(dateFrom, dateTo)
    }, [year, month, week, mode, onDateRangeChange])

    return (
        <div className="calendar-widget">
            <CalendarSettings/>
            <CalendarBody onEventClick={onEventClick} onDayClick={onDayClick}/>
        </div>
    )
}