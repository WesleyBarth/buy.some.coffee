import {
  Button,
  DashboardGrid,
  DashboardGridItem,
  DashboardMetric,
  EmptyState,
  Panel,
  PanelBody,
  PanelHeader,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from '@hyperview/ui'
import { Banknote, CreditCard, Landmark, Plus, WalletCards } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { accountSignedBalance } from '../../domain/accounts'
import { categoryColors, categoryPalette, currency } from '../../domain/defaults'
import type { Account, Category } from '../../domain/types'
import { MoneyAmount } from '../ui/MoneyAmount'

type DashboardViewProps = {
  activeCategoryByName: Map<string, Category>
  actualVariableSpend: number
  cashflowAccounts: Account[]
  currentCashPosition: number
  monthPositionTrend: Array<{ date: string; expected: number; tracked: number }>
  onOpenAccounts: () => void
  remainingPlannedSpend: number
  savingsGoalVariance: number
  spendByCategory: Array<{ category: string; spent: number }>
  totalBudgetRemaining: number
  trackedMonthEndPosition: number
}

const chartAxisTick = {
  fill: 'var(--hv-color-text-muted)',
  fontSize: 'var(--hv-font-size-xs)',
  fontWeight: 500,
}

const chartTooltipStyle = {
  background: 'var(--hv-panel-background-raised)',
  border: '1px solid var(--hv-color-border)',
  borderRadius: 'var(--hv-radius-sm)',
  color: 'var(--hv-color-text)',
  fontSize: 'var(--hv-font-size-xs)',
}

const chartTooltipLabelStyle = {
  color: 'var(--hv-color-text-muted)',
  fontWeight: 600,
}

export function DashboardView({
  activeCategoryByName,
  actualVariableSpend,
  cashflowAccounts,
  currentCashPosition,
  monthPositionTrend,
  onOpenAccounts,
  remainingPlannedSpend,
  savingsGoalVariance,
  spendByCategory,
  totalBudgetRemaining,
  trackedMonthEndPosition,
}: DashboardViewProps) {
  return (
    <Stack gap="md">
      <DashboardGrid columns={12} gap="md">
        <DashboardGridItem span={{ base: 12, sm: 6, lg: 3 }}>
          <DashboardMetric actions={<Landmark size={20} />} label="Current cash" value={<MoneyAmount amount={currentCashPosition} neutral />} />
        </DashboardGridItem>
        <DashboardGridItem span={{ base: 12, sm: 6, lg: 3 }}>
          <DashboardMetric actions={<WalletCards size={20} />} label="Projected month end" value={<MoneyAmount amount={trackedMonthEndPosition} neutral />} />
        </DashboardGridItem>
        <DashboardGridItem span={{ base: 12, sm: 6, lg: 3 }}>
          <DashboardMetric actions={<Banknote size={20} />} label={totalBudgetRemaining >= 0 ? 'Budget remaining' : 'Budget over'} value={<MoneyAmount amount={Math.abs(totalBudgetRemaining)} neutral />} />
        </DashboardGridItem>
        <DashboardGridItem span={{ base: 12, sm: 6, lg: 3 }}>
          <DashboardMetric actions={<CreditCard size={20} />} label="$1k savings variance" value={<MoneyAmount amount={savingsGoalVariance} />} />
        </DashboardGridItem>
      </DashboardGrid>

      <DashboardGrid columns={12} gap="md">
        <DashboardGridItem span={{ base: 12, lg: 8 }}>
          <Panel>
            <PanelHeader
              heading="Month value projection"
              actions={
                <Text size="sm" tone="muted">
                  After <MoneyAmount amount={remainingPlannedSpend} neutral /> left to spend
                </Text>
              }
            />
            <PanelBody padding="sm">
              <ResponsiveContainer width="100%" height={280}>
                <RechartsLineChart data={monthPositionTrend} margin={{ top: 12, right: 16, bottom: 8, left: 8 }}>
                  <CartesianGrid stroke="var(--hv-color-border-strong)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={chartAxisTick} tickLine={false} axisLine={false} />
                  <YAxis
                    domain={['dataMin - 1000', 'dataMax + 1000']}
                    tick={chartAxisTick}
                    tickFormatter={(value) => currency.format(Number(value))}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    labelStyle={chartTooltipLabelStyle}
                    formatter={(value, name) => [
                      currency.format(Number(value)),
                      name === 'expected' ? 'Current cash' : 'Projected cash',
                    ]}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Line
                    dataKey="expected"
                    dot={false}
                    stroke="var(--hv-color-text-muted)"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    type="monotone"
                  />
                  <Line
                    dataKey="tracked"
                    dot={{ r: 4 }}
                    stroke="var(--hv-color-accent)"
                    strokeWidth={3}
                    type="monotone"
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </PanelBody>
          </Panel>
        </DashboardGridItem>

        <DashboardGridItem span={{ base: 12, lg: 4 }}>
          <TableFrame
            density="compact"
            heading="Cashflow accounts"
            toolbar={<Text size="sm" tone="muted">{cashflowAccounts.length} active</Text>}
          >
            {cashflowAccounts.length === 0 ? (
              <EmptyState
                actions={(
                  <Button onClick={onOpenAccounts} size="sm">
                    <Plus size={18} />
                    Add accounts
                  </Button>
                )}
                description="Add your real accounts before importing transactions."
                title="No cashflow accounts"
              />
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Account</TableHeaderCell>
                    <TableHeaderCell align="right">Balance</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cashflowAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <Text weight="semibold">{account.name}</Text>
                        <Text size="xs" tone="muted">{[account.institution, account.type].filter(Boolean).join(' | ')}</Text>
                      </TableCell>
                      <TableCell align="right">
                        <MoneyAmount amount={accountSignedBalance(account)} neutral />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableFrame>
        </DashboardGridItem>
      </DashboardGrid>

      <Panel>
        <PanelHeader
          heading="Actual variable spending by category"
          actions={<Text size="sm" tone="muted"><MoneyAmount amount={-actualVariableSpend} /></Text>}
        />
        <PanelBody padding="sm">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={spendByCategory} margin={{ top: 12, right: 16, bottom: 12, left: 8 }}>
              <CartesianGrid stroke="var(--hv-color-border-strong)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="category" tick={chartAxisTick} tickLine={false} axisLine={false} />
              <YAxis tick={chartAxisTick} tickFormatter={(value) => `$${value}`} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={chartTooltipStyle}
                labelStyle={chartTooltipLabelStyle}
                formatter={(value) => currency.format(Number(value))}
              />
              <Bar dataKey="spent" radius={[6, 6, 0, 0]}>
                {spendByCategory.map((entry, index) => (
                  <Cell
                    fill={
                      activeCategoryByName.get(entry.category)?.color ??
                      categoryColors[entry.category] ??
                      categoryPalette[index % categoryPalette.length]
                    }
                    key={entry.category}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </PanelBody>
      </Panel>
    </Stack>
  )
}
