create extension if not exists pgcrypto;

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  account_type text not null check (
    account_type in ('checking', 'savings', 'credit', 'investment', 'loan', 'cash')
  ),
  balance numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#2f6f9f',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  file_name text,
  row_count integer not null default 0,
  imported_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  import_id uuid references public.imports(id) on delete set null,
  transaction_date date not null,
  description text not null,
  amount numeric(14, 2) not null,
  source text not null default 'manual' check (source in ('manual', 'csv', 'bank_api')),
  external_id text,
  dedupe_key text not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  month date not null,
  planned numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, category_id, month)
);

create table public.net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date date not null,
  assets numeric(14, 2) not null default 0,
  liabilities numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, snapshot_date)
);

alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.imports enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.net_worth_snapshots enable row level security;

create policy "Users manage own accounts"
  on public.accounts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own categories"
  on public.categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own imports"
  on public.imports for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own transactions"
  on public.transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own budgets"
  on public.budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own net worth snapshots"
  on public.net_worth_snapshots for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index transactions_user_date_idx on public.transactions (user_id, transaction_date desc);
create index transactions_user_category_idx on public.transactions (user_id, category_id);
create index budgets_user_month_idx on public.budgets (user_id, month);
create index net_worth_snapshots_user_date_idx
  on public.net_worth_snapshots (user_id, snapshot_date desc);
