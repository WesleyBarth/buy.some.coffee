# Cashflow Engine Migration Plan

This plan starts the migration from the current category/sign-driven behavior to
the central cashflow workflow described in `OPINIONS.md` and
`docs/Cashflow Engine Reference.md`.

## Current State Snapshot

- `src/domain/types.ts` has flat categories with `type` and `budgetable`, but no
  parent category, inherited role, transaction role, transfer grouping, or review
  outcome fields.
- `src/domain/accounts.ts` treats every non-investment account as cashflow. The
  target model requires cash on hand to include checking and cash only; savings is
  reconciled but outside monthly cash.
- Dashboard and budget calculations in `src/App.tsx`, `src/domain/budgets.ts`,
  and `src/domain/dashboard.ts` mostly infer semantics from category name/type and
  `amount < 0`.
- Plaid transaction preview excludes unmapped accounts, skips pending imports by
  UI default, detects duplicates with a local dedupe key plus Plaid transaction id,
  and commits the cursor immediately after import or manual review.
- Plaid balances can be refreshed and copied into mapped app accounts, but there
  is no accepted balance checkpoint, per-account reconciliation result, modeled
  transaction outcome, transfer pair, or cursor gate tied to reconciliation.
- The app currently has a single implicit month based on the calendar current
  month. Historical analysis needs an explicit selected month state so dashboard,
  budgets, recurring projections, charts, and Plaid/reconciliation views can all
  refer to the same period.
- Existing Supabase migrations are append-only; future schema changes must be new
  migrations and must preserve local demo mode.

## Migration Principles

- Add the calculation model before changing user-facing workflows.
- Keep category as the visible user choice and move calculation behavior into
  hidden roles.
- Preserve existing localStorage/demo data by deriving default roles from existing
  category metadata when persisted role fields are missing.
- Make database changes additive first, then migrate calculations, then tighten
  Plaid sync gates.
- Keep net worth behavior stable during this pass; only shared account balance
  normalization should be reused.
- Optimize for a private, straightforward financial life. Document edge cases, but
  build the simple correct path first.
- Do not use ignored Plaid rows as a normal import outcome. A posted mapped Plaid
  row should be modeled into the account activity, matched as an existing
  duplicate, paired as settlement/transfer, or held for review.

## Phase 0: Month Selection State

Goal: make the app's monthly operating picture navigable before deeper engine
changes make month-specific analysis more important.

1. Add a global selected month state owned near the existing app state in
   `src/App.tsx`.
2. Default the selected month to the current calendar month.
3. Provide a compact month selector with:
   - current month shortcut
   - previous/next month controls
   - direct month selection for historical review
4. Replace direct uses of current calendar month for analysis views with selected
   month where the screen is explicitly month-based:
   - dashboard
   - budgets
   - recurring projections
   - transaction month filters
   - spend/category charts
5. Keep non-month-bound surfaces independent:
   - account balances
   - Plaid account mapping
   - net worth snapshots unless filtered later

Acceptance:

- The default behavior remains current-month analysis.
- Previous months can be selected without changing account balances or current
  Plaid status.
- Monthly calculations consume one shared selected month instead of each view
  independently assuming today.

## Phase 1: Domain Model Foundations

Goal: make roles and category hierarchy representable without changing major UI
workflows.

1. Add shared types:
   - `TransactionRole`
   - `ReconciliationStatus`
   - `PlaidModeledOutcome`
   - category `parentId?: string`
   - category `role?: TransactionRole`
   - transaction `role?: TransactionRole`
   - transaction `transferGroupId?: string`
   - transaction `pendingExternalId?: string`
   - transaction `originalDescription?: string`
2. Add pure category helpers in `src/domain/categories.ts`:
   - build a category lookup by id/name
   - resolve category ancestors
   - resolve inherited role from selected category to nearest ancestor
   - determine whether a category is budgetable through ancestors
3. Add pure transaction classification helpers:
   - infer effective transaction role from explicit transaction role, selected
     category role, legacy category type, then sign fallback
   - classify spending, income, budget inclusion, and monthly cash inclusion from
     role plus account treatment
4. Update defaults so local demo categories have roles equivalent to current
   behavior without introducing visible role selection.

Acceptance:

- Existing screens still render with current demo data.
- Current flat categories continue working.
- New helpers can represent a category tree even before the UI exposes nesting.

## Phase 2: Additive Supabase Schema

Goal: persist the new model while remaining compatible with existing rows.

Create a new timestamped migration that adds:

- `categories.parent_id uuid references public.categories(id) on delete set null`
- `categories.role text check (...)`
- `transactions.role text check (...)`
- `transactions.transfer_group_id uuid`
- `transactions.pending_external_id text`
- `transactions.original_description text`
- `transactions.modeled_outcome text check (...)`
- `plaid_accounts.accepted_balance numeric(14, 2)`
- `plaid_accounts.accepted_balance_at timestamptz`
- `plaid_accounts.accepted_transactions_cursor text`
- `plaid_accounts.reconciliation_status text check (...)`
- optional `plaid_sync_sessions` table for preview/apply/reconcile state if the
  one-button workflow needs durable recovery between browser sessions.

Backfill strategy:

- Set category roles from current `category_type`:
  - `income` -> `external_income`
  - `expense` -> `external_expense`
  - `transfer` -> `internal_transfer`
- Leave transaction role null initially so effective role can inherit from
  category.
- Copy existing Plaid original descriptions from notes only if a structured source
  is available; otherwise leave null.

Acceptance:

- Remote load/save paths include new fields but tolerate nulls.
- Existing RLS ownership remains intact.
- No existing applied migration is edited.

## Phase 3: Calculation Migration

Goal: replace sign/category-name calculations with role-aware domain helpers.

1. Replace `isCashflowAccount` with explicit account treatment helpers:
   - `isCashOnHandAccount`: checking, cash
   - `isSavingsAccount`: savings
   - `isCreditLiabilityAccount`: credit
   - `isCashflowScopedAccount`: checking, cash, savings, credit for activity
     analysis; investment excluded
2. Introduce a monthly cash summary helper in `src/domain/` that returns:
   - starting cash on hand
   - current cash on hand
   - unpaid credit card liability
   - expected remaining regular income
   - expected remaining recurring obligations
   - remaining planned variable spend
   - projected month-end cash balance
   - savings/cushion variance
3. Update dashboard metrics to consume the monthly cash summary instead of inline
   sign and category filters.
4. Update budget helpers so spending includes only effective
   `external_expense` rows under budgetable categories or descendants.
5. Update spend-by-category to roll up descendants while preserving direct parent
   activity as direct parent activity.
6. Keep recurring cashflow behavior stable, then classify recurring projections by
   role when their category has a resolved role.

Acceptance:

- Credit card purchases count once as spending.
- Credit card payments do not affect spending, income, or budget usage.
- Savings transfers change monthly cash but not spending/income.
- Investment-account activity is excluded from the monthly cash engine.

## Phase 4: Plaid Preview And Duplicate Outcomes

Goal: make every posted Plaid update receive an explicit modeled outcome before a
cursor can be committed.

1. Move duplicate detection into a domain helper that considers:
   - Plaid transaction id / external id
   - pending transaction id
   - account id
   - amount
   - date window
   - normalized original/display description
   - inferred role/category hints
2. Change preview rows from `shouldImport`/`duplicate` only to modeled outcomes:
   - `import`
   - `duplicate`
   - `credit_card_payment`
   - `internal_transfer`
   - `needs_review`
3. Keep pending rows visible only as context if needed, but exclude them from
   import, calculations, and reconciliation gates.
4. Preserve both:
   - immutable `originalDescription`
   - cleaned display `description`
5. Detect likely transfer pairs and credit card payment pairs in preview before
   import.

Acceptance:

- Cursor commit is disabled while any posted mapped row is `needs_review`.
- Exact Plaid id duplicates are not imported.
- Pending-to-posted replacements do not create duplicate spending.
- There is no default "ignore this posted mapped row" path in the Plaid sync
  workflow.

## Phase 5: Import, Pairing, And Role Persistence

Goal: write modeled activity into transaction rows in a way calculations can trust.

1. Persist transaction role and modeled outcome on import.
2. For paired internal transfers and credit card payments, write a shared
   `transfer_group_id` on both sides when both sides are available.
3. If only one side of a credit card payment exists, persist
   `credit_card_payment` and let reconciliation determine whether review is still
   needed.
4. Keep `needs_review` rows out of cursor commit until they are modeled or matched.
5. Only commit the item cursor after all posted mapped rows have modeled outcomes.

Acceptance:

- Imported card purchases remain `external_expense`.
- Imported card payments are `credit_card_payment`.
- Imported checking-to-savings transfers are `internal_transfer`.
- A Plaid sync produces a balanced, explainable set of modeled account activity
  unless a rare unresolved delta is explicitly accepted during reconciliation.

## Phase 6: Account Reconciliation

Goal: compare accepted balances, imported posted activity, and Plaid balances per
account before completing sync.

1. Define a balance checkpoint model:
   - last accepted balance
   - checkpoint timestamp
   - cursor associated with the checkpoint
2. Add a pure reconciliation helper that computes:
   - transaction-implied balance
   - current normalized Plaid balance
   - unexplained delta
   - status: `current`, `needs_review`, or `unmapped`
3. Use `$10` as the initial review threshold for this private workflow. Smaller
   cent-level differences can be documented as edge cases and revisited after the
   engine is running against real syncs.
4. Refresh Plaid balances after import and before reconciliation.
5. Gate cursor/checkpoint commit until:
   - every posted update has a modeled outcome
   - every mapped account is current or user-accepted with unresolved delta
6. Defer explicit balance adjustment rows until real testing proves they are
   needed.

Acceptance:

- Reconciliation is per account, not global.
- Unmapped Plaid accounts are surfaced as `unmapped`.
- Mapped accounts with unexplained deltas cannot be marked current silently.
- Unresolved deltas should be rare; the main flow assumes straightforward account
  syncs that net out cleanly.

## Phase 7: UI Workflow Alignment

Goal: expose the engine without turning users into bookkeepers.

1. Categories view:
   - add parent category selection
   - show inherited role in a non-primary control
   - keep category as the normal transaction choice
2. Plaid view:
   - replace import checkbox semantics with outcome/review status
   - show detected duplicate, transfer, and credit card payment explanations
   - show reconciliation status per mapped account
   - make one-button sync the primary path once gates exist
3. Dashboard:
   - rename cash metrics around monthly cash balance terms
   - show cash on hand and unpaid credit liability separately
   - make the selected month visible and consistent across monthly panels
4. Budgets:
   - roll up child categories under budgetable ancestors
   - allow drill-down without double-counting direct parent activity.

Acceptance:

- The normal workflow is preview, resolve exceptions, accept sync.
- Users are not asked to choose transaction roles in normal entry/import flows.
- Budget and dashboard numbers trace back to the same domain helpers.

## Suggested Implementation Order

1. Add selected month state and thread it through month-based views.
2. Add types and pure role/category/account helpers.
3. Add focused unit-like fixtures or lightweight helper tests if a test harness is
   introduced; otherwise validate through `npm run build` and `npm run lint`.
4. Add the additive Supabase migration.
5. Thread new fields through remote load/save and local demo state.
6. Move dashboard/budget calculations to role-aware helpers.
7. Change Plaid preview to modeled outcomes.
8. Persist outcomes, roles, descriptions, and pair ids on import.
9. Add reconciliation helpers and checkpoint fields.
10. Replace cursor commit buttons with gated sync acceptance.
11. Add category tree UI and budget rollups.

## Open Questions To Resolve Before Building Gates

- Should accepted rare unresolved deltas create explicit `balance_adjustment`
  transactions now, or only checkpoint metadata?
- Is the initial `$10` reconciliation threshold good enough after testing on real
  Plaid syncs?
- Should category tree identity remain name-based in local state short term, or
  should the app move transaction/budget/category references to ids in the same
  migration?
- How much of Plaid preview state must survive browser refresh before cursor commit?
