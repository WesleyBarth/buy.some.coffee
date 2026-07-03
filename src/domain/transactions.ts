import {
  categoryByName,
  resolveCategoryBudgetable,
  resolveCategoryRole,
} from './categories'
import type { Category, Transaction, TransactionRole, TransactionSortKey } from './types'

export function formatShortDate(value: string) {
  const [, , monthValue, dayValue] = value.match(/^(\d{4})-(\d{2})-(\d{2})$/) ?? []
  return monthValue && dayValue ? `${Number(monthValue)}/${Number(dayValue)}` : value
}

export function parseShortDate(value: string, year: string) {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})$/)
  const numericYear = Number(year)
  if (!match || !Number.isInteger(numericYear) || numericYear < 1900) return ''

  const monthValue = Number(match[1])
  const dayValue = Number(match[2])
  if (monthValue < 1 || monthValue > 12 || dayValue < 1 || dayValue > 31) return ''

  return `${numericYear}-${String(monthValue).padStart(2, '0')}-${String(dayValue).padStart(2, '0')}`
}

export function compareTransactions(
  a: Transaction,
  b: Transaction,
  key: TransactionSortKey,
  accountById: Map<string, string>,
) {
  if (key === 'amount') return a.amount - b.amount
  if (key === 'date') return a.date.localeCompare(b.date)
  if (key === 'year') return a.date.slice(0, 4).localeCompare(b.date.slice(0, 4))
  if (key === 'account') {
    return (accountById.get(a.accountId) ?? '').localeCompare(accountById.get(b.accountId) ?? '')
  }
  if (key === 'tags') return (a.tagIds ?? []).join('|').localeCompare((b.tagIds ?? []).join('|'))
  return String(a[key]).localeCompare(String(b[key]))
}

export function effectiveTransactionRole(transaction: Transaction, categories: Category[]): TransactionRole {
  if (transaction.role) return transaction.role

  const category = categoryByName(categories).get(transaction.category)
  const categoryRole = resolveCategoryRole(category, categories)
  if (categoryRole) return categoryRole

  return transaction.amount > 0 ? 'external_income' : 'external_expense'
}

export function isExternalExpense(transaction: Transaction, categories: Category[]) {
  return effectiveTransactionRole(transaction, categories) === 'external_expense'
}

export function isExternalIncome(transaction: Transaction, categories: Category[]) {
  return effectiveTransactionRole(transaction, categories) === 'external_income'
}

export function isBudgetSpend(transaction: Transaction, categories: Category[]) {
  const category = categoryByName(categories).get(transaction.category)
  return (
    isExternalExpense(transaction, categories) &&
    resolveCategoryBudgetable(category, categories)
  )
}
