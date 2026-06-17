import { clampMonthDay, nextRecurringDueDate } from './dates'
import type { RecurringCashflow } from './types'

export function normalizeRecurringCashflow(item: RecurringCashflow): RecurringCashflow {
  const day = clampMonthDay(item.day)
  return {
    ...item,
    day,
    frequency: item.frequency ?? 'monthly',
    nextDueDate: item.nextDueDate ?? nextRecurringDueDate({ day, frequency: item.frequency ?? 'monthly' }),
  }
}

export function groupRecurringItemsByCategory(items: RecurringCashflow[], categoryLabels: string[]) {
  const categoryOrder = new Map(categoryLabels.map((category, index) => [category, index]))
  const groups = new Map<string, RecurringCashflow[]>()

  items.forEach((item) => {
    groups.set(item.category, [...(groups.get(item.category) ?? []), item])
  })

  return [...groups.entries()]
    .map(([category, groupItems]) => ({
      category,
      items: groupItems.toSorted((a, b) => a.day - b.day || a.name.localeCompare(b.name)),
      total: groupItems.reduce((sum, item) => sum + item.amount, 0),
    }))
    .sort(
      (a, b) =>
        (categoryOrder.get(a.category) ?? Number.MAX_SAFE_INTEGER) -
          (categoryOrder.get(b.category) ?? Number.MAX_SAFE_INTEGER) ||
        a.category.localeCompare(b.category),
    )
}
