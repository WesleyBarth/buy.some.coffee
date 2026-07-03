import {
  incomeCategoryName,
  incomeProjectionCategoryNames,
  legacySubscriptionCategoryName,
  monthlyRecurringCategoryName,
  subscriptionCategoryName,
  uncategorizedCategoryName,
} from './defaults'
import type { Category, TransactionRole } from './types'

export function categoryById(categories: Category[]) {
  return new Map(categories.map((category) => [category.id, category]))
}

export function categoryByName(categories: Category[]) {
  return new Map(categories.map((category) => [category.name, category]))
}

export function categoryAncestors(category: Category, categories: Category[]) {
  const byId = categoryById(categories)
  const ancestors: Category[] = []
  const visited = new Set<string>([category.id])
  let parentId = category.parentId

  while (parentId) {
    if (visited.has(parentId)) break
    const parent = byId.get(parentId)
    if (!parent) break
    ancestors.push(parent)
    visited.add(parent.id)
    parentId = parent.parentId
  }

  return ancestors
}

export function categoryAndDescendantNames(category: Category, categories: Category[]) {
  const names = new Set([category.name])
  for (const descendant of categoryAndDescendants(category, categories)) {
    names.add(descendant.name)
  }

  return names
}

export function categoryAndDescendantIds(category: Category, categories: Category[]) {
  const ids = new Set([category.id])
  for (const descendant of categoryAndDescendants(category, categories)) {
    ids.add(descendant.id)
  }

  return ids
}

function categoryAndDescendants(category: Category, categories: Category[]) {
  const descendants: Category[] = []
  const childrenByParentId = new Map<string, Category[]>()

  for (const item of categories) {
    if (!item.parentId) continue
    childrenByParentId.set(item.parentId, [...(childrenByParentId.get(item.parentId) ?? []), item])
  }

  const pending = [...(childrenByParentId.get(category.id) ?? [])]
  const visited = new Set([category.id])
  while (pending.length > 0) {
    const child = pending.shift()
    if (!child || visited.has(child.id)) continue
    visited.add(child.id)
    descendants.push(child)
    pending.push(...(childrenByParentId.get(child.id) ?? []))
  }

  return descendants
}

export function legacyCategoryRole(category: Pick<Category, 'name' | 'type'>): TransactionRole | undefined {
  if (category.name === uncategorizedCategoryName) return undefined
  if (category.type === 'income') return 'external_income'
  if (category.type === 'transfer') return 'internal_transfer'
  if (category.type === 'expense') return 'external_expense'
  return undefined
}

export function resolveCategoryRole(category: Category | undefined, categories: Category[]) {
  if (!category) return undefined
  for (const candidate of [category, ...categoryAncestors(category, categories)]) {
    const role = candidate.role ?? legacyCategoryRole(candidate)
    if (role) return role
  }
  return undefined
}

export function resolveCategoryBudgetable(category: Category | undefined, categories: Category[]) {
  if (!category) return true
  for (const candidate of [category, ...categoryAncestors(category, categories)]) {
    if (candidate.budgetable === false) return false
  }
  return true
}

export function isSubscriptionCategory(category: string) {
  const normalized = normalizeText(category)
  return normalized === normalizeText(subscriptionCategoryName) || normalized === normalizeText(legacySubscriptionCategoryName)
}

export function isIncomeCategory(category: string) {
  const normalized = normalizeText(category)
  return incomeProjectionCategoryNames.some((name) => normalized === normalizeText(name))
}

export function isProjectionCategory(category: string) {
  return (
    isIncomeCategory(category) ||
    category === monthlyRecurringCategoryName ||
    isSubscriptionCategory(category)
  )
}

export function normalizeCategory(value: string) {
  const category = value.trim()
  if (!category) return 'Uncategorized'
  if (category.toLowerCase() === 'income') return incomeCategoryName
  return category
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}
