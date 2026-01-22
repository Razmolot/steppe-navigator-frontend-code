import { updateCurrentYearSelector, useCalendarWidgetStore, updateCurrentMonthSelector, updateCurrentWeekSelector, updateCurrentDaySelector } from '../store'
import { useEffect } from 'react'

export function useInitialValues(year: number, month: number, week: number, day: number) {
  const updateCurrentYear = useCalendarWidgetStore(updateCurrentYearSelector)
  const updateCurrentMonth = useCalendarWidgetStore(updateCurrentMonthSelector)
  const updateCurrentWeek = useCalendarWidgetStore(updateCurrentWeekSelector)
  const updateCurrentDay = useCalendarWidgetStore(updateCurrentDaySelector)

  useEffect(() => {
    updateCurrentYear(year)
    updateCurrentMonth(month)
    updateCurrentWeek(week)
    updateCurrentDay(day)
  }, [])
}
