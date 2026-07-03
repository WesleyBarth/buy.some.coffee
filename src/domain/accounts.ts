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
