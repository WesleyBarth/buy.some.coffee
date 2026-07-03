import {
  Button,
  Checkbox,
  DashboardGrid,
  DashboardGridItem,
  DashboardMetric,
  IconButton,
  Inline,
  LoadingOverlay,
  Panel,
  PanelBody,
  PanelHeader,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableFrame,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableToolbar,
  Text,
  Toolbar,
  ToolbarGroup,
} from '@hyperview/ui'
import { ArrowDownToLine, Landmark, RefreshCw, Save, ShieldCheck, Trash2, WalletCards } from 'lucide-react'
import type { Account, PlaidAccountPreview, PlaidTransactionPreview, PlaidTransactionPreviewStats } from '../../domain/types'
import { currency } from '../../domain/defaults'
import { MoneyAmount } from '../ui/MoneyAmount'

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
    <LoadingOverlay active={working} label={busyMessage || 'Working'}>
      <Stack gap="sm">
      <DashboardGrid columns={12} gap="sm">
        <DashboardGridItem span={{ base: 12, sm: 6, lg: 3 }}>
          <DashboardMetric
            actions={<ShieldCheck size={20} />}
            label="Connection mode"
            tone={isRemoteSignedIn ? 'positive' : 'warning'}
            value={isRemoteSignedIn ? 'Ready' : 'Supabase required'}
          />
        </DashboardGridItem>
        <DashboardGridItem span={{ base: 12, sm: 6, lg: 3 }}>
          <DashboardMetric actions={<Landmark size={20} />} label="Linked institutions" value={String(institutionCount)} />
        </DashboardGridItem>
        <DashboardGridItem span={{ base: 12, sm: 6, lg: 3 }}>
          <DashboardMetric actions={<WalletCards size={20} />} label="Plaid accounts" value={String(plaidAccounts.length)} />
        </DashboardGridItem>
      </DashboardGrid>

      <DashboardGrid columns={12} gap="sm">
        <DashboardGridItem span={{ base: 12, lg: 6 }}>
          <Panel>
            <PanelHeader
              actions={<Text size="sm" tone="muted">Connect first, inspect data, then map accounts</Text>}
              heading="Plaid connection"
            />
            <PanelBody padding="sm">
              <Stack gap="sm">
              <Text tone="muted">
                Plaid is ready to wire through Supabase Edge Functions. The browser will request a Link token,
                Plaid Link will return a public token, and the server will exchange it for an access token.
              </Text>
              <Button
                disabled={!isRemoteSignedIn || working}
                onClick={onConnect}
                size="sm"
              >
                <ShieldCheck size={18} />
                {working ? 'Connecting...' : 'Connect with Plaid'}
              </Button>
              </Stack>
            </PanelBody>
          </Panel>
        </DashboardGridItem>

        <DashboardGridItem span={{ base: 12, lg: 6 }}>
          <Panel>
            <PanelHeader
              actions={
                <Text size="sm" tone="muted">
                  {connections.length === 0 ? 'Sandbox first' : `${connections.length} active`}
                </Text>
              }
              heading={connections.length === 0 ? 'Needed from you' : 'Connected institutions'}
            />
            <PanelBody padding="sm">
            {connections.length === 0 ? (
              <Stack gap="sm">
                <Stack gap="none">
                  <Text weight="semibold">Plaid client ID</Text>
                  <Text size="sm" tone="muted">From the Plaid dashboard.</Text>
                </Stack>
                <Stack gap="none">
                  <Text weight="semibold">Plaid secret</Text>
                  <Text size="sm" tone="muted">Use Sandbox now; Production comes after validation.</Text>
                </Stack>
                <Stack gap="none">
                  <Text weight="semibold">Plaid environment</Text>
                  <Text size="sm" tone="muted">Start with sandbox.</Text>
                </Stack>
                <Stack gap="none">
                  <Text weight="semibold">Products</Text>
                  <Text size="sm" tone="muted">Use transactions; add liabilities or investments later only if needed.</Text>
                </Stack>
              </Stack>
            ) : (
              <Stack gap="sm">
                {connections.map((connection) => (
                  <Inline align="center" justify="between" key={connection.id}>
                    <Stack gap="none">
                      <Text weight="semibold">{connection.institutionName}</Text>
                      <Text size="sm" tone="muted">{connection.accountCount} account{connection.accountCount === 1 ? '' : 's'}</Text>
                    </Stack>
                    <IconButton
                      disabled={working}
                      label="Disconnect Plaid item"
                      onClick={() => onDisconnectItem(connection.id, connection.institutionName)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Inline>
                ))}
              </Stack>
            )}
            </PanelBody>
          </Panel>
        </DashboardGridItem>
      </DashboardGrid>

      <TableFrame
        density="compact"
        heading="Account preview"
        toolbar={
          <TableToolbar>
            <Toolbar density="compact">
              <ToolbarGroup>
                <Text size="sm" tone="muted">
                  {plaidAccounts.length === 0 ? 'No Plaid accounts synced yet' : `${mappedPlaidAccountCount} mapped`}
                </Text>
              </ToolbarGroup>
              <ToolbarGroup separated>
                <Button
                  disabled={working || plaidItemCount === 0}
                  onClick={onRefreshBalances}
                  size="sm"
                >
                  <RefreshCw size={16} />
                  Refresh
                </Button>
                <Button
                  disabled={working || mappedPlaidAccountCount === 0}
                  onClick={onSyncBalances}
                  size="sm"
                >
                  <Save size={16} />
                  Sync balances
                </Button>
              </ToolbarGroup>
            </Toolbar>
          </TableToolbar>
        }
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Institution</TableHeaderCell>
              <TableHeaderCell>Account</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Mask</TableHeaderCell>
              <TableHeaderCell>Available</TableHeaderCell>
              <TableHeaderCell>Current</TableHeaderCell>
              <TableHeaderCell>Mapped account</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Last refresh</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
          {plaidAccounts.length === 0 ? (
            <TableEmptyRow colSpan={9} title="Connect Plaid to preview accounts before syncing balances." />
          ) : (
            plaidAccounts.map((account) => (
              <TableRow key={account.plaidAccountId}>
                <TableCell>{account.institutionName || 'Unknown'}</TableCell>
                <TableCell>
                  <Text weight="semibold">{account.name}</Text>
                  {account.officialName && <Text size="xs" tone="muted">{account.officialName}</Text>}
                </TableCell>
                <TableCell>{[account.type, account.subtype].filter(Boolean).join(' / ')}</TableCell>
                <TableCell>{account.mask ?? '-'}</TableCell>
                <TableCell align="right">
                  {formatOptionalCurrency(account.availableBalance)}
                </TableCell>
                <TableCell align="right">
                  {formatOptionalCurrency(account.currentBalance)}
                </TableCell>
                <TableCell>
                  <Select
                    onChange={(event) => onUpdateAccountMapping(account.plaidAccountId, event.target.value)}
                    selectSize="sm"
                    value={account.linkedAccountId ?? ''}
                  >
                    <option value="">Not mapped</option>
                    {accounts.map((appAccount) => (
                      <option key={appAccount.id} value={appAccount.id}>
                        {appAccount.name}
                      </option>
                    ))}
                  </Select>
                </TableCell>
                <TableCell>{balanceStatusByAccountId.get(account.plaidAccountId) ?? 'Not mapped'}</TableCell>
                <TableCell>{formatShortDateTime(account.lastBalanceSyncAt)}</TableCell>
              </TableRow>
            ))
          )}
          </TableBody>
        </Table>
      </TableFrame>

      <TableFrame
        density="compact"
        heading="Transaction preview"
        toolbar={
          <TableToolbar>
            <Toolbar density="compact">
              <ToolbarGroup>
                <Text size="sm" tone="muted">
                  {transactionRows.length === 0
                    ? 'No preview loaded'
                    : `${selectedTransactionCount} selected; ${transactionPreviewStats.added} added, ${transactionPreviewStats.modified} modified, ${transactionPreviewStats.removed} removed`}
                </Text>
              </ToolbarGroup>
              <ToolbarGroup separated>
                <Button
                  disabled={working || mappedAccountCount === 0}
                  onClick={onPreviewTransactions}
                  size="sm"
                >
                  <RefreshCw size={16} />
                  Preview transactions
                </Button>
                <Button
                  disabled={working || selectedTransactionCount === 0}
                  onClick={onImportTransactions}
                  size="sm"
                >
                  <ArrowDownToLine size={16} />
                  Import selected
                </Button>
                <Button
                  disabled={working || transactionCursorCount === 0}
                  onClick={onMarkTransactionsReviewed}
                  size="sm"
                >
                  <Save size={16} />
                  Mark reviewed
                </Button>
              </ToolbarGroup>
            </Toolbar>
          </TableToolbar>
        }
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Import</TableHeaderCell>
              <TableHeaderCell>Update</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Account</TableHeaderCell>
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell>Amount</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
          {transactionRows.length === 0 ? (
            <TableEmptyRow colSpan={8} title="Preview Plaid transactions after mapping accounts." />
          ) : (
            transactionRows.slice(0, 100).map((row) => (
              <TableRow selected={row.duplicate || row.pending} key={row.id}>
                <TableCell>
                  <Checkbox
                    aria-label={`Import ${row.description}`}
                    checked={row.shouldImport}
                    disabled={row.duplicate || row.pending}
                    onChange={(event) => onUpdateTransactionRow(row.id, { shouldImport: event.target.checked })}
                  />
                </TableCell>
                <TableCell muted>{row.updateType === 'modified' ? 'Modified' : 'Added'}</TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell>{accounts.find((account) => account.id === row.accountId)?.name ?? row.plaidAccountName}</TableCell>
                <TableCell>
                  <Text weight="semibold">{row.description}</Text>
                  {row.originalDescription && row.originalDescription !== row.description && (
                    <Text size="xs" tone="muted">{row.originalDescription}</Text>
                  )}
                  {row.pendingTransactionId && (
                    <Text size="xs" tone="muted">Posted from pending transaction</Text>
                  )}
                </TableCell>
                <TableCell align="right">
                  <MoneyAmount amount={row.amount} />
                </TableCell>
                <TableCell>
                  <Select
                    onChange={(event) => onUpdateTransactionRow(row.id, { category: event.target.value })}
                    selectSize="sm"
                    value={row.category}
                  >
                    {categoryLabels.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </Select>
                </TableCell>
                <TableCell>{row.pending ? 'Pending' : row.duplicate ? 'Already imported' : row.updateType === 'modified' ? 'Modified' : 'Ready'}</TableCell>
              </TableRow>
            ))
          )}
          </TableBody>
        </Table>
      </TableFrame>
      </Stack>
    </LoadingOverlay>
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
