import { Plus } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { currency } from '../../domain/defaults'
import { MoneyAmount } from '../ui/MoneyAmount'

export type NetWorthSnapshotFormState = {
  date: string
  assets: string
  liabilities: string
}

type NetWorthViewProps = {
  latestNetWorth: number
  newSnapshot: NetWorthSnapshotFormState
  onAddSnapshot: (event: React.FormEvent<HTMLFormElement>) => void
  onNewSnapshotChange: (snapshot: NetWorthSnapshotFormState) => void
  trend: Array<{ date: string; netWorth: number }>
}

export function NetWorthView({
  latestNetWorth,
  newSnapshot,
  onAddSnapshot,
  onNewSnapshotChange,
  trend,
}: NetWorthViewProps) {
  return (
    <section className="view-stack">
      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <h2>Net worth trend</h2>
            <span><MoneyAmount amount={latestNetWorth} neutral /></span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="netWorthFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#187b63" stopOpacity={0.34} />
                  <stop offset="95%" stopColor="#187b63" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => currency.format(Number(value))} />
              <Area dataKey="netWorth" fill="url(#netWorthFill)" stroke="#187b63" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <form className="panel snapshot-form" onSubmit={onAddSnapshot}>
          <h2>Add snapshot</h2>
          <label>
            Date
            <input
              onChange={(event) => onNewSnapshotChange({ ...newSnapshot, date: event.target.value })}
              type="date"
              value={newSnapshot.date}
            />
          </label>
          <label>
            Assets
            <input
              onChange={(event) => onNewSnapshotChange({ ...newSnapshot, assets: event.target.value })}
              placeholder="61200"
              type="number"
              value={newSnapshot.assets}
            />
          </label>
          <label>
            Liabilities
            <input
              onChange={(event) => onNewSnapshotChange({ ...newSnapshot, liabilities: event.target.value })}
              placeholder="4600"
              type="number"
              value={newSnapshot.liabilities}
            />
          </label>
          <button className="primary-action" type="submit">
            <Plus size={18} />
            Save snapshot
          </button>
        </form>
      </div>
    </section>
  )
}
