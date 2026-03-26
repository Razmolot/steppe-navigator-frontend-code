import { getCurrentDay, getCurrentMonth, getCurrentWeek, getCurrentYear } from './utils/get-date-data'
import { calendarModeMonth, type CalendarMode } from './constants'
import type { CalendarEvent } from '../entities/event.interface'
import { create } from 'zustand'

export interface CalendarWidgetState {
  currentYear: number
  currentMonth: number
  currentWeek: number
  currentDay: number

  displayMode: CalendarMode

  events: CalendarEvent[]
}

export interface CalendarWidgetActions {
  updateCurrentYear: (year: number) => void
  updateCurrentMonth: (month: number) => void
  updateCurrentDay: (day: number) => void
  updateCurrentWeek: (day: number) => void

  updateDisplayMode: (mode: CalendarMode) => void

  updateEvents: (events: CalendarEvent[]) => void,
}

export interface CalendarWidgetStore extends CalendarWidgetState, CalendarWidgetActions {}

export const useCalendarWidgetStore = create<CalendarWidgetStore>(set => ({
  currentYear: getCurrentYear(),
  currentMonth: getCurrentMonth(),
  currentWeek: getCurrentWeek(),
  currentDay: getCurrentDay(),

  displayMode: calendarModeMonth,

  events: [],

  updateCurrentYear: (year) => set(state => ({ ...state, currentYear: year })),
  updateCurrentMonth: (month) => set(state => ({ ...state, currentMonth: month })),
  updateCurrentDay: (day) => set(state => ({ ...state, currentDay: day })),
  updateCurrentWeek: (week) => set(state => ({ ...state, currentWeek: week })),

  updateDisplayMode: (mode) => set(state => ({ ...state, displayMode: mode })),

  updateEvents: (events) => set(state => ({ ...state, events })),
}))

export const currentYearSelector = (store: CalendarWidgetStore) => store.currentYear
export const currentMonthSelector = (store: CalendarWidgetStore) => store.currentMonth
export const currentWeekSelector = (store: CalendarWidgetStore) => store.currentWeek
export const currentDaySelector = (store: CalendarWidgetStore) => store.currentDay

export const displayModeSelector = (store: CalendarWidgetStore) => store.displayMode
export const eventsSelector = (store: CalendarWidgetStore) => store.events

export const updateCurrentYearSelector = (store: CalendarWidgetStore) => store.updateCurrentYear
export const updateCurrentMonthSelector = (store: CalendarWidgetStore) => store.updateCurrentMonth
export const updateCurrentWeekSelector = (store: CalendarWidgetStore) => store.updateCurrentWeek
export const updateCurrentDaySelector = (store: CalendarWidgetStore) => store.updateCurrentDay

export const updateDisplayModeSelector = (store: CalendarWidgetStore) => store.updateDisplayMode
export const updateEventsSelector = (store: CalendarWidgetStore) => store.updateEvents
