import { categoryAndDescendantNames, categoryByName } from './categories'
import { isBudgetSpend } from './transactions'
import type { Category, Transaction } from './types'

export function buildMonthPositionTrend({
  currentCashPosition,
  projectedMonthEndPosition,
}: {
  currentCashPosition: number
  projectedMonthEndPosition: number
}) {
  return [
    { date: 'Current', expected: currentCashPosition, tracked: currentCashPosition },
    { date: 'Month end', expected: currentCashPosition, tracked: projectedMonthEndPosition },
  ]
}

export function buildSpendByCategory(categoryLabels: string[], currentMonthTransactions: Transaction[], categories: Category[]) {
  const categoryLookup = categoryByName(categories)

  return categoryLabels
    .map((category) => {
      const categoryItem = categoryLookup.get(category)
      const categoryNames = categoryItem ? categoryAndDescendantNames(categoryItem, categories) : new Set([category])
      return {
        category,
        spent: currentMonthTransactions
          .filter((transaction) => categoryNames.has(transaction.category) && isBudgetSpend(transaction, categories))
          .reduce((sum, transaction) => sum - transaction.amount, 0),
      }
    })
    .filter((item) => item.spent > 0)
    .sort((a, b) => b.spent - a.spent)
}
