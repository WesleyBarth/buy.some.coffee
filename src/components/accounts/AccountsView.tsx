import { useEffect, useState } from 'react'
import {
  Button,
  Checkbox,
  DashboardGrid,
  DashboardGridItem,
  DashboardMetric,
  Field,
  IconButton,
  Inline,
  Input,
  Label,
  Panel,
  PanelBody,
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
import { Landmark, Plus, Save, WalletCards } from 'lucide-react'
import {
  accountSignedBalance,
} from '../../domain/accounts'
import { accountTypes } from '../../domain/defaults'
import { formatSignedMoneyInput, parseCurrency } from '../../domain/money'
import type { Account, AccountType } from '../../domain/types'
import { MoneyAmount } from '../ui/MoneyAmount'

export type AccountFormState = {
  name: string
  institution: string
  type: AccountType
  balance: string
}

type AccountsViewProps = {
  accountForm: AccountFormState
  accountInitialValue: number
  accounts: Account[]
  activeAccountCount: number
  onAccountFormChange: (form: AccountFormState) => void
  onAddAccount: (event: React.FormEvent<HTMLFormElement>) => void
  onUpdateAccount: (accountId: string, patch: Partial<Account>) => void
}

export function AccountsView({
  accountForm,
  accountInitialValue,
  accounts,
  activeAccountCount,
  onAccountFormChange,
  onAddAccount,
  onUpdateAccount,
}: AccountsViewProps) {
  return (
    <Stack gap="sm">
      <DashboardGrid columns={12} gap="sm">
        <DashboardGridItem span={{ base: 12, sm: 6, lg: 3 }}>
          <DashboardMetric
            actions={<Landmark size={20} />}
            label="Active accounts"
            value={String(activeAccountCount)}
          />
        </DashboardGridItem>
        <DashboardGridItem span={{ base: 12, sm: 6, lg: 3 }}>
          <DashboardMetric
            actions={<WalletCards size={20} />}
            label="Current account value"
            tone="positive"
            value={<MoneyAmount amount={accountInitialValue} neutral />}
          />
        </DashboardGridItem>
      </DashboardGrid>

      <Panel>
        <PanelBody padding="sm">
        <form onSubmit={onAddAccount}>
          <Inline align="end" gap="sm" wrap>
            <Field>
              <Label>Account name</Label>
              <Input
                inputSize="sm"
                onChange={(event) => onAccountFormChange({ ...accountForm, name: event.target.value })}
                placeholder="Checking, Visa, Brokerage"
                value={accountForm.name}
              />
            </Field>
            <Field>
              <Label>Institution</Label>
              <Input
                inputSize="sm"
                onChange={(event) => onAccountFormChange({ ...accountForm, institution: event.target.value })}
                placeholder="Bank or custodian"
                value={accountForm.institution}
              />
            </Field>
            <Field>
              <Label>Type</Label>
              <Select
                onChange={(event) =>
                  onAccountFormChange({ ...accountForm, type: event.target.value as AccountType })
                }
                selectSize="sm"
                value={accountForm.type}
              >
                {accountTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label>Current value</Label>
              <Input
                inputSize="sm"
                onChange={(event) => onAccountFormChange({ ...accountForm, balance: event.target.value })}
                placeholder="-830 or 18400"
                step="0.01"
                type="number"
                value={accountForm.balance}
              />
            </Field>
            <Button size="sm" type="submit">
              <Plus size={18} />
              Add account
            </Button>
          </Inline>
        </form>
        </PanelBody>
      </Panel>

      <TableFrame
        density="compact"
        heading="Set current account values"
        toolbar={
          <Toolbar density="compact">
            <ToolbarGroup>
              <Text size="sm" tone="muted">Plaid sync keeps mapped accounts current</Text>
            </ToolbarGroup>
          </Toolbar>
        }
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Institution</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell align="right">Current value</TableHeaderCell>
              <TableHeaderCell>Archived</TableHeaderCell>
              <TableHeaderCell aria-label="Actions" />
            </TableRow>
          </TableHead>
          <TableBody>
            {accounts.map((account) => (
              <AccountEditor
                account={account}
                key={account.id}
                onUpdate={(patch) => onUpdateAccount(account.id, patch)}
              />
            ))}
          </TableBody>
        </Table>
      </TableFrame>
    </Stack>
  )
}

function AccountEditor({
  account,
  onUpdate,
}: {
  account: Account
  onUpdate: (patch: Partial<Account>) => void
}) {
  const [draft, setDraft] = useState({
    name: account.name,
    institution: account.institution ?? '',
    type: account.type,
    balance: formatAccountBalanceInput(account),
    isArchived: Boolean(account.isArchived),
  })

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDraft({
        name: account.name,
        institution: account.institution ?? '',
        type: account.type,
        balance: formatAccountBalanceInput(account),
        isArchived: Boolean(account.isArchived),
      })
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [account])

  function saveAccount() {
    const parsedBalance = parseCurrency(draft.balance)
    if (!draft.name.trim() || parsedBalance === null) return
    onUpdate({
      name: draft.name.trim(),
      institution: draft.institution.trim(),
      type: draft.type,
      balance: parsedBalance,
      isArchived: draft.isArchived,
    })
    setDraft((current) => ({
      ...current,
      balance: formatAccountBalanceInput({ ...account, type: draft.type, balance: parsedBalance }),
    }))
  }

  return (
    <TableRow selected={draft.isArchived}>
      <TableCell>
        <Input
          aria-label="Account name"
          inputSize="sm"
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          value={draft.name}
        />
      </TableCell>
      <TableCell>
        <Input
          aria-label="Institution"
          inputSize="sm"
          onChange={(event) => setDraft({ ...draft, institution: event.target.value })}
          value={draft.institution}
        />
      </TableCell>
      <TableCell>
        <Select
          aria-label="Account type"
          onChange={(event) => setDraft({ ...draft, type: event.target.value as AccountType })}
          selectSize="sm"
          value={draft.type}
        >
          {accountTypes.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </Select>
      </TableCell>
      <TableCell align="right">
        <Input
          aria-label="Current value"
          inputSize="sm"
          onBlur={saveAccount}
          onChange={(event) => setDraft({ ...draft, balance: event.target.value })}
          type="text"
          value={draft.balance}
        />
      </TableCell>
      <TableCell>
        <Checkbox
          checked={draft.isArchived}
          onChange={(event) => setDraft({ ...draft, isArchived: event.target.checked })}
        >
          Archived
        </Checkbox>
      </TableCell>
      <TableCell align="right">
        <IconButton label="Save account" onClick={saveAccount} size="sm">
          <Save size={18} />
        </IconButton>
      </TableCell>
    </TableRow>
  )
}

function formatAccountBalanceInput(account: Pick<Account, 'balance' | 'type'>) {
  return formatSignedMoneyInput(accountSignedBalance(account))
}
