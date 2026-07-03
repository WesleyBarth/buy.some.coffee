import {
  Button,
  DashboardGrid,
  DashboardGridItem,
  DashboardMetric,
  Input,
  Inline,
  Panel,
  PanelBody,
  PanelHeader,
  Progress,
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
import { Save } from 'lucide-react'
import {
  budgetDraftKey,
  type BudgetRow,
  type BudgetSummary,
} from '../../domain/budgets'
import { MoneyAmount } from '../ui/MoneyAmount'

type BudgetsViewProps = {
  budgetDrafts: Record<string, string>
  currentMonth: string
  onDraftChange: (category: string, value: string) => void
  onSaveBudget: (category: string) => void
  rows: BudgetRow[]
  savingBudgetCategory: string
  summary: BudgetSummary
}

export function BudgetsView({
  budgetDrafts,
  currentMonth,
  onDraftChange,
  onSaveBudget,
  rows,
  savingBudgetCategory,
  summary,
}: BudgetsViewProps) {
  return (
    <Stack gap="sm">
      <Panel>
        <PanelHeader heading="Monthly budgets" />
        <PanelBody padding="sm">
          <DashboardGrid columns={12} gap="sm">
            <DashboardGridItem span={{ base: 12, sm: 6, lg: 3 }}>
              <DashboardMetric
                description={summary.totalBudgetRemaining >= 0 ? 'remaining across budgeted categories' : 'over planned budgets'}
                label="Current state"
                value={<MoneyAmount amount={summary.totalBudgetRemaining} neutral />}
              />
            </DashboardGridItem>
            <DashboardGridItem span={{ base: 12, sm: 6, lg: 3 }}>
              <DashboardMetric
                description={
                  <>
                    <Progress
                      aria-label="Total budget usage"
                      max={100}
                      tone={budgetProgressTone(summary.totalBudgetUsageRatio)}
                      value={Math.min(summary.totalBudgetUsageRatio * 100, 100)}
                    />
                    <Text size="xs" tone="muted">
                      <MoneyAmount amount={-summary.totalBudgetSpent} /> spent / <MoneyAmount amount={summary.totalPlannedBudget} neutral /> planned
                    </Text>
                  </>
                }
                label="Budget usage"
                value={`${Math.round(summary.totalBudgetUsageRatio * 100)}%`}
              />
            </DashboardGridItem>
            <DashboardGridItem span={{ base: 12, sm: 6, lg: 3 }}>
              <DashboardMetric
                label="Left to spend"
                value={<MoneyAmount amount={summary.remainingPlannedSpend} neutral />}
              />
            </DashboardGridItem>
            <DashboardGridItem span={{ base: 12, sm: 6, lg: 3 }}>
              <DashboardMetric
                label="Over budget"
                tone={summary.totalBudgetOverage > 0 ? 'danger' : undefined}
                value={<MoneyAmount amount={-summary.totalBudgetOverage} />}
              />
            </DashboardGridItem>
          </DashboardGrid>
        </PanelBody>
        <PanelBody padding="none">
          <TableFrame density="compact">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Category</TableHeaderCell>
                  <TableHeaderCell>Progress</TableHeaderCell>
                  <TableHeaderCell>Planned</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((budget) => {
                  const draftKey = budgetDraftKey(currentMonth, budget.category)
                  const draftValue = budgetDrafts[draftKey]
                  const plannedInputValue = draftValue ?? String(budget.planned)
                  const draftPlanned = draftValue === undefined || draftValue.trim() === '' ? 0 : Number(draftValue)
                  const hasDraft = draftValue !== undefined && Number.isFinite(draftPlanned)
                  const hasChanges = hasDraft && Math.max(0, draftPlanned) !== budget.planned
                  const saving = savingBudgetCategory === budget.category

                  return (
                    <TableRow key={budget.id}>
                      <TableCell>
                        <Text weight="bold">{budget.category}</Text>
                        <Text size="xs" tone="muted">{budget.remaining >= 0 ? 'On plan' : 'Over budget'}</Text>
                      </TableCell>
                      <TableCell>
                        <Stack gap="xs">
                          <Inline gap="md" wrap>
                            <Text size="xs" tone="muted">
                              Spent <MoneyAmount amount={-budget.spent} />
                            </Text>
                            <Text size="xs" tone="muted">
                              {budget.remaining >= 0 ? 'Remaining' : 'Over'}
                              <MoneyAmount amount={Math.abs(budget.remaining)} neutral />
                            </Text>
                          </Inline>
                          <Progress
                            aria-label={`${budget.category} budget usage`}
                            max={100}
                            tone={budgetProgressTone(budget.usageRatio)}
                            value={Math.min(budget.usageRatio * 100, 100)}
                          />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Inline align="center" gap="xs" justify="end" wrap>
                          <Input
                            aria-label={`${budget.category} planned budget`}
                            inputSize="sm"
                            min="0"
                            onChange={(event) => onDraftChange(budget.category, event.target.value)}
                            step="10"
                            type="number"
                            value={plannedInputValue}
                          />
                          <Button
                            aria-label={`Save ${budget.category} planned budget`}
                            disabled={!hasChanges || saving}
                            onClick={() => onSaveBudget(budget.category)}
                            size="sm"
                          >
                            <Save size={16} />
                            {saving ? 'Saving...' : 'Save'}
                          </Button>
                        </Inline>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableFrame>
        </PanelBody>
      </Panel>
    </Stack>
  )
}

function budgetProgressTone(ratio: number) {
  if (ratio >= 1) return 'danger'
  if (ratio >= 0.82) return 'warning'
  return 'success'
}
