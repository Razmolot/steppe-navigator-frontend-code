// returns amount of days in month by getting previous date from the start of next month
export function getMonthDaysAmount(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
