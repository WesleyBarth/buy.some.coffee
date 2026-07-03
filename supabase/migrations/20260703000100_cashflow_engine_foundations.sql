alter table public.categories
  add column if not exists parent_id uuid references public.categories(id) on delete set null,
  add column if not exists role text check (
    role in (
      'external_expense',
      'external_income',
      'internal_transfer',
      'credit_card_payment',
      'balance_adjustment',
      'investment_movement',
      'ignore'
    )
  );

update public.categories
set role = case category_type
  when 'income' then 'external_income'
  when 'transfer' then 'internal_transfer'
  when 'expense' then 'external_expense'
  else role
end
where role is null;

alter table public.transactions
  add column if not exists role text check (
    role in (
      'external_expense',
      'external_income',
      'internal_transfer',
      'credit_card_payment',
      'balance_adjustment',
      'investment_movement',
      'ignore'
    )
  ),
  add column if not exists transfer_group_id uuid,
  add column if not exists pending_external_id text,
  add column if not exists original_description text,
  add column if not exists modeled_outcome text check (
    modeled_outcome in (
      'import',
      'duplicate',
      'credit_card_payment',
      'internal_transfer',
      'needs_review'
    )
  );

alter table public.plaid_accounts
  add column if not exists accepted_balance numeric(14, 2),
  add column if not exists accepted_balance_at timestamptz,
  add column if not exists accepted_transactions_cursor text,
  add column if not exists reconciliation_status text check (
    reconciliation_status in ('current', 'needs_review', 'unmapped')
  );

create index if not exists categories_parent_idx
  on public.categories (parent_id);

create index if not exists transactions_user_role_idx
  on public.transactions (user_id, role);

create index if not exists transactions_user_transfer_group_idx
  on public.transactions (user_id, transfer_group_id)
  where transfer_group_id is not null;

create index if not exists transactions_user_pending_external_idx
  on public.transactions (user_id, pending_external_id)
  where pending_external_id is not null;

create index if not exists plaid_accounts_reconciliation_status_idx
  on public.plaid_accounts (user_id, reconciliation_status);
