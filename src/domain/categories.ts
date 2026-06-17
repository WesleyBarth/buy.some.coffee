import {
  incomeCategoryName,
  incomeProjectionCategoryNames,
  legacySubscriptionCategoryName,
  monthlyRecurringCategoryName,
  subscriptionCategoryName,
} from './defaults'

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
