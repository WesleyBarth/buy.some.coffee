import { DashboardGrid, DashboardGridItem, DashboardMetric, Stack } from '@hyperview/ui'
import { Banknote, CreditCard, WalletCards } from 'lucide-react'
import type { Account, RecurringCashflow } from '../../domain/types'
import { AccountRequiredPanel } from '../ui/AccountRequiredPanel'
import { MoneyAmount } from '../ui/MoneyAmount'
import { RecurringModule, type RecurringFormState } from './RecurringModule'

type IncomeViewProps = {
  accountById: Map<string, string>
  accounts: Account[]
  categoryLabels: string[]
  defaultCategory: string
  expectedIncomeItems: RecurringCashflow[]
  form: RecurringFormState
  monthlyRecurringFlow: number
  monthlyRecurringIncome: number
  onAdd: (event: React.FormEvent<HTMLFormElement>) => void
  onDelete: (itemId: string) => void
  onDismiss: (itemId: string) => void
  onFormChange: (form: RecurringFormState) => void
  onOpenAccounts: () => void
  onPersist: (itemId: string) => void
  onUpdate: (itemId: string, patch: Partial<RecurringCashflow>) => void
  subscriptionServicesSpend: number
}

export function IncomeView({
  accountById,
  accounts,
  categoryLabels,
  defaultCategory,
  expectedIncomeItems,
  form,
  monthlyRecurringFlow,
  monthlyRecurringIncome,
  onAdd,
  onDelete,
  onDismiss,
  onFormChange,
  onOpenAccounts,
  onPersist,
  onUpdate,
  subscriptionServicesSpend,
}: IncomeViewProps) {
  return (
    <Stack gap="sm">
      <DashboardGrid columns={12} gap="sm">
        <DashboardGridItem span={{ base: 12, sm: 6, lg: 3 }}>
          <DashboardMetric actions={<Banknote size={20} />} label="Expected income" tone="positive" value={<MoneyAmount amount={monthlyRecurringIncome} />} />
        </DashboardGridItem>
        <DashboardGridItem span={{ base: 12, sm: 6, lg: 3 }}>
          <DashboardMetric actions={<WalletCards size={20} />} label="Income sources" value={String(expectedIncomeItems.length)} />
        </DashboardGridItem>
        <DashboardGridItem span={{ base: 12, sm: 6, lg: 3 }}>
          <DashboardMetric actions={<CreditCard size={20} />} label="Net fixed flow" value={<MoneyAmount amount={monthlyRecurringFlow - subscriptionServicesSpend} />} />
        </DashboardGridItem>
      </DashboardGrid>

      {accounts.length === 0 ? (
        <AccountRequiredPanel onOpenAccounts={onOpenAccounts} />
      ) : (
        <RecurringModule
          accountById={accountById}
          accounts={accounts}
          categoryLabels={categoryLabels}
          defaultCategory={defaultCategory}
          form={form}
          groupByCategory
          items={expectedIncomeItems}
          onAdd={onAdd}
          onDelete={onDelete}
          onDismiss={onDismiss}
          onFormChange={onFormChange}
          onPersist={onPersist}
          onUpdate={onUpdate}
          title="Income"
        />
      )}
    </Stack>
  )
}
