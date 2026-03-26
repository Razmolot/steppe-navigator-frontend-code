import { getMonthDaysStartOffset } from './get-month-days-offset'
import { daysPerWeek } from '../constants'

// returns the first day of given week in given month 
export function getFirstDayOfWeek(year: number, month: number, week: number) {
  return new Date(year, month, week * daysPerWeek - getMonthDaysStartOffset(year, month) + 1)
}
