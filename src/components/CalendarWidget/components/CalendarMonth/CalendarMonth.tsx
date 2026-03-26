import {getMonthDaysEndOffset, getMonthDaysStartOffset} from '../../utils/get-month-days-offset'
import {getMonthDaysAmount} from '../../utils/get-month-days-amount'
import {CalendarDay} from '../CalendarDay'
import {useTranslation} from '../../../../hooks/useTranslation'
import "./CalendarMonth.css"

interface CalendarMonthProps {
    year: number
    month: number
    onEventClick?: (event: any) => void
    onDayClick?: (date: Date) => void
}

export function CalendarMonth({year, month, onEventClick, onDayClick}: CalendarMonthProps) {
    const previousMonthInsertedDaysAmount = getMonthDaysStartOffset(year, month)
    const nextMonthInsertedDaysAmount = getMonthDaysEndOffset(year, month)
    const { t } = useTranslation()
    const weekdaysNames = t.events.weekdays as string[]

    function getPreviousMonthDateByInsertionIndex(index: number) {
        const date = getMonthDaysAmount(year, month - 1) - previousMonthInsertedDaysAmount + index + 1
        return new Date(year, month - 1, date)
    }

    function getNextMonthDateByInsertionIndex(index: number) {
        return new Date(year, month + 1, index + 1)
    }

    const daysAmount = getMonthDaysAmount(year, month)

    return (
        <div className="calendar-month calendar-grid">
            {weekdaysNames.map(weekday => (
                <div
                    className="calendar-header-cell"
                    key={weekday}
                >
                    {weekday}
                </div>
            ))}

            {new Array(previousMonthInsertedDaysAmount).fill(0).map((_, index) => (
                <CalendarDay
                    date={getPreviousMonthDateByInsertionIndex(index).getTime()}
                    isDisabled
                    key={index}
                    onEventClick={onEventClick}
                    onDayClick={onDayClick}
                />
            ))}

            {new Array(daysAmount).fill(0).map((_, index) => (
                <CalendarDay
                    date={new Date(year, month, index + 1).getTime()}
                    key={index}
                    onEventClick={onEventClick}
                    onDayClick={onDayClick}
                />
            ))}

            {new Array(nextMonthInsertedDaysAmount).fill(0).map((_, index) => (
                <CalendarDay
                    date={getNextMonthDateByInsertionIndex(index).getTime()}
                    isDisabled
                    key={index}
                    onEventClick={onEventClick}
                    onDayClick={onDayClick}
                />
            ))}
        </div>
    )
}