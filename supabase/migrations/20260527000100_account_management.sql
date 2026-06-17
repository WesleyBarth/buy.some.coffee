alter table public.accounts
  add column if not exists institution text,
  add column if not exists is_archived boolean not null default false;

create index if not exists accounts_user_archived_idx
  on public.accounts (user_id, is_archived);
