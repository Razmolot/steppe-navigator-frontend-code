import { daysPerWeek } from '../constants'

// returns amount of days from previous month in the first week of current month
export function getMonthDaysStartOffset(year: number, month: number) {
  const date = new Date(year, month, 1)
  return (date.getDay() + daysPerWeek) % daysPerWeek
}

// returns amount of days from next month in the last week of current month
export function getMonthDaysEndOffset(year: number, month: number) {
  const date = new Date(year, month + 1, 0)
  return (daysPerWeek - date.getDay() - 1) % daysPerWeek
}
