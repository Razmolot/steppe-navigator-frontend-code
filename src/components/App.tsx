import { updateEventsSelector, useCalendarWidgetStore } from './CalendarWidget/store'
import { CalendarWidget } from './CalendarWidget'
import { useEffect } from 'react'
import { events } from './data/events'

export function App() {
  const updateEvents = useCalendarWidgetStore(updateEventsSelector)
  
  useEffect(() => {
    updateEvents(events)
  }, [])

  return (
    <>
      <CalendarWidget />
    </>
  )
}
