# OPINIONS.md

Agent-facing finance model decisions for Buy Some Coffee. Keep this file compact,
declarative, and focused on durable calculation philosophy. Use
`docs/Cashflow Engine Reference.md` as the authoritative migration reference.

## Purpose

- Provide a cohesive monthly operating picture.
- Support spending analysis, category drill-down, budget alarms, recurring
  cashflows, Plaid syncing, account balance reconciliation, and net worth tracking.
- Use enough accounting structure to avoid contradictions between balances,
  transactions, debt, transfers, budgets, and cashflow.

## Core Invariants

- Plaid balances are the source of truth for current account state when connected.
- Transactions explain activity and bridge prior accepted balances to current
  balances.
- Do not assume the transaction table alone can derive exact current balances.
- Reconcile balances by comparing prior accepted balance, posted transaction
  activity, current Plaid balance, and unexplained delta.
- Negative transaction amounts are account outflows.
- Positive transaction amounts are account inflows.
- Sign does not determine spending/income by itself.
- Category is the single user-facing semantic choice per transaction.
- Hidden transaction role drives calculations.
- Monthly cash balance is the primary planning metric.
- Cash on hand excludes savings accounts.
- Unpaid credit card balances offset cash on hand when those balances will be paid
  from monthly cash.
- Credit card purchases count as spending when posted.
- Credit card payments are settlement, not spending.
- Savings transfers reduce cash on hand without counting as spending.
- Credit and loan balances are normalized as liabilities.
- Investment accounts are not operating cashflow accounts.
- Net worth is out of scope for the cashflow-engine migration pass.
- Local demo mode must continue to work without Supabase.
- Plaid secrets and access tokens must stay server-side.

## Transaction Role

Roles are calculation semantics, usually inferred from the selected category.
Users should not normally select roles directly.

Candidate roles:

- `external_expense`
- `external_income`
- `internal_transfer`
- `credit_card_payment`
- `balance_adjustment`
- `investment_movement`
- `ignore`

Rules:

- Role determines inclusion in spending, income, budgets, cashflow, reconciliation,
  and net worth calculations.
- Category remains the visible analysis label.
- Category may define role directly or inherit it from the nearest ancestor category
  with a role.
- Use role, not category name alone, to protect calculations.

## Category Tree

- Categories form a user-defined tree.
- No separate "category group" entity is needed.
- A category may be both selectable and a parent of more specific categories.
- Each transaction has exactly one selected category.
- Ancestors provide implicit reporting and budget rollups.
- Parent-category transactions remain visible as direct parent activity.
- UI may show category names flat or as paths depending on context.
- Budgets should usually attach to the broad budgetable ancestor by default.
- Child categories support drill-down analysis.

Minimal example:

```text
Expense
  Shopping
    Amazon
    Home Depot
  Eating Out
    DoorDash
```

`DoorDash` may inherit `external_expense` from `Eating Out`. Spending categorized
directly as `Shopping` should report as direct `Shopping` activity, not as a fake
child category.

## Cashflow

Monthly cash balance means cash on hand after actual activity, unpaid credit card
liabilities, expected income, expected obligations, and planned variable spending.

Include:

- Regular income
- Irregular income
- External purchases and bills
- Fees and interest
- Savings transfers as increases or reductions to cash on hand

Exclude:

- Checking to credit card payments
- Credit card payment credits
- Brokerage contributions when modeled as internal allocation
- User-owned account-to-account movement that does not cross the cash-on-hand
  boundary

Internal movement still affects individual account balances. Savings is not cash on
hand for the month model.

## Credit Card Payments

Credit card payments are paired internal movement when both accounts are user-owned.
They are distinct from generic internal transfers.

Example:

```text
Checking: -$4,789.45
Credit card: +$4,789.45
```

Expected treatment:

- Checking cash decreases.
- Credit liability decreases.
- Net worth is unchanged.
- Spending is unchanged.
- Income is unchanged.
- Budget usage is unchanged.
- Debt repayment reporting may show activity, but must not double count as spending.

Preferred model: represent these with a first-class role and, when possible, a pair
or transfer group id.

Credit card purchases are the spending event. The later payment is settlement of an
existing liability.

## Budgets

- Budgets alarm on controllable or planned external expense categories.
- Budget spending includes `external_expense` transactions assigned to budgetable
  categories or descendants of budgetable categories.
- Budget spending excludes transfers, credit card payment pairs, income, recurring
  income, balance adjustments, internal account movement, and ignored transactions.
- Recurring bills may inform projections and recurring views, but actual budget spend
  should be counted once.

## Monthly Cash Balance

The month is modeled as cash on hand minus unpaid credit card liabilities plus
predictable inflows, obligations, and variable spending capacity.

Expose:

- Starting cash on hand
- Current cash on hand
- Unpaid credit card liability
- Expected remaining regular income
- Expected remaining recurring obligations
- Remaining planned variable spend
- Projected month-end cash balance
- Variance from savings/cushion target

Live balances describe current state. Transactions explain change. Reconciliation
surfaces disagreement.

## Reconciliation

Reconciliation is an automatic cashflow-engine validation step, not a required
manual bookkeeping workflow. Manual review is only the mediation path when the
engine cannot confidently model posted activity or explain account balances.

Per account, answer:

1. Last accepted balance.
2. New posted transactions.
3. Transaction-implied balance.
4. Current Plaid balance.
5. Unexplained delta.
6. Likely internal transfer pairs.
7. Ignored pending transactions, if shown in preview.

Suggested statuses:

- `current`: Plaid balance and imported activity agree within tolerance.
- `needs_review`: imported activity does not explain Plaid balance.
- `unmapped`: Plaid account is not linked to an app account.

Every posted Plaid transaction affecting a mapped account must be accounted for
before a sync session is complete. Valid modeled outcomes:

- Imported as a normal transaction.
- Matched to an existing duplicate.
- Paired/classified as `credit_card_payment`.
- Paired/classified as `internal_transfer`.
- Explicitly ignored with role/reason.
- Represented by an accepted balance adjustment, if supported later.

Ambiguous posted transactions cannot be silently skipped while still considering the
account reconciled.

## Plaid Sync Flow

Target one-button flow:

1. Fetch transaction updates since last committed cursor.
2. Preview added, modified, and removed transactions.
3. Exclude pending transactions from import and calculations by default.
4. Detect likely duplicates, credit card payments, and transfer pairs.
5. Apply category, role, and recurring match rules.
6. Require every posted balance-affecting row to have a modeled outcome.
7. Import modeled transactions.
8. Refresh Plaid balances.
9. Reconcile balances against posted imported activity.
10. Require unresolved account deltas to be resolved or explicitly accepted.
11. Commit cursor/checkpoint only after the session is accepted.

## Open Decisions

- Whether reconciliation should create explicit balance adjustment rows for
  unexplained deltas.
- Exact duplicate-detection thresholds and review UI.
- Exact transfer-pair matching rules.
