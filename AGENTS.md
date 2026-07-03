# AGENTS.md

## Project Overview

Buy Some Coffee is a personal finance application for manual transactions, CSV imports,
monthly budgets, recurring cashflows, Plaid syncing, and net worth tracking.

The app is built with Vite, React, TypeScript, Supabase, Plaid edge functions,
PapaParse, Recharts, Lucide icons, and `@hyperview/ui`.

## Priorities

When tradeoffs arise, prefer:

1. Correctness
2. Simplicity
3. Consistency with the existing architecture
4. Maintainability
5. Performance
6. Avoiding unnecessary abstractions

## Common Commands

* `npm run dev` starts the Vite development server.
* `npm run build` performs TypeScript checks and creates the production build.
* `npm run lint` runs ESLint.
* `npm run preview` serves the production build locally.

## Validation Before Completion

Before considering meaningful work complete:

* Run `npm run build`.
* Run `npm run lint`.

If either command fails, explain the failure rather than assuming the implementation is
correct.

## Important Paths

* `src/App.tsx` owns application state, Supabase persistence, Plaid orchestration,
  view selection, and local demo mode.
* `src/domain/` contains pure business logic, calculations, and shared types.
* `src/components/` contains UI components grouped by feature.
* `src/lib/supabase.ts` creates the Supabase client when environment variables exist.
* `supabase/migrations/` contains ordered database migrations.
* `supabase/functions/` contains Deno edge functions.
* `supabase/functions/_shared/` contains shared server utilities.
* `docs/Hyperview UI Style Guide.md` is the source of truth for using
  `@hyperview/ui`.

## Runtime Modes

The application runs in local demo mode when Supabase environment variables are
absent.

Remote mode is enabled by:

* `VITE_SUPABASE_URL`
* `VITE_SUPABASE_ANON_KEY`

Do not assume Supabase is configured during development.

Preserve the localStorage fallback unless explicitly changing the persistence
architecture.

## Agent Workflow

For non-trivial tasks:

1. Understand the request.
2. Inspect the relevant architecture before editing.
3. Prefer existing patterns over introducing new ones.
4. Make focused, minimal changes.
5. Validate the implementation.
6. Summarize the changes and any remaining risks or assumptions.

## Guidance Structure

Use this file for durable repo-wide instructions.

Use `docs/Hyperview UI Style Guide.md` for Hyperview-specific UI guidance.

Create feature-specific docs only when a workflow becomes repeated enough to justify
it. Do not scatter one-off preferences across new instruction files.

## UI Guidance

Use `@hyperview/ui` primitives for application structure, forms, tables, panels,
metrics, navigation, toasts, and loading states.

Read `docs/Hyperview UI Style Guide.md` before making significant UI changes.

Prefer dense, operational interfaces. This is a finance workflow application, not a
marketing site.

Keep screens scannable, restrained, and optimized for repeated data entry.

Import `@hyperview/ui/styles.css` once at the application boundary.

Place application-specific overrides in `src/hyperview-overrides.css`.

Before creating a custom component or pattern, ask:

* Does `@hyperview/ui` already provide this?
* Can an existing component be composed instead?
* Is the customization broadly reusable?

## Data And Domain Rules

* Negative transaction amounts are expenses.
* Positive transaction amounts are income.
* Credit and loan balances should be normalized as liabilities.
* Investment accounts are not cashflow accounts.
* Shared finance types belong in `src/domain/types.ts`.
* Prefer pure domain helpers inside `src/domain/` instead of embedding calculations
  inside React components.

## Supabase Guidance

Database migrations are append-only.

Create a new timestamped migration instead of modifying an existing applied migration
unless explicitly instructed otherwise.

Every user-owned table should include:

* `user_id`
* Row Level Security policies

Edge functions belong under `supabase/functions/` and should reuse shared helpers from
`supabase/functions/_shared/`.

## Plaid Guidance

Plaid secrets and access tokens must never reach the frontend.

Frontend Plaid operations should occur through Supabase edge functions such as:

* Link token creation
* Public token exchange
* Balance refresh
* Transaction preview
* Cursor synchronization
* Account disconnect

## Code Style

* Follow existing React and TypeScript patterns.
* Prefer typed domain helpers over inline business logic.
* Keep changes scoped to the requested feature.
* Reuse existing abstractions before introducing new ones.
* Use Lucide icons when icons are needed.
* Avoid new dependencies unless they provide substantial long-term value.

Before introducing a new abstraction, ask:

* Can existing code already solve this?
* Can configuration solve this instead?
* Does this reduce complexity overall?

## Error Handling

Fail loudly during development and validation.

Prefer actionable error messages over silent failures.

Do not swallow exceptions without a clear reason.

For user-facing app behavior, prefer visible inline errors, alerts, or toasts over
crashes.

Preserve useful logging while avoiding unnecessary console noise.

## Avoid

Unless explicitly requested, avoid:

* Broad refactors
* Formatting-only changes
* Renaming unrelated files or symbols
* Editing unrelated migrations
* Reorganizing directory structure
* Adding dependencies for small problems
* Rewriting working code solely for stylistic reasons

## Current Testing Reality

There is currently no dedicated automated test suite.

`npm run build` and `npm run lint` are the baseline validation steps for meaningful
code changes.
