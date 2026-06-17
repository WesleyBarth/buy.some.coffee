alter table public.plaid_items
  add column if not exists transactions_cursor text,
  add column if not exists last_transaction_sync_at timestamptz;
