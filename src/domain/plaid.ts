import {
  isCashOnHandAccount,
  isCashflowScopedAccount,
  isCreditLiabilityAccount,
} from './accounts'
import type { Account, PlaidModeledOutcome, PlaidTransactionPreview, TransactionRole } from './types'

export function initialPlaidModeledOutcome({
  duplicate,
  pending,
}: Pick<PlaidTransactionPreview, 'duplicate' | 'pending'>): PlaidModeledOutcome {
  if (duplicate) return 'duplicate'
  if (pending) return 'needs_review'
  return 'import'
}

export function shouldImportPlaidPreviewRow(row: Pick<PlaidTransactionPreview, 'modeledOutcome' | 'pending'>) {
  return (
    (row.modeledOutcome === 'import' ||
      row.modeledOutcome === 'credit_card_payment' ||
      row.modeledOutcome === 'internal_transfer') &&
    !row.pending
  )
}

export function hasReviewBlockingPlaidRows(rows: Array<Pick<PlaidTransactionPreview, 'modeledOutcome' | 'pending'>>) {
  return rows.some((row) => !row.pending && row.modeledOutcome === 'needs_review')
}

export function roleForPlaidModeledOutcome(outcome: PlaidModeledOutcome): TransactionRole | undefined {
  if (outcome === 'credit_card_payment') return 'credit_card_payment'
  if (outcome === 'internal_transfer') return 'internal_transfer'
  return undefined
}

export function detectPlaidTransferOutcomes(rows: PlaidTransactionPreview[], accounts: Account[]) {
  const accountById = new Map(accounts.map((account) => [account.id, account]))
  const next = rows.map((row) => ({ ...row }))
  const matchedIds = new Set<string>()

  for (let leftIndex = 0; leftIndex < next.length; leftIndex += 1) {
    const left = next[leftIndex]
    if (!canMatchPlaidTransfer(left, matchedIds)) continue
    const leftAccount = accountById.get(left.accountId)
    if (!leftAccount) continue

    for (let rightIndex = leftIndex + 1; rightIndex < next.length; rightIndex += 1) {
      const right = next[rightIndex]
      if (!canMatchPlaidTransfer(right, matchedIds)) continue
      const rightAccount = accountById.get(right.accountId)
      if (!rightAccount || left.accountId === right.accountId) continue
      if (!isPotentialTransferPair(left, right)) continue

      const modeledOutcome = detectPairOutcome(left, leftAccount, right, rightAccount)
      if (!modeledOutcome) continue

      const transferGroupId = crypto.randomUUID()
      next[leftIndex] = {
        ...left,
        modeledOutcome,
        shouldImport: true,
        transferGroupId,
      }
      next[rightIndex] = {
        ...right,
        modeledOutcome,
        shouldImport: true,
        transferGroupId,
      }
      matchedIds.add(left.id)
      matchedIds.add(right.id)
      break
    }
  }

  return next
}

export function plaidActionLabel(outcome: PlaidModeledOutcome) {
  const labels: Record<PlaidModeledOutcome, string> = {
    import: 'Import as transaction',
    duplicate: 'Skip duplicate',
    credit_card_payment: 'Import as credit card payment',
    internal_transfer: 'Import as transfer',
    needs_review: 'Review first',
  }
  return labels[outcome]
}

export function plaidRowReasonLabel(
  row: Pick<PlaidTransactionPreview, 'modeledOutcome' | 'pending' | 'duplicate' | 'updateType' | 'transferGroupId'>,
) {
  if (row.pending) return 'Bank still pending'
  if (row.duplicate) return 'Already in ledger'
  if (row.modeledOutcome === 'credit_card_payment') return row.transferGroupId ? 'Matched card payment pair' : 'Card payment'
  if (row.modeledOutcome === 'internal_transfer') return row.transferGroupId ? 'Matched transfer pair' : 'Transfer'
  if (row.modeledOutcome === 'needs_review') return 'Needs your choice'
  if (row.updateType === 'modified') return 'Posted update'
  return 'Ready'
}

function canMatchPlaidTransfer(row: PlaidTransactionPreview, matchedIds: Set<string>) {
  return (
    !matchedIds.has(row.id) &&
    !row.pending &&
    !row.duplicate &&
    row.modeledOutcome === 'import'
  )
}

function isPotentialTransferPair(left: PlaidTransactionPreview, right: PlaidTransactionPreview) {
  return (
    Math.abs(Math.abs(left.amount) - Math.abs(right.amount)) < 0.01 &&
    Math.sign(left.amount) !== Math.sign(right.amount) &&
    daysBetween(left.date, right.date) <= 3
  )
}

function detectPairOutcome(
  left: PlaidTransactionPreview,
  leftAccount: Account,
  right: PlaidTransactionPreview,
  rightAccount: Account,
): PlaidModeledOutcome | undefined {
  const leftIsCardPaymentCredit = isCreditLiabilityAccount(leftAccount) && left.amount > 0 && isCashOnHandAccount(rightAccount) && right.amount < 0
  const rightIsCardPaymentCredit = isCreditLiabilityAccount(rightAccount) && right.amount > 0 && isCashOnHandAccount(leftAccount) && left.amount < 0
  if (leftIsCardPaymentCredit || rightIsCardPaymentCredit) return 'credit_card_payment'

  const bothInternalCashflow =
    isCashflowScopedAccount(leftAccount) &&
    isCashflowScopedAccount(rightAccount) &&
    !isCreditLiabilityAccount(leftAccount) &&
    !isCreditLiabilityAccount(rightAccount)
  return bothInternalCashflow ? 'internal_transfer' : undefined
}

function daysBetween(leftDate: string, rightDate: string) {
  const leftTime = Date.parse(`${leftDate}T00:00:00Z`)
  const rightTime = Date.parse(`${rightDate}T00:00:00Z`)
  if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) return Number.POSITIVE_INFINITY
  return Math.abs(leftTime - rightTime) / 86_400_000
}
