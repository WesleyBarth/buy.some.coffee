import { categoryAndDescendantNames } from './categories'
import { isBudgetSpend } from './transactions'
import type { Budget, Category, Transaction } from './types'

export type BudgetRow = {
  id: string
  month: string
  category: string
  planned: number
  spent: number
  expected: number
  remaining: number
  usageRatio: number
}

export type BudgetSummary = {
  totalPlannedBudget: number
  totalBudgetSpent: number
  totalBudgetRemaining: number
  totalBudgetOverage: number
  totalBudgetUsageRatio: number
  remainingPlannedSpend: number
}

export function buildBudgetRows({
  budgetableCategories,
  budgets,
  categories,
  currentMonth,
  variableTransactions,
  normalizeCategoryId,
}: {
  budgetableCategories: Category[]
  budgets: Budget[]
  categories: Category[]
  currentMonth: string
  variableTransactions: Transaction[]
  normalizeCategoryId: (category: string) => string
}) {
  return budgetableCategories.map((category) => {
    const budget = budgets.find((item) => item.month === currentMonth && item.category === category.name)
    const categoryNames = categoryAndDescendantNames(category, categories)
    const spent = variableTransactions
      .filter((transaction) => categoryNames.has(transaction.category) && isBudgetSpend(transaction, categories))
      .reduce((sum, transaction) => sum - transaction.amount, 0)
    const planned = budget?.planned ?? 0
    const usageRatio = planned > 0 ? spent / planned : spent > 0 ? 1 : 0
    return {
      id: budget?.id ?? `budget-${normalizeCategoryId(category.name)}`,
      month: currentMonth,
      category: category.name,
      planned,
      spent,
      expected: 0,
      remaining: planned - spent,
      usageRatio,
    }
  })
}

export function applyBudgetDrafts(budgetRows: BudgetRow[], budgetDrafts: Record<string, string>, currentMonth: string) {
  return budgetRows.map((budget) => {
    const draft = budgetDrafts[budgetDraftKey(currentMonth, budget.category)]
    if (draft === undefined) return budget
    if (draft.trim() === '') return { ...budget, planned: 0, remaining: -budget.spent }

    const draftPlanned = Number(draft)
    if (!Number.isFinite(draftPlanned)) return budget

    const planned = Math.max(0, draftPlanned)
    return { ...budget, planned, remaining: planned - budget.spent }
  })
}

export function summarizeBudgets(budgetRows: BudgetRow[]): BudgetSummary {
  const totalPlannedBudget = budgetRows.reduce((sum, budget) => sum + budget.planned, 0)
  const totalBudgetSpent = budgetRows.reduce((sum, budget) => sum + budget.spent, 0)
  const totalBudgetRemaining = totalPlannedBudget - totalBudgetSpent
  const totalBudgetOverage = budgetRows.reduce((sum, budget) => sum + Math.max(budget.spent - budget.planned, 0), 0)
  const totalBudgetUsageRatio = totalPlannedBudget > 0 ? totalBudgetSpent / totalPlannedBudget : totalBudgetSpent > 0 ? 1 : 0
  const remainingPlannedSpend = budgetRows.reduce((sum, budget) => sum + Math.max(budget.remaining, 0), 0)

  return {
    totalPlannedBudget,
    totalBudgetSpent,
    totalBudgetRemaining,
    totalBudgetOverage,
    totalBudgetUsageRatio,
    remainingPlannedSpend,
  }
}

export function budgetDraftKey(month: string, category: string) {
  return `${month}:${category}`
}

export function budgetUsageColor(ratio: number) {
  if (ratio >= 1) return '#ff2f2f'

  const clampedRatio = Math.min(Math.max(ratio, 0), 1)
  const hue = 145 - clampedRatio * 110
  const saturation = 70 + clampedRatio * 15
  const lightness = 42 + clampedRatio * 8
  return `hsl(${hue} ${saturation}% ${lightness}%)`
}
