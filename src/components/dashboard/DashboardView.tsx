import { Banknote, CreditCard, Landmark, Plus, WalletCards } from 'lucide-react'
import { clsx } from 'clsx'
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
import { MetricCard, MetricGrid } from '../ui/MetricCard'
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
    <section className="view-stack">
      <MetricGrid>
        <MetricCard icon={Landmark} label="Current cash" value={<MoneyAmount amount={currentCashPosition} neutral />} />
        <MetricCard icon={WalletCards} label="Projected month end" value={<MoneyAmount amount={trackedMonthEndPosition} neutral />} tone="green" />
        <MetricCard
          icon={Banknote}
          label={totalBudgetRemaining >= 0 ? 'Budget remaining' : 'Budget over'}
          value={
            <span className={clsx('budget-state-amount', totalBudgetRemaining >= 0 ? 'remaining' : 'over')}>
              <MoneyAmount amount={Math.abs(totalBudgetRemaining)} neutral />
            </span>
          }
        />
        <MetricCard icon={CreditCard} label="$1k savings variance" value={<MoneyAmount amount={savingsGoalVariance} />} tone="amber" />
      </MetricGrid>

      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <h2>Month value projection</h2>
            <span>
              After <MoneyAmount amount={remainingPlannedSpend} neutral /> left to spend
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RechartsLineChart data={monthPositionTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis
                domain={['dataMin - 1000', 'dataMax + 1000']}
                tickFormatter={(value) => currency.format(Number(value))}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value, name) => [
                  currency.format(Number(value)),
                  name === 'expected' ? 'Current cash' : 'Projected cash',
                ]}
                labelFormatter={(label) => `${label}`}
              />
              <Line
                dataKey="expected"
                dot={false}
                stroke="#737985"
                strokeDasharray="5 5"
                strokeWidth={2}
                type="monotone"
              />
              <Line
                dataKey="tracked"
                dot={{ r: 4 }}
                stroke="#2f6f9f"
                strokeWidth={3}
                type="monotone"
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>Cashflow accounts</h2>
            <span>{cashflowAccounts.length} active</span>
          </div>
          {cashflowAccounts.length === 0 ? (
            <div className="empty-inline">
              <p>Add your real accounts before importing transactions.</p>
              <button className="primary-action" onClick={onOpenAccounts} type="button">
                <Plus size={18} />
                Add accounts
              </button>
            </div>
          ) : (
            <div className="account-list">
              {cashflowAccounts.map((account) => (
                <div className="account-row" key={account.id}>
                  <div>
                    <strong>{account.name}</strong>
                    <span>{[account.institution, account.type].filter(Boolean).join(' | ')}</span>
                  </div>
                  <div className="account-value-stack">
                    <MoneyAmount amount={accountSignedBalance(account)} neutral />
                    <span>current balance</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="panel chart-panel">
        <div className="panel-heading">
          <h2>Actual variable spending by category</h2>
          <span><MoneyAmount amount={-actualVariableSpend} /></span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={spendByCategory}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="category" tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(value) => `$${value}`} tickLine={false} axisLine={false} />
            <Tooltip formatter={(value) => currency.format(Number(value))} />
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
      </section>
    </section>
  )
}
