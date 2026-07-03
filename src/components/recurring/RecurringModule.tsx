import type { RefObject } from 'react'
import {
  Badge,
  Button,
  Checkbox,
  Field,
  IconButton,
  Inline,
  Input,
  Label,
  Panel,
  PanelBody,
  PanelHeader,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  Toolbar,
  ToolbarGroup,
} from '@hyperview/ui'
import { Plus, Save, Trash2, X } from 'lucide-react'
import { formatSignedMoneyInput, parseCurrency } from '../../domain/money'
import { groupRecurringItemsByCategory } from '../../domain/recurring'
import type { Account, RecurringCashflow, RecurringFrequency } from '../../domain/types'
import { MoneyAmount } from '../ui/MoneyAmount'

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
      <TableRow selected={item.isActive === false || !item.isPersisted} key={item.id}>
        <TableCell>
          <Input
            aria-label="Recurring name"
            inputSize="sm"
            onChange={(event) => onUpdate(item.id, { name: event.target.value })}
            ref={item.id === focusItemId ? focusRef : undefined}
            title={!item.isPersisted && item.sourceDescription ? `Original: ${item.sourceDescription}` : undefined}
            value={item.name}
          />
        </TableCell>
        <TableCell>
          <Select
            aria-label="Recurring account"
            onChange={(event) => onUpdate(item.id, { accountId: event.target.value })}
            selectSize="sm"
            value={item.accountId}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {accountById.get(account.id)}
              </option>
            ))}
          </Select>
        </TableCell>
        <TableCell>
          <Select
            aria-label="Recurring category"
            onChange={(event) => onUpdate(item.id, { category: event.target.value })}
            selectSize="sm"
            value={item.category}
          >
            {categoryLabels.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </Select>
        </TableCell>
        <TableCell>
          <Input
            aria-label="Recurring amount"
            inputMode="decimal"
            inputSize="sm"
            onChange={(event) => {
              const amount = parseCurrency(event.target.value)
              if (amount !== null) onUpdate(item.id, { amount: normalizeAmount(amount) })
            }}
            type="text"
            value={formatSignedMoneyInput(item.amount)}
          />
        </TableCell>
        <TableCell>
          <Checkbox
            checked={item.isActive !== false}
            onChange={(event) => onUpdate(item.id, { isActive: event.target.checked })}
          >
            Active
          </Checkbox>
        </TableCell>
        <TableCell align="right">
          {item.isPersisted ? (
            <IconButton label="Delete" onClick={() => onDelete(item.id)} size="sm" variant="ghost">
              <Trash2 size={17} />
            </IconButton>
          ) : (
            <Inline justify="end" gap="xs">
              <IconButton label="Save from transaction" onClick={() => onPersist(item.id)} size="sm">
                <Save size={17} />
              </IconButton>
              <IconButton label="Dismiss candidate" onClick={() => onDismiss(item.id)} size="sm" variant="ghost">
                <X size={17} />
              </IconButton>
            </Inline>
          )}
        </TableCell>
      </TableRow>
    )
  }

  function renderRecurringTable(tableItems: RecurringCashflow[]) {
    return (
      <TableFrame density="compact">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Account</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>Amount</TableHeaderCell>
              <TableHeaderCell>Active</TableHeaderCell>
              <TableHeaderCell aria-label="Actions" />
            </TableRow>
          </TableHead>
          <TableBody>
            {tableItems.map(renderRecurringRow)}
          </TableBody>
        </Table>
      </TableFrame>
    )
  }

  return (
    <Panel>
      <PanelHeader
        actions={
          <Toolbar density="compact">
            <ToolbarGroup>
              <Text size="sm" tone="muted">{activeSavedCount} active</Text>
              {candidateCount > 0 && (
                <Badge size="sm" tone="warning">
                  {candidateCount} candidate{candidateCount === 1 ? '' : 's'}
                </Badge>
              )}
            </ToolbarGroup>
            {onAddBlank && (
              <ToolbarGroup separated>
                <Button onClick={onAddBlank} size="sm">
                  <Plus size={17} />
                  Add
                </Button>
              </ToolbarGroup>
            )}
          </Toolbar>
        }
        heading={title}
      />
      <PanelBody padding="none">
        {form && onAdd && onFormChange && (
          <form onSubmit={onAdd}>
            <Inline align="end" gap="sm" wrap>
              <Field>
                <Label>Name</Label>
                <Input
                  inputSize="sm"
                  onChange={(event) => onFormChange({ ...form, name: event.target.value })}
                  placeholder={title === 'Income' ? 'Payroll, draw, interest' : 'Rent, insurance, Netflix'}
                  value={form.name}
                />
              </Field>
              <Field>
                <Label>Account</Label>
                <Select
                  onChange={(event) => onFormChange({ ...form, accountId: event.target.value })}
                  selectSize="sm"
                  value={selectedAccountId}
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field>
                <Label>Category</Label>
                <Select
                  onChange={(event) => onFormChange({ ...form, category: event.target.value })}
                  selectSize="sm"
                  value={selectedCategory}
                >
                  {categoryLabels.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </Select>
              </Field>
              <Field>
                <Label>Amount</Label>
                <Input
                  inputSize="sm"
                  onChange={(event) => onFormChange({ ...form, amount: event.target.value })}
                  placeholder={title === 'Income' ? '5200' : '-1850 or -16'}
                  step="0.01"
                  type="number"
                  value={form.amount}
                />
              </Field>
              <Button size="sm" type="submit">
                <Plus size={18} />
                Add
              </Button>
            </Inline>
          </form>
        )}

        <Stack gap="sm">
          {groupByCategory
            ? groupedItems.map((group) => (
                <Stack gap="xs" key={group.category}>
                  <Inline align="center" justify="between">
                    <Text weight="semibold">{group.category}</Text>
                    <Text tone="muted"><MoneyAmount amount={group.total} /></Text>
                  </Inline>
                  {renderRecurringTable(group.items)}
                </Stack>
              ))
            : renderRecurringTable(items)}
        </Stack>
      </PanelBody>
    </Panel>
  )
}
