export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'loan' | 'cash'

export type TransactionRole =
  | 'external_expense'
  | 'external_income'
  | 'internal_transfer'
  | 'credit_card_payment'
  | 'balance_adjustment'
  | 'investment_movement'
  | 'ignore'

export type PlaidModeledOutcome =
  | 'import'
  | 'duplicate'
  | 'credit_card_payment'
  | 'internal_transfer'
  | 'needs_review'

export type ReconciliationStatus = 'current' | 'needs_review' | 'unmapped'

export type Account = {
  id: string
  name: string
  type: AccountType
  balance: number
  institution?: string
  isArchived?: boolean
}

export type Category = {
  id: string
  name: string
  color: string
  type?: 'income' | 'expense' | 'transfer'
  parentId?: string
  role?: TransactionRole
  budgetable?: boolean
  isArchived?: boolean
}

export type Tag = {
  id: string
  name: string
  color: string
  isArchived?: boolean
}

export type Transaction = {
  id: string
  date: string
  accountId: string
  description: string
  category: string
  amount: number
  source: 'manual' | 'csv' | 'bank_api'
  externalId?: string
  pendingExternalId?: string
  originalDescription?: string
  role?: TransactionRole
  transferGroupId?: string
  modeledOutcome?: PlaidModeledOutcome
  tagIds?: string[]
}

export type TransactionPatch = Partial<Pick<
  Transaction,
  | 'date'
  | 'accountId'
  | 'description'
  | 'category'
  | 'amount'
  | 'tagIds'
  | 'role'
  | 'transferGroupId'
  | 'pendingExternalId'
  | 'originalDescription'
  | 'modeledOutcome'
>>
export type TransactionDraft = {
  date: string
  accountId: string
  description: string
  category: string
  amount: string
}
export type TransactionSortKey = 'year' | 'date' | 'description' | 'amount' | 'category' | 'account' | 'tags' | 'source'
export type TransactionColumnVisibility = { year: boolean; account: boolean; tags: boolean; source: boolean }

export type Budget = {
  id: string
  month: string
  category: string
  planned: number
}

export type RecurringKind = 'subscription' | 'monthly_recurring'
export type RecurringFrequency = 'monthly' | 'quarterly' | 'semi_annual' | 'annual'

export type RecurringCashflow = {
  id: string
  kind: RecurringKind
  name: string
  accountId: string
  category: string
  amount: number
  day: number
  frequency: RecurringFrequency
  nextDueDate?: string
  isActive?: boolean
  isPersisted?: boolean
  sourceDescription?: string
  sourceTransactionId?: string
}

export type TransactionMatchRule = {
  id: string
  recurringCashflowId?: string
  accountId?: string
  category: string
  matchText: string
  normalizedMatchText: string
  amountSign: 'any' | 'income' | 'expense'
  isActive?: boolean
}

export type NetWorthSnapshot = {
  id: string
  date: string
  assets: number
  liabilities: number
}

export type CsvPreviewRow = {
  id: string
  date: string
  description: string
  amount: number
  category: string
  shouldImport: boolean
  externalId?: string
  notes?: string
}

export type PlaidAccountPreview = {
  plaidItemId?: string
  plaidAccountId: string
  institutionName?: string
  name: string
  officialName?: string
  type: string
  subtype?: string
  mask?: string
  availableBalance?: number | null
  currentBalance?: number | null
  limitAmount?: number | null
  isoCurrencyCode?: string | null
  linkedAccountId?: string
  lastBalanceSyncAt?: string
  acceptedBalance?: number | null
  acceptedBalanceAt?: string
  acceptedTransactionsCursor?: string
  reconciliationStatus?: ReconciliationStatus
}

export type PlaidTransactionPreview = {
  id: string
  updateType: 'added' | 'modified'
  plaidTransactionId: string
  pendingTransactionId?: string | null
  plaidItemId: string
  plaidAccountId: string
  accountId: string
  plaidAccountName?: string
  date: string
  description: string
  originalDescription?: string
  amount: number
  category: string
  pending: boolean
  shouldImport: boolean
  duplicate: boolean
}

export type PlaidTransactionPreviewStats = {
  added: number
  modified: number
  removed: number
}

export type PlaidLinkHandler = {
  open: () => void
  destroy: () => void
}

export type PlaidLinkMetadata = {
  institution?: {
    name?: string
  }
}
