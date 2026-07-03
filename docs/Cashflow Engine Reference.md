# Cashflow Engine Reference

Authoritative target model for future cashflow, category, Plaid import, duplicate
detection, and reconciliation migrations.

## Scope

- This pass targets the cashflow engine.
- Net worth, investment analytics, and long-term debt payoff analytics are out of
  scope.
- Existing recurring expense/income behavior should be preserved unless it conflicts
  with these rules.

## Primary Metric

The primary planning metric is monthly cash balance.

```text
monthly_cash_balance =
  cash_on_hand
  - unpaid_credit_card_liability
  + expected_remaining_income
  - expected_remaining_recurring_expenses
  - remaining_planned_variable_spend
```

Definitions:

- `cash_on_hand`: monthly spendable cash accounts, such as checking and physical
  cash.
- Savings accounts are not cash on hand.
- Credit card liabilities offset cash on hand when they will be paid from monthly
  cash.
- Plaid balances are the source of truth for current account state.
- Transactions explain balance movement and drive spending, budget, category, and
  recurring analysis.

## Account Treatment

| Account type | Cash on hand | Liability offset | Reconciled balance |
| --- | --- | --- | --- |
| checking | yes | no | yes |
| cash | yes | no | yes |
| savings | no | no | yes |
| credit | no | yes | yes |
| loan | no | no, unless explicitly added later | yes |
| investment | no | no | yes, but out of cashflow scope |

Credit and loan balances remain normalized as liabilities where used.

## Transaction Roles

Roles are hidden calculation semantics. Users normally choose only a category.

| Role | Spending | Income | Budget | Monthly cash | Notes |
| --- | --- | --- | --- | --- | --- |
| `external_expense` | yes | no | yes if budgetable | decreases | Purchases, bills, fees. |
| `external_income` | no | yes | no | increases | Payroll and other income. |
| `credit_card_payment` | no | no | no | neutral if paired against liability | Settlement of existing card liability. |
| `internal_transfer` | no | no | no | depends on destination/source | Checking to savings reduces cash on hand. |
| `balance_adjustment` | no | no | no | reconciliation only | Possible future reconciliation artifact. |
| `investment_movement` | no | no | no | out of scope | Excluded from monthly cash. |
| `ignore` | no | no | no | no | Excluded from calculations. |

Do not add a generic `debt_payment` role for this pass. Credit balance payoff is
modeled as `credit_card_payment`.

## Category Tree

- Each transaction has one selected category.
- Categories form a user-defined parent-child tree.
- A category may be both selectable and a parent.
- Category may define role directly or inherit role from nearest ancestor with role.
- Category ancestors provide rollups for reporting and budgets.
- Parent-category transactions remain direct activity in that parent.

Example:

```text
Expense
  Shopping
    Amazon
    Home Depot
  Eating Out
    DoorDash
```

`DoorDash` can inherit `external_expense` from `Eating Out`. A transaction selected
as `Shopping` remains direct `Shopping` activity.

## Credit Card Flow

Credit card purchase:

```text
Card purchase: -$40
role: external_expense
effect: spending +$40, unpaid card liability +$40, monthly cash balance -$40
```

Credit card payment:

```text
Checking payment: -$40
Card credit: +$40
role: credit_card_payment
effect: cash on hand -$40, unpaid card liability -$40, monthly cash balance neutral
```

Rules:

- The purchase is the spending event.
- The payment is settlement.
- Payment must not count as spending, income, or budget usage.
- Payment should be paired when both sides are imported.
- If only one side is present, classify as `credit_card_payment` and surface review
  if reconciliation cannot explain balances.

## Savings Flow

Checking to savings transfer:

```text
Checking: -$1,000
Savings: +$1,000
role: internal_transfer
effect: cash on hand -$1,000, spending unchanged, monthly cash balance -$1,000
```

Rules:

- Savings is not cash on hand.
- Transfer into savings reduces monthly cash balance.
- Transfer out of savings increases monthly cash balance.
- Savings transfers do not count as spending or income.

## Pending Transactions

- Pending Plaid transactions are excluded from import by default.
- Pending transactions do not affect spending, budgets, monthly cash balance, or
  reconciliation.
- Posted transactions should be imported on a later sync when Plaid supplies them as
  posted updates.

## Duplicate Detection

Duplicate detection is in scope for the cashflow-engine migration.

Required signals:

- Plaid transaction id or external id.
- Pending transaction id when Plaid supplies it.
- Account id.
- Amount.
- Date or small date window.
- Normalized description or merchant.
- Role/category hints after classification.

Expected behavior:

- Exact external-id duplicates are skipped or marked duplicate.
- Plaid pending-to-posted replacements should not create duplicate spending.
- Semantic duplicates should be reviewed before import.
- Duplicate detection must run before committing the Plaid cursor.

## Modeled Outcomes

Every posted Plaid transaction affecting a mapped account must end a sync session
with an explicit modeled outcome.

Valid outcomes:

- Imported as a normal transaction.
- Matched to an existing duplicate.
- Paired/classified as `credit_card_payment`.
- Paired/classified as `internal_transfer`.
- Explicitly ignored with role/reason.
- Represented by an accepted balance adjustment, if supported later.

Ambiguous posted rows cannot be silently skipped while still considering the account
reconciled.

Presentation and matching data should remain separate:

- `originalDescription`: immutable Plaid/bank text.
- `description`: cleaned display text.
- merchant/payee alias: normalized identity for future matching.
- `category`: user semantic classification.
- `role`: hidden calculation behavior.

## Reconciliation

Reconciliation is automatic cashflow-engine validation, not a required manual
bookkeeping workflow. Manual review only mediates `needs_review` cases.

Reconcile per account, not globally.

For each synced account:

1. Read last accepted balance.
2. Sum posted imported transactions since that checkpoint.
3. Compute transaction-implied balance.
4. Compare to current Plaid balance.
5. Detect unexplained delta.
6. Detect likely transfer or credit-card-payment pairs.
7. Surface status.

Statuses:

- `current`: Plaid balance and imported activity agree within tolerance.
- `needs_review`: imported activity does not explain Plaid balance.
- `unmapped`: Plaid account is not linked to an app account.

Pending transactions should not create a `pending` reconciliation state in this pass
because they are excluded from import and calculations.

Gates:

- Import gate: every posted update must have a modeled outcome.
- Balance gate: every mapped account must reconcile to Plaid balance, or the user
  must explicitly accept the unresolved checkpoint/adjustment.

Do not commit the Plaid cursor or balance checkpoint until both gates pass.

## One-Button Sync Target

1. Fetch Plaid transaction updates since last committed cursor.
2. Exclude pending transactions from import/calculations by default.
3. Preview added, modified, and removed posted transactions.
4. Classify category and inferred role.
5. Detect exact and semantic duplicates.
6. Detect credit card payments and internal transfer pairs.
7. Require every posted balance-affecting row to have a modeled outcome.
8. Import modeled transactions.
9. Refresh Plaid balances.
10. Reconcile accounts.
11. Require unresolved account deltas to be resolved or explicitly accepted.
12. Commit cursor/checkpoint after accepted review.
