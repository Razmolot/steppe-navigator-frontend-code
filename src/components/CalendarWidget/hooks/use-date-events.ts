import { eventsSelector, useCalendarWidgetStore } from '../store'
import { getDateData } from '../utils/get-date-data'

export function useDateEvents(date: number) {
  const events = useCalendarWidgetStore(eventsSelector)

  return events.filter(event => {
    const eventData = getDateData(new Date(event.date).getTime())
    const currentData = getDateData(date)

    return (
      eventData.year === currentData.year && 
      eventData.month === currentData.month && 
      eventData.day === currentData.day
    )
  })
}
