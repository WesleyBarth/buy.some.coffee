import { Button, DashboardGrid, DashboardGridItem, Field, Input, Label, Panel, PanelBody, PanelHeader, Stack, Text } from '@hyperview/ui'
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
    <Stack gap="sm">
      <DashboardGrid columns={12} gap="sm">
        <DashboardGridItem span={{ base: 12, lg: 8 }}>
          <Panel>
            <PanelHeader
              heading="Net worth trend"
              actions={<Text size="sm" tone="muted"><MoneyAmount amount={latestNetWorth} neutral /></Text>}
            />
            <PanelBody padding="none">
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
            </PanelBody>
          </Panel>
        </DashboardGridItem>

        <DashboardGridItem span={{ base: 12, lg: 4 }}>
          <Panel>
            <PanelHeader heading="Add snapshot" />
            <PanelBody padding="sm">
          <form onSubmit={onAddSnapshot}>
            <Stack gap="sm">
              <Field>
                <Label>Date</Label>
                <Input
                  inputSize="sm"
                  onChange={(event) => onNewSnapshotChange({ ...newSnapshot, date: event.target.value })}
                  type="date"
                  value={newSnapshot.date}
                />
              </Field>
              <Field>
                <Label>Assets</Label>
                <Input
                  inputSize="sm"
                  onChange={(event) => onNewSnapshotChange({ ...newSnapshot, assets: event.target.value })}
                  placeholder="61200"
                  type="number"
                  value={newSnapshot.assets}
                />
              </Field>
              <Field>
                <Label>Liabilities</Label>
                <Input
                  inputSize="sm"
                  onChange={(event) => onNewSnapshotChange({ ...newSnapshot, liabilities: event.target.value })}
                  placeholder="4600"
                  type="number"
                  value={newSnapshot.liabilities}
                />
              </Field>
              <Button size="sm" type="submit">
                <Plus size={18} />
                Save snapshot
              </Button>
            </Stack>
          </form>
            </PanelBody>
          </Panel>
        </DashboardGridItem>
      </DashboardGrid>
    </Stack>
  )
}
