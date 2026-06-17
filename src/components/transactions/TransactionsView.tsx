import type {
  Account,
  Category,
  Tag,
  Transaction,
  TransactionColumnVisibility,
  TransactionDraft,
  TransactionPatch,
} from '../../domain/types'
import { AccountRequiredPanel } from '../ui/AccountRequiredPanel'
import { TransactionTable } from './TransactionTable'

type TransactionsViewProps = {
  accounts: Account[]
  activeAccounts: Account[]
  activeCategories: Category[]
  activeTags: Tag[]
  categoryLabels: string[]
  columnVisibility: TransactionColumnVisibility
  currentMonthLabel: string
  displayedTransactions: Transaction[]
  isCurrentMonthOnly: boolean
  newTransaction: TransactionDraft
  onAddTransaction: () => void
  onColumnVisibilityChange: (next: TransactionColumnVisibility) => void
  onCurrentMonthOnlyChange: (next: boolean) => void
  onDeleteTransaction: (transactionId: string) => void
  onNewTransactionChange: (transaction: TransactionDraft) => void
  onOpenAccounts: () => void
  onUpdateTransaction: (transactionId: string, patch: TransactionPatch) => void
  selectedAccountId: string
  selectedCategory: string
  totalTransactionCount: number
}

export function TransactionsView({
  accounts,
  activeAccounts,
  activeCategories,
  activeTags,
  categoryLabels,
  columnVisibility,
  currentMonthLabel,
  displayedTransactions,
  isCurrentMonthOnly,
  newTransaction,
  onAddTransaction,
  onColumnVisibilityChange,
  onCurrentMonthOnlyChange,
  onDeleteTransaction,
  onNewTransactionChange,
  onOpenAccounts,
  onUpdateTransaction,
  selectedAccountId,
  selectedCategory,
  totalTransactionCount,
}: TransactionsViewProps) {
  return (
    <section className="view-stack">
      {activeAccounts.length === 0 ? (
        <AccountRequiredPanel onOpenAccounts={onOpenAccounts} />
      ) : null}
      <TransactionTable
        activeAccounts={activeAccounts}
        categoryLabels={categoryLabels}
        newTransaction={newTransaction}
        onAddTransaction={onAddTransaction}
        onNewTransactionChange={onNewTransactionChange}
        selectedAccountId={selectedAccountId}
        selectedCategory={selectedCategory}
        accounts={accounts}
        categories={activeCategories}
        columnVisibility={columnVisibility}
        currentMonthLabel={currentMonthLabel}
        isCurrentMonthOnly={isCurrentMonthOnly}
        onColumnVisibilityChange={onColumnVisibilityChange}
        onDeleteTransaction={onDeleteTransaction}
        onCurrentMonthOnlyChange={onCurrentMonthOnlyChange}
        onUpdateTransaction={onUpdateTransaction}
        tags={activeTags}
        totalTransactionCount={totalTransactionCount}
        transactions={displayedTransactions}
      />
    </section>
  )
}
