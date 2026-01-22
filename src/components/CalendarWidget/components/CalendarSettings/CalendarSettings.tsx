import { currentMonthSelector, currentYearSelector, useCalendarWidgetStore } from '../../store'
import { yearsOptionsAmount } from '../../constants'
import { CalendarModeToggler } from '../CalendarModeToggler'
import { Select } from 'antd'
import { getCurrentYear } from '../../utils/get-date-data'
import { useActions } from '../../hooks/use-actions'
import { useTranslation } from '../../../../hooks/useTranslation'
import './CalendarSettings.css'

export function CalendarSettings() {
  const year = useCalendarWidgetStore(currentYearSelector)
  const month = useCalendarWidgetStore(currentMonthSelector)
  const { t } = useTranslation()
  const monthsNames = t.events.months as string[]

  const { 
    setYear, 
    setMonth
  } = useActions()

  return (
    <div className="calendar-settings">
      <Select
        value={year}
        onChange={setYear}
        options={new Array(yearsOptionsAmount).fill(0).map((_, index) => ({
          value: getCurrentYear() - index,
          label: getCurrentYear() - index,
        }))}
      />

      <Select
        value={month}
        onChange={setMonth}
        options={monthsNames.map((month, index) => ({
          value: index,
          label: month,
        }))}
      >
      </Select>

      <CalendarModeToggler />
    </div>
  )
}
