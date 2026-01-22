import { displayModeSelector, updateDisplayModeSelector, useCalendarWidgetStore } from '../../store'
import { calendarModeMonth, calendarModeWeek } from '../../constants'
import { useTranslation } from '../../../../hooks/useTranslation'
import './CalendarModeToggler.css'

export function CalendarModeToggler() {
  const mode = useCalendarWidgetStore(displayModeSelector)
  const updateDisplayMode = useCalendarWidgetStore(updateDisplayModeSelector)
  const { t } = useTranslation()

  return (
    <div className="calendar-mode-toggler">
      <div 
        className={`calendar-mode-toggler__item ${mode === calendarModeMonth && 'active'}`}
        onClick={() => updateDisplayMode(calendarModeMonth)}
      >
        {t.events.month}
      </div>

      <div 
        className={`calendar-mode-toggler__item ${mode === calendarModeWeek && 'active'}`}
        onClick={() => updateDisplayMode(calendarModeWeek)}
      >
        {t.events.week}
      </div>
    </div>
  )
}