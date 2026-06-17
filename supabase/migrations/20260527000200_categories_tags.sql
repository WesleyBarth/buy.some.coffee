alter table public.categories
  add column if not exists category_type text not null default 'expense'
    check (category_type in ('income', 'expense', 'transfer')),
  add column if not exists budgetable boolean not null default true,
  add column if not exists is_archived boolean not null default false;

update public.categories
set
  category_type = case
    when lower(name) = 'income' then 'income'
    when lower(name) = 'transfer' then 'transfer'
    else category_type
  end,
  budgetable = case
    when lower(name) in ('income', 'transfer') then false
    else budgetable
  end;

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#2f6f9f',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.transaction_tags (
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (transaction_id, tag_id)
);

alter table public.tags enable row level security;
alter table public.transaction_tags enable row level security;

drop policy if exists "Users manage own tags" on public.tags;
create policy "Users manage own tags"
  on public.tags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own transaction tags" on public.transaction_tags;
create policy "Users manage own transaction tags"
  on public.transaction_tags for all
  using (
    exists (
      select 1
      from public.transactions
      where transactions.id = transaction_tags.transaction_id
        and transactions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.transactions
      where transactions.id = transaction_tags.transaction_id
        and transactions.user_id = auth.uid()
    )
  );

create index if not exists categories_user_archived_idx
  on public.categories (user_id, is_archived);

create index if not exists tags_user_archived_idx
  on public.tags (user_id, is_archived);
