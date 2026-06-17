create table public.plaid_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plaid_item_id text not null,
  institution_id text,
  institution_name text,
  available_products text[] not null default '{}',
  billed_products text[] not null default '{}',
  consent_expiration_time timestamptz,
  update_type text,
  status text not null default 'active' check (status in ('active', 'error', 'disconnected')),
  error_code text,
  error_message text,
  last_successful_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plaid_item_id)
);

create table public.plaid_item_secrets (
  plaid_item_id uuid primary key references public.plaid_items(id) on delete cascade,
  access_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plaid_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plaid_item_id uuid not null references public.plaid_items(id) on delete cascade,
  linked_account_id uuid references public.accounts(id) on delete set null,
  plaid_account_id text not null,
  name text not null,
  official_name text,
  account_type text not null,
  account_subtype text,
  mask text,
  iso_currency_code text,
  available_balance numeric(14, 2),
  current_balance numeric(14, 2),
  limit_amount numeric(14, 2),
  last_balance_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plaid_account_id)
);

alter table public.plaid_items enable row level security;
alter table public.plaid_item_secrets enable row level security;
alter table public.plaid_accounts enable row level security;

create policy "Users read own Plaid items"
  on public.plaid_items for select
  using (auth.uid() = user_id);

create policy "Users delete own Plaid items"
  on public.plaid_items for delete
  using (auth.uid() = user_id);

create policy "Users read own Plaid accounts"
  on public.plaid_accounts for select
  using (auth.uid() = user_id);

create policy "Users map own Plaid accounts"
  on public.plaid_accounts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index plaid_items_user_status_idx
  on public.plaid_items (user_id, status);

create index plaid_accounts_user_item_idx
  on public.plaid_accounts (user_id, plaid_item_id);

create index plaid_accounts_linked_account_idx
  on public.plaid_accounts (linked_account_id);
