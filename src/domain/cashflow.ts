import {
  accountSignedBalance,
  isCashflowScopedAccount,
  isCashOnHandAccount,
  isCreditLiabilityAccount,
} from './accounts'
import type { Account, Transaction } from './types'

export type MonthlyCashSummary = {
  cashOnHandAccounts: Account[]
  cashflowScopedAccounts: Account[]
  cashOnHand: number
  unpaidCreditCardLiability: number
  selectedMonthCashOnHandActivity: number
  startingCashOnHand: number
  remainingExpectedProjectionFlow: number
  remainingPlannedVariableSpend: number
  projectedMonthEndCashBalance: number
  savingsGoalVariance: number
}

export function buildMonthlyCashSummary({
  accounts,
  monthlySavingsGoal,
  remainingExpectedProjectionFlow,
  remainingPlannedVariableSpend,
  selectedMonthTransactions,
}: {
  accounts: Account[]
  monthlySavingsGoal: number
  remainingExpectedProjectionFlow: number
  remainingPlannedVariableSpend: number
  selectedMonthTransactions: Transaction[]
}): MonthlyCashSummary {
  const cashOnHandAccounts = accounts.filter(isCashOnHandAccount)
  const cashflowScopedAccounts = accounts.filter(isCashflowScopedAccount)
  const cashOnHandAccountIds = new Set(cashOnHandAccounts.map((account) => account.id))
  const cashOnHand = cashOnHandAccounts.reduce((sum, account) => sum + accountSignedBalance(account), 0)
  const unpaidCreditCardLiability = accounts
    .filter(isCreditLiabilityAccount)
    .reduce((sum, account) => sum + Math.abs(accountSignedBalance(account)), 0)
  const selectedMonthCashOnHandActivity = selectedMonthTransactions
    .filter((transaction) => cashOnHandAccountIds.has(transaction.accountId))
    .reduce((sum, transaction) => sum + transaction.amount, 0)
  const startingCashOnHand = cashOnHand - selectedMonthCashOnHandActivity
  const projectedMonthEndCashBalance =
    cashOnHand -
    unpaidCreditCardLiability +
    remainingExpectedProjectionFlow -
    remainingPlannedVariableSpend
  const savingsGoalVariance = projectedMonthEndCashBalance - startingCashOnHand - monthlySavingsGoal

  return {
    cashOnHandAccounts,
    cashflowScopedAccounts,
    cashOnHand,
    unpaidCreditCardLiability,
    selectedMonthCashOnHandActivity,
    startingCashOnHand,
    remainingExpectedProjectionFlow,
    remainingPlannedVariableSpend,
    projectedMonthEndCashBalance,
    savingsGoalVariance,
  }
}
