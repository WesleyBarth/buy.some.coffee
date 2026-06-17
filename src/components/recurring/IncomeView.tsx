import { Banknote, CreditCard, WalletCards } from 'lucide-react'
import type { Account, RecurringCashflow } from '../../domain/types'
import { AccountRequiredPanel } from '../ui/AccountRequiredPanel'
import { MetricCard, MetricGrid } from '../ui/MetricCard'
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
    <section className="view-stack">
      <MetricGrid>
        <MetricCard icon={Banknote} label="Expected income" value={<MoneyAmount amount={monthlyRecurringIncome} />} tone="green" />
        <MetricCard icon={WalletCards} label="Income sources" value={String(expectedIncomeItems.length)} />
        <MetricCard icon={CreditCard} label="Net fixed flow" value={<MoneyAmount amount={monthlyRecurringFlow - subscriptionServicesSpend} />} />
      </MetricGrid>

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
    </section>
  )
}
