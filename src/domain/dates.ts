import type { RecurringCashflow, RecurringFrequency } from './types'

export function daysInMonth(monthValue: string) {
  const [year, monthNumber] = monthValue.split('-').map(Number)
  return new Date(year, monthNumber, 0).getDate()
}

export function clampMonthDay(day: number) {
  if (Number.isNaN(day)) return 1
  return Math.min(Math.max(Math.round(day), 1), 31)
}

export function frequencyMonths(frequency: RecurringFrequency) {
  const months: Record<RecurringFrequency, number> = {
    monthly: 1,
    quarterly: 3,
    semi_annual: 6,
    annual: 12,
  }
  return months[frequency]
}

export function dueDateForMonthDay(monthValue: string, day: number) {
  return `${monthValue}-${String(Math.min(clampMonthDay(day), daysInMonth(monthValue))).padStart(2, '0')}`
}

export function localDatePart(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayDateString() {
  return localDatePart(new Date())
}

export function currentMonthString() {
  return todayDateString().slice(0, 7)
}

export function nextRecurringDueDate(
  item: Pick<RecurringCashflow, 'day' | 'frequency' | 'nextDueDate'>,
  fromDate = todayDateString(),
) {
  if (item.frequency === 'monthly') {
    const currentMonthDueDate = dueDateForMonthDay(fromDate.slice(0, 7), item.day)
    if (currentMonthDueDate >= fromDate) return currentMonthDueDate
    return dueDateForMonthDay(addMonthsToMonth(fromDate.slice(0, 7), 1), item.day)
  }

  let dueDate = item.nextDueDate || dueDateForMonthDay(fromDate.slice(0, 7), item.day)
  while (dueDate < fromDate) {
    dueDate = addMonthsToDate(dueDate, frequencyMonths(item.frequency))
  }
  return dueDate
}

export function addMonthsToMonth(monthValue: string, monthsToAdd: number) {
  const [year, monthNumber] = monthValue.split('-').map(Number)
  const date = new Date(Date.UTC(year, monthNumber - 1 + monthsToAdd, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

export function addMonthsToDate(dateValue: string, monthsToAdd: number) {
  const [year, monthNumber, day] = dateValue.split('-').map(Number)
  const nextMonth = addMonthsToMonth(`${year}-${String(monthNumber).padStart(2, '0')}`, monthsToAdd)
  return dueDateForMonthDay(nextMonth, day)
}

export function formatMonthLabel(month: string) {
  const [year, monthValue] = month.split('-').map(Number)
  if (!year || !monthValue) return month
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(
    new Date(year, monthValue - 1, 1),
  )
}
