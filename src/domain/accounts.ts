import type { Account, AccountType } from './types'

export function accountSignedBalance(account: Pick<Account, 'balance' | 'type'>) {
  return account.type === 'credit' || account.type === 'loan' ? -Math.abs(account.balance) : account.balance
}

export function normalizePlaidBalanceForAccount(balance: number, accountType: AccountType) {
  return accountType === 'credit' || accountType === 'loan' ? -Math.abs(balance) : balance
}

export function isCashflowAccount(account: Pick<Account, 'type'>) {
  return account.type !== 'investment'
}

export function accountTypeColor(type: AccountType) {
  if (type === 'credit' || type === 'loan') return 'var(--negative)'
  if (type === 'investment' || type === 'savings') return 'var(--positive)'
  return 'var(--accent)'
}
