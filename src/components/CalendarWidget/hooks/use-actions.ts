import { currentDaySelector, currentMonthSelector, currentWeekSelector, currentYearSelector, updateCurrentDaySelector, updateCurrentMonthSelector, updateCurrentWeekSelector, updateCurrentYearSelector, useCalendarWidgetStore } from '../store'
import { getMonthDaysStartOffset } from '../utils/get-month-days-offset'
import { getDateData } from '../utils/get-date-data'
import { daysPerWeek } from '../constants'

export function useActions() {
  const year = useCalendarWidgetStore(currentYearSelector)
  const month = useCalendarWidgetStore(currentMonthSelector)
  const week = useCalendarWidgetStore(currentWeekSelector)
  const day = useCalendarWidgetStore(currentDaySelector)

  const updateYear = useCalendarWidgetStore(updateCurrentYearSelector)
  const updateMonth = useCalendarWidgetStore(updateCurrentMonthSelector)
  const updateDay = useCalendarWidgetStore(updateCurrentDaySelector)
  const updateWeek = useCalendarWidgetStore(updateCurrentWeekSelector)

  function setYear(newYear: number) {
    const newDateData = new Date(newYear, month, day).getTime()
    updateDateData(newDateData)
  }

  function setMonth(newMonth: number) {
    const newDateData = new Date(year, newMonth, day).getTime()
    updateDateData(newDateData)
  }
  function incrementMonth() {
    setMonth(month + 1)
  }
  function decrementMonth() {
    setMonth(month - 1)
  }

  function setWeek(newWeek: number) {
    const daysOffset = getMonthDaysStartOffset(year, month)
    const newDay = newWeek * daysPerWeek - daysOffset + 1

    const newDateData = new Date(year, month, newDay).getTime()
    updateDateData(newDateData)
  }
  function incrementWeek() {
    setWeek(week + 1)
  }
  function decrementWeek() {
    setWeek(week - 1)
  }

  function setDay(newDay: number) {
    const newDateData = new Date(year, month, newDay).getTime()
    updateDateData(newDateData)
  }

  return { 
    setYear,
    setMonth,
    incrementMonth,
    decrementMonth,
    setWeek,
    incrementWeek,
    decrementWeek,
    setDay,
  }

  function updateDateData(date: number) {
    const dateData = getDateData(date)

    updateYear(dateData.year)
    updateMonth(dateData.month)
    updateWeek(dateData.week)
    updateDay(dateData.day)
  }
}
