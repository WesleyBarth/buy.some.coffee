import type { RefObject } from 'react'
import { Plus, Save, Trash2, X } from 'lucide-react'
import { clsx } from 'clsx'
import { formatSignedMoneyInput, parseCurrency } from '../../domain/money'
import { groupRecurringItemsByCategory } from '../../domain/recurring'
import type { Account, RecurringCashflow, RecurringFrequency } from '../../domain/types'
import { MoneyAmount } from '../ui/MoneyAmount'
import { Surface, Toolbar } from '../ui/Surface'

export type RecurringFormState = {
  name: string
  accountId: string
  category: string
  amount: string
  day: string
  frequency: RecurringFrequency
  nextDueDate: string
}

type RecurringModuleProps = {
  accountById: Map<string, string>
  accounts: Account[]
  amountMode?: 'any' | 'expense' | 'income'
  categoryLabels: string[]
  defaultCategory: string
  focusItemId?: string
  focusRef?: RefObject<HTMLInputElement | null>
  form?: RecurringFormState
  groupByCategory?: boolean
  items: RecurringCashflow[]
  onAdd?: (event: React.FormEvent<HTMLFormElement>) => void
  onAddBlank?: () => void
  onDelete: (itemId: string) => void
  onDismiss: (itemId: string) => void
  onFormChange?: (form: RecurringFormState) => void
  onPersist: (itemId: string) => void
  onUpdate: (itemId: string, patch: Partial<RecurringCashflow>) => void
  title: string
}

export function RecurringModule({
  accountById,
  accounts,
  amountMode = 'any',
  categoryLabels,
  defaultCategory,
  focusItemId = '',
  focusRef,
  form,
  groupByCategory = false,
  items,
  onAdd,
  onAddBlank,
  onDelete,
  onDismiss,
  onFormChange,
  onPersist,
  onUpdate,
  title,
}: RecurringModuleProps) {
  const selectedAccountId = form && accounts.some((account) => account.id === form.accountId)
    ? form.accountId
    : accounts[0]?.id ?? ''
  const selectedCategory = form && categoryLabels.includes(form.category) ? form.category : defaultCategory
  const groupedItems = groupByCategory ? groupRecurringItemsByCategory(items, categoryLabels) : []
  const activeSavedCount = items.filter((item) => item.isPersisted && item.isActive !== false).length
  const candidateCount = items.filter((item) => !item.isPersisted).length

  function renderRecurringRow(item: RecurringCashflow) {
    const normalizeAmount = (amount: number) => {
      if (amountMode === 'expense') return -Math.abs(amount)
      if (amountMode === 'income') return Math.abs(amount)
      return amount
    }

    return (
      <div className={clsx('recurring-row', item.isActive === false && 'muted-row', !item.isPersisted && 'candidate-row')} key={item.id}>
        <input
          aria-label="Recurring name"
          className="table-input account-name-input"
          onChange={(event) => onUpdate(item.id, { name: event.target.value })}
          ref={item.id === focusItemId ? focusRef : undefined}
          title={!item.isPersisted && item.sourceDescription ? `Original: ${item.sourceDescription}` : undefined}
          value={item.name}
        />
        <select
          aria-label="Recurring account"
          className="table-input"
          onChange={(event) => onUpdate(item.id, { accountId: event.target.value })}
          value={item.accountId}
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {accountById.get(account.id)}
            </option>
          ))}
        </select>
        <select
          aria-label="Recurring category"
          className="table-input"
          onChange={(event) => onUpdate(item.id, { category: event.target.value })}
          value={item.category}
        >
          {categoryLabels.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        <input
          aria-label="Recurring amount"
          className={clsx('table-input amount-input', item.amount < 0 ? 'negative' : 'positive')}
          onChange={(event) => {
            const amount = parseCurrency(event.target.value)
            if (amount !== null) onUpdate(item.id, { amount: normalizeAmount(amount) })
          }}
          inputMode="decimal"
          type="text"
          value={formatSignedMoneyInput(item.amount)}
        />
        <label className="checkbox-label">
          <input
            checked={item.isActive !== false}
            onChange={(event) => onUpdate(item.id, { isActive: event.target.checked })}
            type="checkbox"
          />
          Active
        </label>
        {item.isPersisted ? (
          <button className="icon-action danger" onClick={() => onDelete(item.id)} title="Delete" type="button">
            <Trash2 size={17} />
          </button>
        ) : (
          <div className="row-actions">
            <button className="icon-action" onClick={() => onPersist(item.id)} title="Save from transaction" type="button">
              <Save size={17} />
            </button>
            <button className="icon-action danger" onClick={() => onDismiss(item.id)} title="Dismiss candidate" type="button">
              <X size={17} />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Surface
      className="recurring-surface"
      title={title}
      variant="table"
      actions={
        <Toolbar>
          <span>
            {activeSavedCount} active{candidateCount > 0 ? `, ${candidateCount} candidate${candidateCount === 1 ? '' : 's'}` : ''}
          </span>
          {onAddBlank && (
            <button className="primary-action compact-action" onClick={onAddBlank} type="button">
              <Plus size={17} />
              Add
            </button>
          )}
        </Toolbar>
      }
    >

      {form && onAdd && onFormChange && (
        <form className="recurring-form-grid" onSubmit={onAdd}>
          <label>
            Name
            <input
              onChange={(event) => onFormChange({ ...form, name: event.target.value })}
              placeholder={title === 'Income' ? 'Payroll, draw, interest' : 'Rent, insurance, Netflix'}
              value={form.name}
            />
          </label>
          <label>
            Account
            <select
              onChange={(event) => onFormChange({ ...form, accountId: event.target.value })}
              value={selectedAccountId}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select
              onChange={(event) => onFormChange({ ...form, category: event.target.value })}
              value={selectedCategory}
            >
              {categoryLabels.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            Amount
            <input
              onChange={(event) => onFormChange({ ...form, amount: event.target.value })}
              placeholder={title === 'Income' ? '5200' : '-1850 or -16'}
              step="0.01"
              type="number"
              value={form.amount}
            />
          </label>
          <button className="primary-action form-action" type="submit">
            <Plus size={18} />
            Add
          </button>
        </form>
      )}

      <div className="recurring-list">
        {groupByCategory
          ? groupedItems.map((group) => (
              <div className="recurring-group" key={group.category}>
                <div className="recurring-group-heading">
                  <strong>{group.category}</strong>
                  <span><MoneyAmount amount={group.total} /></span>
                </div>
                {group.items.map(renderRecurringRow)}
              </div>
            ))
          : items.map(renderRecurringRow)}
      </div>
    </Surface>
  )
}
