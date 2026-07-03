import { useEffect, useState } from 'react'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Input,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSortableHeaderCell,
  TableToolbar,
  Text,
} from '@hyperview/ui'
import { Plus, RotateCcw, SlidersHorizontal, Trash2 } from 'lucide-react'
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

type TransactionSortState = { key: TransactionSortKey; direction: 'asc' | 'desc' } | null

type TransactionTableProps = {
  activeAccounts: Account[]
  accounts: Account[]
  categories: Category[]
  categoryLabels: string[]
  columnVisibility: TransactionColumnVisibility
  selectedMonthLabel: string
  isSelectedMonthOnly: boolean
  newTransaction: TransactionDraft
  onAddTransaction: () => void
  onColumnVisibilityChange: (next: TransactionColumnVisibility) => void
  onSelectedMonthOnlyChange: (next: boolean) => void
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
  selectedMonthLabel,
  isSelectedMonthOnly,
  newTransaction,
  onAddTransaction,
  onDeleteTransaction,
  onColumnVisibilityChange,
  onSelectedMonthOnlyChange,
  onNewTransactionChange,
  onUpdateTransaction,
  selectedAccountId,
  selectedCategory,
  tags,
  totalTransactionCount,
  transactions,
}: TransactionTableProps) {
  const accountById = new Map(accounts.map((account) => [account.id, account.name]))
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

  function sortDirection(key: TransactionSortKey) {
    return sort?.key === key ? sort.direction : null
  }

  const sortDescription = sort ? `${sort.key} ${sort.direction === 'asc' ? 'ascending' : 'descending'}` : 'manual order'

  return (
    <TableFrame
      density="compact"
      heading="Transaction ledger"
      toolbar={
        <TableToolbar>
          <Text size="sm" tone="muted">
            {transactions.length}
            {isSelectedMonthOnly ? ` of ${totalTransactionCount}` : ''} entries
          </Text>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton label="Filters and columns" size="sm" variant="ghost">
                <SlidersHorizontal size={16} />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={isSelectedMonthOnly}
                onCheckedChange={(checked) => onSelectedMonthOnlyChange(checked === true)}
                onSelect={(event) => event.preventDefault()}
              >
                Selected month ({selectedMonthLabel})
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Columns</DropdownMenuLabel>
              {(['year', 'account', 'tags', 'source'] as const).map((column) => (
                <DropdownMenuCheckboxItem
                  checked={columnVisibility[column]}
                  key={column}
                  onCheckedChange={(checked) =>
                    onColumnVisibilityChange({ ...columnVisibility, [column]: checked === true })
                  }
                  onSelect={(event) => event.preventDefault()}
                >
                  {column}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton active={Boolean(sort)} label="Sort options" size="sm" variant="ghost">
                <RotateCcw size={16} />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort</DropdownMenuLabel>
              <DropdownMenuItem disabled>{sortDescription}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={!sort} onSelect={() => setSort(null)}>
                Clear sort
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableToolbar>
      }
      variant="fill"
    >
      <Table>
        <TableHead>
          <TableRow>
            {columnVisibility.year && (
              <TableSortableHeaderCell direction={sortDirection('year')} onSort={() => updateSort('year')}>
                Year
              </TableSortableHeaderCell>
            )}
            <TableSortableHeaderCell direction={sortDirection('date')} onSort={() => updateSort('date')}>
              Date
            </TableSortableHeaderCell>
            <TableSortableHeaderCell direction={sortDirection('description')} onSort={() => updateSort('description')} truncate>
              Desc.
            </TableSortableHeaderCell>
            <TableSortableHeaderCell align="right" direction={sortDirection('amount')} onSort={() => updateSort('amount')}>
              Amount
            </TableSortableHeaderCell>
            <TableSortableHeaderCell direction={sortDirection('category')} onSort={() => updateSort('category')}>
              Category
            </TableSortableHeaderCell>
            {columnVisibility.account && (
              <TableSortableHeaderCell direction={sortDirection('account')} onSort={() => updateSort('account')}>
                Account
              </TableSortableHeaderCell>
            )}
            {columnVisibility.tags && (
              <TableSortableHeaderCell direction={sortDirection('tags')} onSort={() => updateSort('tags')}>
                Tags
              </TableSortableHeaderCell>
            )}
            {columnVisibility.source && (
              <TableSortableHeaderCell direction={sortDirection('source')} onSort={() => updateSort('source')}>
                Source
              </TableSortableHeaderCell>
            )}
            <TableHeaderCell aria-label="Actions" />
          </TableRow>
        </TableHead>
        <TableBody>
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
              columnVisibility={columnVisibility}
              key={transaction.id}
              onDelete={() => onDeleteTransaction(transaction.id)}
              onUpdate={(patch) => onUpdateTransaction(transaction.id, patch)}
              tagById={tagById}
              tags={tags}
              transaction={transaction}
            />
          ))}
        </TableBody>
      </Table>
    </TableFrame>
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
    <TableRow selected>
      {columnVisibility.year && <TableCell muted>New</TableCell>}
      <TableCell>
        <Input
          aria-label="New transaction date"
          inputSize="sm"
          onChange={(event) => onNewTransactionChange({ ...newTransaction, date: event.target.value })}
          type="date"
          value={newTransaction.date}
        />
      </TableCell>
      <TableCell>
        <Stack gap="xs">
          <Input
            aria-label="New transaction description"
            inputSize="sm"
            onChange={(event) => onNewTransactionChange({ ...newTransaction, description: event.target.value })}
            placeholder="Merchant or memo"
            value={newTransaction.description}
          />
          {!columnVisibility.account && (
            <Select
              aria-label="New transaction account"
              onChange={(event) => onNewTransactionChange({ ...newTransaction, accountId: event.target.value })}
              selectSize="sm"
              value={selectedAccountId}
            >
              {activeAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          )}
        </Stack>
      </TableCell>
      <TableCell>
        <Input
          aria-label="New transaction amount"
          inputSize="sm"
          onChange={(event) => onNewTransactionChange({ ...newTransaction, amount: event.target.value })}
          placeholder="-42.50"
          step="0.01"
          type="number"
          value={newTransaction.amount}
        />
      </TableCell>
      <TableCell>
        <Select
          aria-label="New transaction category"
          onChange={(event) => onNewTransactionChange({ ...newTransaction, category: event.target.value })}
          selectSize="sm"
          value={selectedCategory}
        >
          {categoryLabels.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </Select>
      </TableCell>
      {columnVisibility.account && (
        <TableCell>
          <Select
            aria-label="New transaction account"
            onChange={(event) => onNewTransactionChange({ ...newTransaction, accountId: event.target.value })}
            selectSize="sm"
            value={selectedAccountId}
          >
            {activeAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
        </TableCell>
      )}
      {columnVisibility.tags && <TableCell muted>Tags later</TableCell>}
      {columnVisibility.source && <TableCell muted>Manual</TableCell>}
      <TableCell align="right">
        <IconButton
          disabled={!canSave}
          label="Add transaction"
          onClick={onAddTransaction}
          size="sm"
        >
          <Plus size={16} />
        </IconButton>
      </TableCell>
    </TableRow>
  )
}

function TransactionRow({
  accountById,
  accounts,
  categories,
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
    <TableRow>
      {columnVisibility.year && (
        <TableCell>
          <Input
            aria-label="Transaction year"
            inputSize="sm"
            onBlur={() => saveDate(datePart, year)}
            onChange={(event) => setYear(event.target.value)}
            value={year}
          />
        </TableCell>
      )}
      <TableCell>
        <Input
          aria-label="Transaction date"
          inputSize="sm"
          onBlur={() => saveDate()}
          onChange={(event) => setDatePart(event.target.value)}
          value={datePart}
        />
      </TableCell>
      <TableCell truncate>
        <Input
          aria-label="Transaction description"
          inputSize="sm"
          onBlur={() => {
            const next = description.trim()
            if (next && next !== transaction.description) onUpdate({ description: next })
          }}
          onChange={(event) => setDescription(event.target.value)}
          value={description}
        />
      </TableCell>
      <TableCell align="right">
        <Input
          aria-label="Transaction amount"
          inputSize="sm"
          onBlur={saveAmount}
          onChange={(event) => setAmount(event.target.value)}
          type="text"
          value={amount}
        />
      </TableCell>
      <TableCell>
        <Select
          aria-label="Transaction category"
          onChange={(event) => onUpdate({ category: event.target.value })}
          selectSize="sm"
          value={transaction.category}
        >
          {[...new Set([...categories.map((item) => item.name), transaction.category])].map((categoryName) => (
            <option key={categoryName}>{categoryName}</option>
          ))}
        </Select>
      </TableCell>
      {columnVisibility.account && (
        <TableCell>
          <Select
            aria-label="Transaction account"
            onChange={(event) => onUpdate({ accountId: event.target.value })}
            selectSize="sm"
            value={transaction.accountId}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {accountById.get(account.id)}
              </option>
            ))}
          </Select>
        </TableCell>
      )}
      {columnVisibility.tags && (
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" type="button" variant="ghost">
                {selectedTags.length > 0 ? (
                  <>
                    {selectedTags.slice(0, 2).map((tag) => (
                      <Badge key={tag.id} size="sm" tone="accent">
                        {tag.name}
                      </Badge>
                    ))}
                    {selectedTags.length > 2 && <Badge size="sm" tone="neutral">+{selectedTags.length - 2}</Badge>}
                  </>
                ) : (
                  'Add tags'
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuLabel>Tags</DropdownMenuLabel>
              {tags.map((tag) => (
                <DropdownMenuCheckboxItem
                  checked={selectedTagIds.includes(tag.id)}
                  key={tag.id}
                  onCheckedChange={(checked) => {
                    const nextTagIds = checked === true
                      ? [...selectedTagIds, tag.id]
                      : selectedTagIds.filter((tagId) => tagId !== tag.id)
                    onUpdate({ tagIds: nextTagIds })
                  }}
                  onSelect={(event) => event.preventDefault()}
                >
                  {tag.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      )}
      {columnVisibility.source && <TableCell muted>{transaction.source}</TableCell>}
      <TableCell align="right">
        <IconButton
          label={`Delete ${transaction.description}`}
          onClick={onDelete}
          size="sm"
          variant="ghost"
        >
          <Trash2 size={16} />
        </IconButton>
      </TableCell>
    </TableRow>
  )
}
