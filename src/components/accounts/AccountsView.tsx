import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Landmark, Plus, Save, WalletCards } from 'lucide-react'
import { clsx } from 'clsx'
import {
  accountSignedBalance,
  accountTypeColor,
} from '../../domain/accounts'
import { accountTypes } from '../../domain/defaults'
import { formatSignedMoneyInput, parseCurrency } from '../../domain/money'
import type { Account, AccountType } from '../../domain/types'
import { MetricCard, MetricGrid } from '../ui/MetricCard'
import { MoneyAmount } from '../ui/MoneyAmount'
import { Surface, Toolbar } from '../ui/Surface'

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
    <section className="view-stack">
      <MetricGrid className="account-metrics" minTileWidth={320}>
        <MetricCard icon={Landmark} label="Active accounts" value={String(activeAccountCount)} />
        <MetricCard icon={WalletCards} label="Current account value" value={<MoneyAmount amount={accountInitialValue} neutral />} tone="green" />
      </MetricGrid>

      <Surface variant="toolbar">
        <form className="account-form-grid" onSubmit={onAddAccount}>
          <label>
            Account name
            <input
              onChange={(event) => onAccountFormChange({ ...accountForm, name: event.target.value })}
              placeholder="Checking, Visa, Brokerage"
              value={accountForm.name}
            />
          </label>
          <label>
            Institution
            <input
              onChange={(event) => onAccountFormChange({ ...accountForm, institution: event.target.value })}
              placeholder="Bank or custodian"
              value={accountForm.institution}
            />
          </label>
          <label>
            Type
            <select
              onChange={(event) =>
                onAccountFormChange({ ...accountForm, type: event.target.value as AccountType })
              }
              value={accountForm.type}
            >
              {accountTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            Current value
            <input
              onChange={(event) => onAccountFormChange({ ...accountForm, balance: event.target.value })}
              placeholder="-830 or 18400"
              step="0.01"
              type="number"
              value={accountForm.balance}
            />
          </label>
          <button className="primary-action form-action" type="submit">
            <Plus size={18} />
            Add account
          </button>
        </form>
      </Surface>

      <Surface
        title="Set current account values"
        variant="table"
        actions={<Toolbar>Plaid sync keeps mapped accounts current</Toolbar>}
      >
        <div className="account-editor-list">
          <div className="account-editor account-editor-head" aria-hidden="true">
            <span>Name</span>
            <span>Institution</span>
            <span>Type</span>
            <span>Current value</span>
            <span>Archived</span>
            <span></span>
          </div>
          {accounts.map((account) => (
            <AccountEditor
              account={account}
              key={account.id}
              onUpdate={(patch) => onUpdateAccount(account.id, patch)}
            />
          ))}
        </div>
      </Surface>
    </section>
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

  function saveAccount(event: React.FormEvent<HTMLFormElement> | React.FocusEvent<HTMLInputElement>) {
    event.preventDefault()
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
    <form className={clsx('account-editor', draft.isArchived && 'archived')} onSubmit={saveAccount}>
      <input
        aria-label="Account name"
        className="table-input account-name-input"
        onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        value={draft.name}
      />
      <input
        aria-label="Institution"
        className="table-input"
        onChange={(event) => setDraft({ ...draft, institution: event.target.value })}
        value={draft.institution}
      />
      <div className="category-chip-wrap account-type-chip">
        <span className="category-chip" style={{ '--chip-color': accountTypeColor(draft.type) } as CSSProperties}>
          {draft.type}
        </span>
        <select
          aria-label="Account type"
          className="table-input chip-select"
          onChange={(event) => setDraft({ ...draft, type: event.target.value as AccountType })}
          value={draft.type}
        >
          {accountTypes.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      </div>
      <input
        aria-label="Current value"
        className={clsx(
          'table-input amount-input',
          accountSignedBalance({ ...account, type: draft.type, balance: parseCurrency(draft.balance) ?? 0 }) < 0
            ? 'negative'
            : 'positive',
        )}
        onBlur={saveAccount}
        onChange={(event) => setDraft({ ...draft, balance: event.target.value })}
        type="text"
        value={draft.balance}
      />
      <label className="checkbox-label">
        <input
          checked={draft.isArchived}
          onChange={(event) => setDraft({ ...draft, isArchived: event.target.checked })}
          type="checkbox"
        />
        Archived
      </label>
      <button className="icon-action" title="Save account" type="submit">
        <Save size={18} />
      </button>
    </form>
  )
}

function formatAccountBalanceInput(account: Pick<Account, 'balance' | 'type'>) {
  return formatSignedMoneyInput(accountSignedBalance(account))
}
