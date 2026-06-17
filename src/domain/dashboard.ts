import type { Transaction } from './types'

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

export function buildSpendByCategory(categoryLabels: string[], currentMonthTransactions: Transaction[]) {
  return categoryLabels
    .map((category) => ({
      category,
      spent: Math.abs(
        currentMonthTransactions
          .filter((transaction) => transaction.category === category && transaction.amount < 0)
          .reduce((sum, transaction) => sum + transaction.amount, 0),
      ),
    }))
    .filter((item) => item.spent > 0)
    .sort((a, b) => b.spent - a.spent)
}
