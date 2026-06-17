import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { CalendarDays, Eye, Plus, RotateCcw, SlidersHorizontal, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import { formatSignedMoneyInput, parseCurrency } from '../../domain/money'
import { compareTransactions, formatShortDate, parseShortDate } from '../../domain/transactions'
import type {
  Account,
  Category,
  Tag,
  Transaction,
  TransactionColumnVisibility,
  TransactionDraft,
  TransactionPatch,
  TransactionSortKey,
} from '../../domain/types'
import { DataTable } from '../ui/Table'
import { Surface } from '../ui/Surface'

type TransactionSortState = { key: TransactionSortKey; direction: 'asc' | 'desc' } | null

type TransactionTableProps = {
  activeAccounts: Account[]
  accounts: Account[]
  categories: Category[]
  categoryLabels: string[]
  columnVisibility: TransactionColumnVisibility
  currentMonthLabel: string
  isCurrentMonthOnly: boolean
  newTransaction: TransactionDraft
  onAddTransaction: () => void
  onColumnVisibilityChange: (next: TransactionColumnVisibility) => void
  onCurrentMonthOnlyChange: (next: boolean) => void
  onDeleteTransaction: (transactionId: string) => void
  onNewTransactionChange: (transaction: TransactionDraft) => void
  onUpdateTransaction: (transactionId: string, patch: TransactionPatch) => void
  selectedAccountId: string
  selectedCategory: string
  tags: Tag[]
  totalTransactionCount: number
  transactions: Transaction[]
}

export function TransactionTable({
  activeAccounts,
  accounts,
  categories,
  categoryLabels,
  columnVisibility,
  currentMonthLabel,
  isCurrentMonthOnly,
  newTransaction,
  onAddTransaction,
  onDeleteTransaction,
  onColumnVisibilityChange,
  onCurrentMonthOnlyChange,
  onNewTransactionChange,
  onUpdateTransaction,
  selectedAccountId,
  selectedCategory,
  tags,
  totalTransactionCount,
  transactions,
}: TransactionTableProps) {
  const accountById = new Map(accounts.map((account) => [account.id, account.name]))
  const categoryByName = new Map(categories.map((category) => [category.name, category]))
  const tagById = new Map(tags.map((tag) => [tag.id, tag]))
  const [sort, setSort] = useState<TransactionSortState>({
    key: 'date',
    direction: 'desc',
  })
  const sortedTransactions = sort ? transactions.toSorted((a, b) => {
    const result = compareTransactions(a, b, sort.key, accountById)
    return sort.direction === 'asc' ? result : -result
  }) : transactions
  function updateSort(key: TransactionSortKey) {
    setSort((current) => {
      if (!current || current.key !== key) return { key, direction: key === 'date' ? 'desc' : 'asc' }
      if (current.direction === 'asc') return { key, direction: 'desc' }
      return null
    })
  }

  function sortLabel(key: TransactionSortKey) {
    if (!sort || sort.key !== key) return ''
    return sort.direction === 'asc' ? ' ↑' : ' ↓'
  }

  function sortHeaderClass(key: TransactionSortKey) {
    return clsx('sort-header', sort?.key === key && 'active')
  }

  const sortDescription = sort ? `${sort.key} ${sort.direction === 'asc' ? 'ascending' : 'descending'}` : 'manual order'

  return (
    <Surface
      className="transaction-ledger-surface table-panel-fill"
      title="Transaction ledger"
      actions={
        <div className="table-tools">
          <span className="table-entry-count">
            {transactions.length}
            {isCurrentMonthOnly ? ` of ${totalTransactionCount}` : ''} entries
          </span>
          <details className="table-menu">
            <summary className="icon-action table-menu-trigger" title="Filters and columns">
              <SlidersHorizontal size={16} />
            </summary>
            <div className="table-menu-popover">
              <div className="table-menu-section">
                <span className="table-menu-label">Filter</span>
                <label className="menu-check" title={`Show only ${currentMonthLabel}`}>
                  <input
                    checked={isCurrentMonthOnly}
                    onChange={(event) => onCurrentMonthOnlyChange(event.target.checked)}
                    type="checkbox"
                  />
                  <CalendarDays size={15} />
                  Current month
                </label>
              </div>
              <div className="table-menu-section">
                <span className="table-menu-label">Columns</span>
                {(['year', 'account', 'tags', 'source'] as const).map((column) => (
                  <label className="menu-check" key={column}>
                    <input
                      checked={columnVisibility[column]}
                      onChange={(event) =>
                        onColumnVisibilityChange({ ...columnVisibility, [column]: event.target.checked })
                      }
                      type="checkbox"
                    />
                    <Eye size={15} />
                    {column}
                  </label>
                ))}
              </div>
            </div>
          </details>
          <details className="table-menu">
            <summary className={clsx('icon-action table-menu-trigger', sort && 'active')} title="Sort options">
              <RotateCcw size={16} />
            </summary>
            <div className="table-menu-popover table-menu-popover-right">
              <div className="table-menu-section">
                <span className="table-menu-label">Sort</span>
                <span className="table-menu-note">Currently {sortDescription}</span>
                <button className="menu-action" disabled={!sort} onClick={() => setSort(null)} type="button">
                  <RotateCcw size={15} />
                  Clear sort
                </button>
              </div>
            </div>
          </details>
        </div>
      }
    >
      <div className="table-scroll">
        <DataTable
          className="transactions-table"
          colGroup={
            <colgroup>
              {columnVisibility.year && <col className="transaction-year-col" />}
              <col className="transaction-date-col" />
              <col className="transaction-description-col" />
              <col className="transaction-amount-col" />
              <col className="transaction-category-col" />
              {columnVisibility.account && <col className="transaction-account-col" />}
              {columnVisibility.tags && <col className="transaction-tags-col" />}
              {columnVisibility.source && <col className="transaction-source-col" />}
              <col className="transaction-action-col" />
            </colgroup>
          }
          columns={[
            ...(columnVisibility.year
              ? [
                  {
                    label: (
                      <button className={sortHeaderClass('year')} onClick={() => updateSort('year')} type="button">
                        Year{sortLabel('year')}
                      </button>
                    ),
                  },
                ]
              : []),
            {
              label: (
                <button className={sortHeaderClass('date')} onClick={() => updateSort('date')} type="button">
                  Date{sortLabel('date')}
                </button>
              ),
            },
            {
              className: 'description-cell',
              label: (
                <button className={sortHeaderClass('description')} onClick={() => updateSort('description')} type="button">
                  Desc.{sortLabel('description')}
                </button>
              ),
            },
            {
              label: (
                <button className={sortHeaderClass('amount')} onClick={() => updateSort('amount')} type="button">
                  Amount{sortLabel('amount')}
                </button>
              ),
            },
            {
              className: 'category-cell',
              label: (
                <button className={sortHeaderClass('category')} onClick={() => updateSort('category')} type="button">
                  Category{sortLabel('category')}
                </button>
              ),
            },
            ...(columnVisibility.account
              ? [
                  {
                    className: 'account-cell',
                    label: (
                      <button className={sortHeaderClass('account')} onClick={() => updateSort('account')} type="button">
                        Account{sortLabel('account')}
                      </button>
                    ),
                  },
                ]
              : []),
            ...(columnVisibility.tags
              ? [
                  {
                    className: 'tags-cell',
                    label: (
                      <button className={sortHeaderClass('tags')} onClick={() => updateSort('tags')} type="button">
                        Tags{sortLabel('tags')}
                      </button>
                    ),
                  },
                ]
              : []),
            ...(columnVisibility.source
              ? [
                  {
                    label: (
                      <button className={sortHeaderClass('source')} onClick={() => updateSort('source')} type="button">
                        Source{sortLabel('source')}
                      </button>
                    ),
                  },
                ]
              : []),
            { ariaLabel: 'Actions' },
          ]}
        >
          {activeAccounts.length > 0 && (
            <TransactionAddRow
              activeAccounts={activeAccounts}
              categoryLabels={categoryLabels}
              columnVisibility={columnVisibility}
              newTransaction={newTransaction}
              onAddTransaction={onAddTransaction}
              onNewTransactionChange={onNewTransactionChange}
              selectedAccountId={selectedAccountId}
              selectedCategory={selectedCategory}
            />
          )}
          {sortedTransactions.map((transaction) => (
            <TransactionRow
              accountById={accountById}
              accounts={accounts}
              categories={categories}
              category={categoryByName.get(transaction.category)}
              columnVisibility={columnVisibility}
              key={transaction.id}
              onDelete={() => onDeleteTransaction(transaction.id)}
              onUpdate={(patch) => onUpdateTransaction(transaction.id, patch)}
              tagById={tagById}
              tags={tags}
              transaction={transaction}
            />
          ))}
        </DataTable>
      </div>
    </Surface>
  )
}

function TransactionAddRow({
  activeAccounts,
  categoryLabels,
  columnVisibility,
  newTransaction,
  onAddTransaction,
  onNewTransactionChange,
  selectedAccountId,
  selectedCategory,
}: {
  activeAccounts: Account[]
  categoryLabels: string[]
  columnVisibility: TransactionColumnVisibility
  newTransaction: TransactionDraft
  onAddTransaction: () => void
  onNewTransactionChange: (transaction: TransactionDraft) => void
  selectedAccountId: string
  selectedCategory: string
}) {
  const canSave = Boolean(newTransaction.description.trim() && Number(newTransaction.amount) && selectedAccountId)

  return (
    <tr className="transaction-add-row">
      {columnVisibility.year && <td className="quiet-cell">New</td>}
      <td>
        <input
          aria-label="New transaction date"
          className="table-input add-date-input"
          onChange={(event) => onNewTransactionChange({ ...newTransaction, date: event.target.value })}
          type="date"
          value={newTransaction.date}
        />
      </td>
      <td className="description-cell">
        <div className="add-description-stack">
          <input
            aria-label="New transaction description"
            className="table-input description-input"
            onChange={(event) => onNewTransactionChange({ ...newTransaction, description: event.target.value })}
            placeholder="Merchant or memo"
            value={newTransaction.description}
          />
          {!columnVisibility.account && (
            <select
              aria-label="New transaction account"
              className="table-input add-inline-select"
              onChange={(event) => onNewTransactionChange({ ...newTransaction, accountId: event.target.value })}
              value={selectedAccountId}
            >
              {activeAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </td>
      <td>
        <input
          aria-label="New transaction amount"
          className="table-input amount-input"
          onChange={(event) => onNewTransactionChange({ ...newTransaction, amount: event.target.value })}
          placeholder="-42.50"
          step="0.01"
          type="number"
          value={newTransaction.amount}
        />
      </td>
      <td className="category-cell">
        <select
          aria-label="New transaction category"
          className="table-input add-inline-select"
          onChange={(event) => onNewTransactionChange({ ...newTransaction, category: event.target.value })}
          value={selectedCategory}
        >
          {categoryLabels.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </td>
      {columnVisibility.account && (
        <td className="account-cell">
          <select
            aria-label="New transaction account"
            className="table-input account-select"
            onChange={(event) => onNewTransactionChange({ ...newTransaction, accountId: event.target.value })}
            value={selectedAccountId}
          >
            {activeAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </td>
      )}
      {columnVisibility.tags && <td className="quiet-cell">Tags later</td>}
      {columnVisibility.source && <td className="quiet-cell">Manual</td>}
      <td className="action-cell">
        <button
          aria-label="Add transaction"
          className="icon-action row-action add-row-action"
          disabled={!canSave}
          onClick={onAddTransaction}
          title="Add transaction"
          type="button"
        >
          <Plus size={16} />
        </button>
      </td>
    </tr>
  )
}

function TransactionRow({
  accountById,
  accounts,
  categories,
  category,
  columnVisibility,
  onDelete,
  onUpdate,
  tagById,
  tags,
  transaction,
}: {
  accountById: Map<string, string>
  accounts: Account[]
  categories: Category[]
  category?: Category
  columnVisibility: TransactionColumnVisibility
  onDelete: () => void
  onUpdate: (patch: TransactionPatch) => void
  tagById: Map<string, Tag>
  tags: Tag[]
  transaction: Transaction
}) {
  const [description, setDescription] = useState(transaction.description)
  const [datePart, setDatePart] = useState(formatShortDate(transaction.date))
  const [year, setYear] = useState(transaction.date.slice(0, 4))
  const [amount, setAmount] = useState(formatSignedMoneyInput(transaction.amount))
  const selectedTagIds = transaction.tagIds ?? []
  const selectedTags = selectedTagIds.map((tagId) => tagById.get(tagId)).filter((tag): tag is Tag => Boolean(tag))

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDescription(transaction.description)
      setDatePart(formatShortDate(transaction.date))
      setYear(transaction.date.slice(0, 4))
      setAmount(formatSignedMoneyInput(transaction.amount))
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [transaction])

  function saveDate(nextDatePart = datePart, nextYear = year) {
    const parsed = parseShortDate(nextDatePart, nextYear)
    if (parsed) {
      onUpdate({ date: parsed })
      setDatePart(formatShortDate(parsed))
      setYear(parsed.slice(0, 4))
    } else {
      setDatePart(formatShortDate(transaction.date))
      setYear(transaction.date.slice(0, 4))
    }
  }

  function saveAmount() {
    const parsed = parseCurrency(amount)
    if (!parsed) {
      setAmount(formatSignedMoneyInput(transaction.amount))
      return
    }
    onUpdate({ amount: parsed })
    setAmount(formatSignedMoneyInput(parsed))
  }

  return (
    <tr>
      {columnVisibility.year && (
        <td>
          <input
            aria-label="Transaction year"
            className="table-input year-input"
            onBlur={() => saveDate(datePart, year)}
            onChange={(event) => setYear(event.target.value)}
            value={year}
          />
        </td>
      )}
      <td>
        <input
          aria-label="Transaction date"
          className="table-input short-date-input"
          onBlur={() => saveDate()}
          onChange={(event) => setDatePart(event.target.value)}
          value={datePart}
        />
      </td>
      <td className="description-cell">
        <input
          aria-label="Transaction description"
          className="table-input description-input"
          onBlur={() => {
            const next = description.trim()
            if (next && next !== transaction.description) onUpdate({ description: next })
          }}
          onChange={(event) => setDescription(event.target.value)}
          value={description}
        />
      </td>
      <td>
        <input
          aria-label="Transaction amount"
          className={clsx('table-input amount-input', parseCurrency(amount) && parseCurrency(amount)! > 0 && 'positive', parseCurrency(amount) && parseCurrency(amount)! < 0 && 'negative')}
          onBlur={saveAmount}
          onChange={(event) => setAmount(event.target.value)}
          type="text"
          value={amount}
        />
      </td>
      <td className="category-cell">
        <div className="category-chip-wrap">
          <span className="category-chip" style={{ '--chip-color': category?.color ?? '#737985' } as CSSProperties}>
            {transaction.category}
          </span>
          <select
            aria-label="Transaction category"
            className="table-input chip-select"
            onChange={(event) => onUpdate({ category: event.target.value })}
            value={transaction.category}
          >
            {[...new Set([...categories.map((item) => item.name), transaction.category])].map((categoryName) => (
              <option key={categoryName}>{categoryName}</option>
            ))}
          </select>
        </div>
      </td>
      {columnVisibility.account && (
        <td className="account-cell">
          <select
            aria-label="Transaction account"
            className="table-input account-select"
            onChange={(event) => onUpdate({ accountId: event.target.value })}
            value={transaction.accountId}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {accountById.get(account.id)}
              </option>
            ))}
          </select>
        </td>
      )}
      {columnVisibility.tags && (
        <td className="tags-cell">
          <details className="tags-editor">
            <summary aria-label="Edit transaction tags">
              {selectedTags.length > 0 ? (
                <span className="tag-chip-list">
                  {selectedTags.slice(0, 2).map((tag) => (
                    <span className="tag-chip" key={tag.id} style={{ '--chip-color': tag.color } as CSSProperties}>
                      {tag.name}
                    </span>
                  ))}
                  {selectedTags.length > 2 && <span className="tag-count">+{selectedTags.length - 2}</span>}
                </span>
              ) : (
                <span className="quiet-cell">Add tags</span>
              )}
            </summary>
            <div className="tag-menu">
              {tags.map((tag) => (
                <label className="tag-option" key={tag.id}>
                  <input
                    checked={selectedTagIds.includes(tag.id)}
                    onChange={(event) => {
                      const nextTagIds = event.target.checked
                        ? [...selectedTagIds, tag.id]
                        : selectedTagIds.filter((tagId) => tagId !== tag.id)
                      onUpdate({ tagIds: nextTagIds })
                    }}
                    type="checkbox"
                  />
                  <span className="tag-chip" style={{ '--chip-color': tag.color } as CSSProperties}>
                    {tag.name}
                  </span>
                </label>
              ))}
            </div>
          </details>
        </td>
      )}
      {columnVisibility.source && <td className="quiet-cell">{transaction.source}</td>}
      <td className="action-cell">
        <button
          aria-label={`Delete ${transaction.description}`}
          className="icon-action danger-action row-action"
          onClick={onDelete}
          title="Delete transaction"
          type="button"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  )
}
