import { getMonthDaysStartOffset } from './get-month-days-offset'
import { daysPerWeek } from '../constants'

export function getDateData(moment: number) {
  const date = new Date(moment)

  const day = date.getDate()
  const month = date.getMonth()
  const year = date.getFullYear()

  const week = Math.floor((getMonthDaysStartOffset(year, month) + day - 1) / daysPerWeek)
  
  return { day, week, month, year }
}

export function getCurrentYear() {
  return getDateData(new Date().getTime()).year
}
export function getCurrentMonth() {
  return getDateData(new Date().getTime()).month
}
export function getCurrentWeek() {
  return getDateData(new Date().getTime()).week
}
export function getCurrentDay() {
  return getDateData(new Date().getTime()).day
}
