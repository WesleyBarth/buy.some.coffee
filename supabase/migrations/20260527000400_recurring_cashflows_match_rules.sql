create table if not exists public.recurring_cashflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  source_transaction_id uuid references public.transactions(id) on delete set null,
  kind text not null check (kind in ('subscription', 'monthly_recurring')),
  name text not null,
  amount numeric(14, 2) not null,
  day integer not null default 1 check (day between 1 and 31),
  frequency text not null default 'monthly'
    check (frequency in ('monthly', 'quarterly', 'semi_annual', 'annual')),
  next_due_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transaction_match_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recurring_cashflow_id uuid references public.recurring_cashflows(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  match_text text not null,
  normalized_match_text text not null,
  match_strategy text not null default 'contains' check (match_strategy in ('contains')),
  amount_sign text not null default 'any' check (amount_sign in ('any', 'income', 'expense')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, normalized_match_text, account_id, amount_sign)
);

alter table public.recurring_cashflows enable row level security;
alter table public.transaction_match_rules enable row level security;

drop policy if exists "Users manage own recurring cashflows" on public.recurring_cashflows;
create policy "Users manage own recurring cashflows"
  on public.recurring_cashflows for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own transaction match rules" on public.transaction_match_rules;
create policy "Users manage own transaction match rules"
  on public.transaction_match_rules for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists recurring_cashflows_user_kind_idx
  on public.recurring_cashflows (user_id, kind, is_active);

create index if not exists transaction_match_rules_user_active_idx
  on public.transaction_match_rules (user_id, is_active);

create index if not exists transaction_match_rules_normalized_idx
  on public.transaction_match_rules (user_id, normalized_match_text);
