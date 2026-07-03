import type { RefObject } from 'react'
import { DashboardGrid, DashboardGridItem, DashboardMetric, Stack } from '@hyperview/ui'
import { CreditCard, Repeat2, WalletCards } from 'lucide-react'
import type { Account, RecurringCashflow } from '../../domain/types'
import { AccountRequiredPanel } from '../ui/AccountRequiredPanel'
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
    <Stack gap="sm">
      <DashboardGrid columns={12} gap="sm">
        <DashboardGridItem span={{ base: 12, sm: 6, lg: 3 }}>
          <DashboardMetric actions={<CreditCard size={20} />} label="Expected expenses" tone="warning" value={<MoneyAmount amount={-expectedExpenseSpend} />} />
        </DashboardGridItem>
        <DashboardGridItem span={{ base: 12, sm: 6, lg: 3 }}>
          <DashboardMetric actions={<Repeat2 size={20} />} label="Monthly recurring" tone="warning" value={<MoneyAmount amount={-monthlyRecurringSpend} />} />
        </DashboardGridItem>
        <DashboardGridItem span={{ base: 12, sm: 6, lg: 3 }}>
          <DashboardMetric actions={<WalletCards size={20} />} label="Subscriptions/services" tone="warning" value={<MoneyAmount amount={-subscriptionServicesSpend} />} />
        </DashboardGridItem>
      </DashboardGrid>

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
    </Stack>
  )
}
