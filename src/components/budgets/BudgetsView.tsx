import { Save } from 'lucide-react'
import {
  budgetDraftKey,
  budgetUsageColor,
  type BudgetRow,
  type BudgetSummary,
} from '../../domain/budgets'
import { MoneyAmount } from '../ui/MoneyAmount'
import { Surface } from '../ui/Surface'

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
    <section className="view-stack">
      <Surface className="budget-surface" title="Monthly budgets" variant="table">
        <div className="budget-summary" aria-label="Monthly budget summary">
          <div className="budget-summary-primary">
            <span>Current state</span>
            <strong>
              <MoneyAmount amount={summary.totalBudgetRemaining} neutral />
            </strong>
            <p>{summary.totalBudgetRemaining >= 0 ? 'remaining across budgeted categories' : 'over planned budgets'}</p>
          </div>
          <div className="budget-summary-meter">
            <div className="budget-summary-track" aria-hidden="true">
              <span
                style={{
                  background: budgetUsageColor(summary.totalBudgetUsageRatio),
                  width: `${Math.min(summary.totalBudgetUsageRatio * 100, 100)}%`,
                }}
              />
            </div>
            <div>
              <span>
                <MoneyAmount amount={-summary.totalBudgetSpent} /> spent
              </span>
              <span>
                <MoneyAmount amount={summary.totalPlannedBudget} neutral /> planned
              </span>
            </div>
          </div>
          <div className="budget-summary-stat">
            <span>Left to spend</span>
            <strong>
              <MoneyAmount amount={summary.remainingPlannedSpend} neutral />
            </strong>
          </div>
          <div className="budget-summary-stat">
            <span>Over budget</span>
            <strong>
              <MoneyAmount amount={-summary.totalBudgetOverage} />
            </strong>
          </div>
        </div>
        <div className="budget-list">
          <div className="budget-row budget-row-head" aria-hidden="true">
            <span>Category</span>
            <span>Progress</span>
            <span>Planned</span>
          </div>
          {rows.map((budget) => {
            const draftKey = budgetDraftKey(currentMonth, budget.category)
            const draftValue = budgetDrafts[draftKey]
            const plannedInputValue = draftValue ?? String(budget.planned)
            const draftPlanned = draftValue === undefined || draftValue.trim() === '' ? 0 : Number(draftValue)
            const hasDraft = draftValue !== undefined && Number.isFinite(draftPlanned)
            const hasChanges = hasDraft && Math.max(0, draftPlanned) !== budget.planned
            const saving = savingBudgetCategory === budget.category

            return (
              <div className="budget-row" key={budget.id}>
                <div className="budget-row-title">
                  <strong>{budget.category}</strong>
                  <span>{budget.remaining >= 0 ? 'On plan' : 'Over budget'}</span>
                </div>
                <div className="budget-row-progress">
                  <div className="budget-row-numbers">
                    <span>
                      Spent <MoneyAmount amount={-budget.spent} />
                    </span>
                    <span className={budget.remaining >= 0 ? 'remaining' : 'over'}>
                      {budget.remaining >= 0 ? 'Remaining' : 'Over'}
                      <MoneyAmount amount={Math.abs(budget.remaining)} neutral />
                    </span>
                  </div>
                  <div className="budget-track" aria-hidden="true">
                    <span
                      style={{
                        background: budgetUsageColor(budget.usageRatio),
                        width: `${Math.min(budget.usageRatio * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="budget-entry">
                  <label className="currency-input">
                    <span aria-hidden="true">$</span>
                    <input
                      aria-label={`${budget.category} planned budget`}
                      min="0"
                      onChange={(event) => onDraftChange(budget.category, event.target.value)}
                      step="10"
                      type="number"
                      value={plannedInputValue}
                    />
                  </label>
                  <button
                    aria-label={`Save ${budget.category} planned budget`}
                    className="primary-action compact-action"
                    disabled={!hasChanges || saving}
                    onClick={() => onSaveBudget(budget.category)}
                    type="button"
                  >
                    <Save size={16} />
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </Surface>
    </section>
  )
}
