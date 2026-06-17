import { ArrowDownToLine, Landmark, RefreshCw, Save, ShieldCheck, Trash2, WalletCards } from 'lucide-react'
import type { Account, PlaidAccountPreview, PlaidTransactionPreview, PlaidTransactionPreviewStats } from '../../domain/types'
import { currency } from '../../domain/defaults'
import { MetricCard, MetricGrid } from '../ui/MetricCard'
import { MoneyAmount } from '../ui/MoneyAmount'
import { BusyOverlay } from '../ui/BusyOverlay'
import { DataTable, EmptyTableRow, TablePanel } from '../ui/Table'

type PlaidConnection = {
  id: string
  institutionName: string
  accountCount: number
}

type PlaidViewProps = {
  accounts: Account[]
  balanceStatusByAccountId: Map<string, string>
  busyMessage: string
  categoryLabels: string[]
  connections: PlaidConnection[]
  institutionCount: number
  isRemoteSignedIn: boolean
  mappedAccountCount: number
  mappedPlaidAccountCount: number
  onConnect: () => void
  onDisconnectItem: (plaidItemId: string, institutionName: string) => void
  onImportTransactions: () => void
  onMarkTransactionsReviewed: () => void
  onPreviewTransactions: () => void
  onRefreshBalances: () => void
  onSyncBalances: () => void
  onUpdateAccountMapping: (plaidAccountId: string, linkedAccountId: string) => void
  onUpdateTransactionRow: (rowId: string, patch: Partial<PlaidTransactionPreview>) => void
  plaidAccounts: PlaidAccountPreview[]
  plaidItemCount: number
  transactionCursorCount: number
  transactionPreviewStats: PlaidTransactionPreviewStats
  transactionRows: PlaidTransactionPreview[]
  working: boolean
}

export function PlaidView({
  accounts,
  balanceStatusByAccountId,
  busyMessage,
  categoryLabels,
  connections,
  institutionCount,
  isRemoteSignedIn,
  mappedAccountCount,
  mappedPlaidAccountCount,
  onConnect,
  onDisconnectItem,
  onImportTransactions,
  onMarkTransactionsReviewed,
  onPreviewTransactions,
  onRefreshBalances,
  onSyncBalances,
  onUpdateAccountMapping,
  onUpdateTransactionRow,
  plaidAccounts,
  plaidItemCount,
  transactionCursorCount,
  transactionPreviewStats,
  transactionRows,
  working,
}: PlaidViewProps) {
  const selectedTransactionCount = transactionRows.filter((row) => row.shouldImport).length

  return (
    <section className="view-stack busy-surface" aria-busy={working}>
      <BusyOverlay active={working} message={busyMessage} />
      <MetricGrid className="plaid-metrics">
        <MetricCard
          icon={ShieldCheck}
          label="Connection mode"
          value={isRemoteSignedIn ? 'Ready' : 'Supabase required'}
          tone={isRemoteSignedIn ? 'green' : 'amber'}
        />
        <MetricCard icon={Landmark} label="Linked institutions" value={String(institutionCount)} />
        <MetricCard icon={WalletCards} label="Plaid accounts" value={String(plaidAccounts.length)} />
      </MetricGrid>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Plaid connection</h2>
            <span>Connect first, inspect data, then map accounts</span>
          </div>
          <div className="empty-inline plaid-connect-panel">
            <p>
              Plaid is ready to wire through Supabase Edge Functions. The browser will request a Link token,
              Plaid Link will return a public token, and the server will exchange it for an access token.
            </p>
            <button
              className="primary-action"
              disabled={!isRemoteSignedIn || working}
              onClick={onConnect}
              type="button"
            >
              <ShieldCheck size={18} />
              {working ? 'Connecting...' : 'Connect with Plaid'}
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>{connections.length === 0 ? 'Needed from you' : 'Connected institutions'}</h2>
            <span>{connections.length === 0 ? 'Sandbox first' : `${connections.length} active`}</span>
          </div>
          {connections.length === 0 ? (
            <ul className="setup-list">
              <li>
                <strong>Plaid client ID</strong>
                <span>From the Plaid dashboard.</span>
              </li>
              <li>
                <strong>Plaid secret</strong>
                <span>Use Sandbox now; Production comes after validation.</span>
              </li>
              <li>
                <strong>Plaid environment</strong>
                <span>Start with <code>sandbox</code>.</span>
              </li>
              <li>
                <strong>Products</strong>
                <span>Use <code>transactions</code>; add <code>liabilities</code> or <code>investments</code> later only if needed.</span>
              </li>
            </ul>
          ) : (
            <div className="connection-list">
              {connections.map((connection) => (
                <div className="connection-row" key={connection.id}>
                  <div>
                    <strong>{connection.institutionName}</strong>
                    <span>{connection.accountCount} account{connection.accountCount === 1 ? '' : 's'}</span>
                  </div>
                  <button
                    className="icon-action danger-action"
                    disabled={working}
                    onClick={() => onDisconnectItem(connection.id, connection.institutionName)}
                    title="Disconnect Plaid item"
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <TablePanel
        title="Account preview"
        actions={
          <div className="panel-heading-actions">
            <span>{plaidAccounts.length === 0 ? 'No Plaid accounts synced yet' : `${mappedPlaidAccountCount} mapped`}</span>
            <button
              className="primary-action compact-action"
              disabled={working || plaidItemCount === 0}
              onClick={onRefreshBalances}
              type="button"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              className="primary-action compact-action"
              disabled={working || mappedPlaidAccountCount === 0}
              onClick={onSyncBalances}
              type="button"
            >
              <Save size={16} />
              Sync balances
            </button>
          </div>
        }
      >
        <DataTable
          columns={[
            { label: 'Institution' },
            { label: 'Account' },
            { label: 'Type' },
            { label: 'Mask' },
            { label: 'Available' },
            { label: 'Current' },
            { label: 'Mapped account' },
            { label: 'Status' },
            { label: 'Last refresh' },
          ]}
        >
          {plaidAccounts.length === 0 ? (
            <EmptyTableRow colSpan={9}>Connect Plaid to preview accounts before syncing balances.</EmptyTableRow>
          ) : (
            plaidAccounts.map((account) => (
              <tr key={account.plaidAccountId}>
                <td>{account.institutionName || 'Unknown'}</td>
                <td>
                  <strong>{account.name}</strong>
                  {account.officialName && <span className="table-subtext">{account.officialName}</span>}
                </td>
                <td>{[account.type, account.subtype].filter(Boolean).join(' / ')}</td>
                <td>{account.mask ?? '-'}</td>
                <td className="amount-cell">
                  {formatOptionalCurrency(account.availableBalance)}
                </td>
                <td className="amount-cell">
                  {formatOptionalCurrency(account.currentBalance)}
                </td>
                <td>
                  <select
                    className="table-input plaid-map-select"
                    onChange={(event) => onUpdateAccountMapping(account.plaidAccountId, event.target.value)}
                    value={account.linkedAccountId ?? ''}
                  >
                    <option value="">Not mapped</option>
                    {accounts.map((appAccount) => (
                      <option key={appAccount.id} value={appAccount.id}>
                        {appAccount.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{balanceStatusByAccountId.get(account.plaidAccountId) ?? 'Not mapped'}</td>
                <td>{formatShortDateTime(account.lastBalanceSyncAt)}</td>
              </tr>
            ))
          )}
        </DataTable>
      </TablePanel>

      <TablePanel
        title="Transaction preview"
        actions={
          <div className="panel-heading-actions">
            <span>
              {transactionRows.length === 0
                ? 'No preview loaded'
                : `${selectedTransactionCount} selected; ${transactionPreviewStats.added} added, ${transactionPreviewStats.modified} modified, ${transactionPreviewStats.removed} removed`}
            </span>
            <button
              className="primary-action compact-action"
              disabled={working || mappedAccountCount === 0}
              onClick={onPreviewTransactions}
              type="button"
            >
              <RefreshCw size={16} />
              Preview transactions
            </button>
            <button
              className="primary-action compact-action"
              disabled={working || selectedTransactionCount === 0}
              onClick={onImportTransactions}
              type="button"
            >
              <ArrowDownToLine size={16} />
              Import selected
            </button>
            <button
              className="primary-action compact-action"
              disabled={working || transactionCursorCount === 0}
              onClick={onMarkTransactionsReviewed}
              type="button"
            >
              <Save size={16} />
              Mark reviewed
            </button>
          </div>
        }
      >
        <DataTable
          columns={[
            { label: 'Import' },
            { label: 'Update' },
            { label: 'Date' },
            { label: 'Account' },
            { label: 'Description' },
            { label: 'Amount' },
            { label: 'Category' },
            { label: 'Status' },
          ]}
        >
          {transactionRows.length === 0 ? (
            <EmptyTableRow colSpan={8}>Preview Plaid transactions after mapping accounts.</EmptyTableRow>
          ) : (
            transactionRows.slice(0, 100).map((row) => (
              <tr className={row.duplicate || row.pending ? 'muted-row' : undefined} key={row.id}>
                <td>
                  <input
                    checked={row.shouldImport}
                    disabled={row.duplicate || row.pending}
                    onChange={(event) => onUpdateTransactionRow(row.id, { shouldImport: event.target.checked })}
                    type="checkbox"
                  />
                </td>
                <td className="quiet-cell">{row.updateType === 'modified' ? 'Modified' : 'Added'}</td>
                <td>{row.date}</td>
                <td>{accounts.find((account) => account.id === row.accountId)?.name ?? row.plaidAccountName}</td>
                <td>
                  <strong>{row.description}</strong>
                  {row.originalDescription && row.originalDescription !== row.description && (
                    <span className="table-subtext">{row.originalDescription}</span>
                  )}
                  {row.pendingTransactionId && (
                    <span className="table-subtext">Posted from pending transaction</span>
                  )}
                </td>
                <td className="amount-cell">
                  <MoneyAmount amount={row.amount} />
                </td>
                <td>
                  <select
                    className="table-input plaid-category-select"
                    onChange={(event) => onUpdateTransactionRow(row.id, { category: event.target.value })}
                    value={row.category}
                  >
                    {categoryLabels.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </td>
                <td>{row.pending ? 'Pending' : row.duplicate ? 'Already imported' : row.updateType === 'modified' ? 'Modified' : 'Ready'}</td>
              </tr>
            ))
          )}
        </DataTable>
      </TablePanel>
    </section>
  )
}

function formatOptionalCurrency(value: number | null | undefined) {
  return typeof value === 'number' ? currency.format(value) : '-'
}

function formatShortDateTime(value: string | undefined) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}
