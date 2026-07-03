import type { Account, AccountType } from './types'

export function accountSignedBalance(account: Pick<Account, 'balance' | 'type'>) {
  return account.type === 'credit' || account.type === 'loan' ? -Math.abs(account.balance) : account.balance
}

export function normalizePlaidBalanceForAccount(balance: number, accountType: AccountType) {
  return accountType === 'credit' || accountType === 'loan' ? -Math.abs(balance) : balance
}

export function isCashOnHandAccount(account: Pick<Account, 'type'>) {
  return account.type === 'checking' || account.type === 'cash'
}

export function isSavingsAccount(account: Pick<Account, 'type'>) {
  return account.type === 'savings'
}

export function isCreditLiabilityAccount(account: Pick<Account, 'type'>) {
  return account.type === 'credit'
}

export function isCashflowScopedAccount(account: Pick<Account, 'type'>) {
  return account.type === 'checking' || account.type === 'cash' || account.type === 'savings' || account.type === 'credit'
}

export function isCashflowAccount(account: Pick<Account, 'type'>) {
  return account.type !== 'investment'
}
