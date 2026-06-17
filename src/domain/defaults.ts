import { currentMonthString } from './dates'
import type {
  Account,
  AccountType,
  Budget,
  Category,
  NetWorthSnapshot,
  RecurringCashflow,
  Tag,
  Transaction,
  TransactionMatchRule,
} from './types'

export const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export const categoryNames = ['Uncategorized']

export const categoryColors: Record<string, string> = {
  Uncategorized: '#737985',
  Income: '#187b63',
  'Regular Income': '#187b63',
  'Irregular Income': '#2f8f7a',
  Expense: '#c47a23',
  'Subscription or Service': '#7b5ea7',
  'Subscriptions & Services': '#7b5ea7',
  'Monthly Recurring': '#2f6f9f',
  Transfers: '#737985',
  Review: '#b87925',
  Other: '#737985',
}

export const categoryPalette = Object.values(categoryColors)
export const accountTypes: AccountType[] = ['checking', 'savings', 'credit', 'investment', 'loan', 'cash']
export const initialMonth = currentMonthString()
export const uncategorizedCategoryName = 'Uncategorized'
export const incomeCategoryName = 'Income'
export const regularIncomeCategoryName = 'Regular Income'
export const irregularIncomeCategoryName = 'Irregular Income'
export const incomeProjectionCategoryNames = [regularIncomeCategoryName, irregularIncomeCategoryName, incomeCategoryName]
export const monthlyRecurringCategoryName = 'Monthly Recurring'
export const subscriptionCategoryName = 'Subscription or Service'
export const legacySubscriptionCategoryName = 'Subscriptions & Services'
export const transferCategoryName = 'Transfers'
export const archivedDefaultCategoryNames = [
  'Expense',
  subscriptionCategoryName,
  legacySubscriptionCategoryName,
  monthlyRecurringCategoryName,
  transferCategoryName,
  'Review',
  'Other',
]
export const monthlySavingsGoal = 1000

export const initialCategories: Category[] = categoryNames.map((name) => ({
  id: `cat-${name.toLowerCase()}`,
  name,
  color: categoryColors[name],
  type: 'expense',
  budgetable: true,
  isArchived: false,
}))

export const initialTags: Tag[] = [
  { id: 'tag-annual', name: 'Annual', color: '#3f7c8c' },
  { id: 'tag-variable', name: 'Variable', color: '#b87925' },
  { id: 'tag-one-time', name: 'One-Time', color: '#737985' },
  { id: 'tag-streaming', name: 'Streaming', color: '#8b6bb1' },
  { id: 'tag-software', name: 'Software', color: '#365f8c' },
  { id: 'tag-cloud', name: 'Cloud', color: '#5d7896' },
  { id: 'tag-phone', name: 'Phone', color: '#4f6f52' },
  { id: 'tag-internet', name: 'Internet', color: '#4f6f52' },
  { id: 'tag-gym', name: 'Gym', color: '#187b63' },
  { id: 'tag-rent', name: 'Rent', color: '#2f6f9f' },
  { id: 'tag-payroll', name: 'Payroll', color: '#187b63' },
  { id: 'tag-card-payment', name: 'Card Payment', color: '#737985' },
  { id: 'tag-reimbursement', name: 'Reimbursement', color: '#14795d' },
  { id: 'tag-tax-deductible', name: 'Tax Deductible', color: '#365f8c' },
  { id: 'tag-needs-match', name: 'Needs Match', color: '#c47a23' },
  { id: 'tag-price-changed', name: 'Price Changed', color: '#b87925' },
]

export const initialAccounts: Account[] = [
  { id: 'acct-checking', name: 'Everyday Checking', type: 'checking', balance: 4120, institution: '' },
  { id: 'acct-savings', name: 'Emergency Savings', type: 'savings', balance: 18400, institution: '' },
  { id: 'acct-card', name: 'Rewards Card', type: 'credit', balance: -830, institution: '' },
  { id: 'acct-invest', name: 'Brokerage', type: 'investment', balance: 36200, institution: '' },
]

export const initialTransactions: Transaction[] = [
  {
    id: 'txn-1',
    date: `${initialMonth}-03`,
    accountId: 'acct-checking',
    description: 'Payroll deposit',
    category: uncategorizedCategoryName,
    amount: 5200,
    source: 'manual',
  },
  {
    id: 'txn-2',
    date: `${initialMonth}-04`,
    accountId: 'acct-checking',
    description: 'Rent',
    category: uncategorizedCategoryName,
    amount: -1850,
    source: 'manual',
  },
  {
    id: 'txn-3',
    date: `${initialMonth}-06`,
    accountId: 'acct-card',
    description: 'City Market',
    category: uncategorizedCategoryName,
    amount: -126,
    source: 'manual',
  },
  {
    id: 'txn-4',
    date: `${initialMonth}-09`,
    accountId: 'acct-card',
    description: 'Coffee subscription',
    category: uncategorizedCategoryName,
    amount: -18,
    source: 'manual',
  },
  {
    id: 'txn-5',
    date: `${initialMonth}-14`,
    accountId: 'acct-card',
    description: 'Dinner',
    category: uncategorizedCategoryName,
    amount: -84,
    source: 'manual',
  },
]

export const initialBudgets: Budget[] = []
export const initialSubscriptionServices: RecurringCashflow[] = []
export const initialMonthlyRecurring: RecurringCashflow[] = []
export const initialMatchRules: TransactionMatchRule[] = []

export const initialSnapshots: NetWorthSnapshot[] = [
  { id: 'nw-1', date: '2026-01-31', assets: 52000, liabilities: 7200 },
  { id: 'nw-2', date: '2026-02-28', assets: 54600, liabilities: 6800 },
  { id: 'nw-3', date: '2026-03-31', assets: 56800, liabilities: 6100 },
  { id: 'nw-4', date: '2026-04-30', assets: 59000, liabilities: 5400 },
  { id: 'nw-5', date: '2026-05-27', assets: 61720, liabilities: 4630 },
]
