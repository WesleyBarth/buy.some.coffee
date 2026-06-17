import type { RefObject } from 'react'
import { CreditCard, Repeat2, WalletCards } from 'lucide-react'
import type { Account, RecurringCashflow } from '../../domain/types'
import { AccountRequiredPanel } from '../ui/AccountRequiredPanel'
import { MetricCard, MetricGrid } from '../ui/MetricCard'
import { MoneyAmount } from '../ui/MoneyAmount'
import { RecurringModule } from './RecurringModule'

type ExpensesViewProps = {
  accountById: Map<string, string>
  accounts: Account[]
  categoryLabels: string[]
  defaultCategory: string
  expectedExpenseSpend: number
  focusItemId: string
  focusRef: RefObject<HTMLInputElement | null>
  monthlyRecurringSpend: number
  monthlyRecurringItems: RecurringCashflow[]
  onAddBlank: (kind: 'subscription' | 'monthly_recurring') => void
  onDelete: (itemId: string) => void
  onDismiss: (itemId: string) => void
  onOpenAccounts: () => void
  onPersist: (itemId: string) => void
  onUpdate: (itemId: string, patch: Partial<RecurringCashflow>) => void
  subscriptionItems: RecurringCashflow[]
  subscriptionServicesSpend: number
}

export function ExpensesView({
  accountById,
  accounts,
  categoryLabels,
  defaultCategory,
  expectedExpenseSpend,
  focusItemId,
  focusRef,
  monthlyRecurringSpend,
  monthlyRecurringItems,
  onAddBlank,
  onDelete,
  onDismiss,
  onOpenAccounts,
  onPersist,
  onUpdate,
  subscriptionItems,
  subscriptionServicesSpend,
}: ExpensesViewProps) {
  return (
    <section className="view-stack">
      <MetricGrid className="expense-metrics">
        <MetricCard icon={CreditCard} label="Expected expenses" value={<MoneyAmount amount={-expectedExpenseSpend} />} tone="amber" />
        <MetricCard icon={Repeat2} label="Monthly recurring" value={<MoneyAmount amount={-monthlyRecurringSpend} />} tone="amber" />
        <MetricCard icon={WalletCards} label="Subscriptions/services" value={<MoneyAmount amount={-subscriptionServicesSpend} />} tone="amber" />
      </MetricGrid>

      {accounts.length === 0 ? (
        <AccountRequiredPanel onOpenAccounts={onOpenAccounts} />
      ) : (
        <>
          <RecurringModule
            accountById={accountById}
            accounts={accounts}
            amountMode="expense"
            categoryLabels={categoryLabels}
            defaultCategory={defaultCategory}
            focusItemId={focusItemId}
            focusRef={focusRef}
            items={subscriptionItems}
            onAddBlank={() => onAddBlank('subscription')}
            onDelete={onDelete}
            onDismiss={onDismiss}
            onPersist={onPersist}
            onUpdate={onUpdate}
            title="Subscriptions & Services"
          />
          <RecurringModule
            accountById={accountById}
            accounts={accounts}
            amountMode="expense"
            categoryLabels={categoryLabels}
            defaultCategory={defaultCategory}
            focusItemId={focusItemId}
            focusRef={focusRef}
            items={monthlyRecurringItems}
            onAddBlank={() => onAddBlank('monthly_recurring')}
            onDelete={onDelete}
            onDismiss={onDismiss}
            onPersist={onPersist}
            onUpdate={onUpdate}
            title="Monthly Recurring"
          />
        </>
      )}
    </section>
  )
}
