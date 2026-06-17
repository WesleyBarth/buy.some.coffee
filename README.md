# Buy Some Coffee

A small personal finance app for manual transaction entry, CSV imports, monthly budgets, and net worth tracking.

## Stack

- Vite, React, TypeScript
- Supabase client-ready frontend
- Supabase Postgres schema and RLS migration
- PapaParse for CSV import
- Recharts for dashboard charts
- Lucide React icons

## Local Development

```bash
npm install
npm run dev
```

The app runs in local demo mode until Supabase environment variables are added.

```bash
cp .env.example .env.local
```

Then set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Supabase

The initial database migration lives at:

```text
supabase/migrations/20260527000000_initial_finance_schema.sql
```

Apply later migrations too:

```text
supabase/migrations/20260527000100_account_management.sql
```

It creates:

- accounts
- categories
- imports
- transactions
- budgets
- recurring cashflows
- transaction match rules
- net worth snapshots

Every table includes `user_id` and row level security policies so authenticated users only manage their own rows.

For a manual clean slate, run:

```text
supabase/scripts/reset_current_user_finance_data.sql
```

This deletes only rows owned by the authenticated Supabase user and keeps the auth account.

## CSV Import Format

The importer supports common column names:

- date: `date`, `transaction date`, `posted date`, `post date`
- description: `description`, `name`, `merchant`, `memo`, `payee`
- amount: `amount`, `transaction amount`
- split amounts: `debit`, `withdrawal`, `outflow`, `credit`, `deposit`, `inflow`

Negative amounts are expenses. Positive amounts are income.
