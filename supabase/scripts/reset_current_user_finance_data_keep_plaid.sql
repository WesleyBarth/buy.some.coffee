-- Run this from the Supabase SQL editor after setting target_user_id below.
-- It deletes one user's finance data but keeps Plaid connections.
-- Plaid transaction cursors are reset so the next preview can fetch initial history again.

begin;

create temp table reset_target_user (id uuid primary key) on commit drop;

-- Replace this with your auth.users.id.
insert into reset_target_user (id)
values ('00000000-0000-0000-0000-000000000000');

update public.plaid_items
set
  transactions_cursor = null,
  last_transaction_sync_at = null,
  updated_at = now()
where user_id = (select id from reset_target_user);

update public.plaid_accounts
set
  linked_account_id = null,
  updated_at = now()
where user_id = (select id from reset_target_user);

delete from public.transactions where user_id = (select id from reset_target_user);
delete from public.transaction_match_rules where user_id = (select id from reset_target_user);
delete from public.recurring_cashflows where user_id = (select id from reset_target_user);
delete from public.tags where user_id = (select id from reset_target_user);
delete from public.imports where user_id = (select id from reset_target_user);
delete from public.budgets where user_id = (select id from reset_target_user);
delete from public.net_worth_snapshots where user_id = (select id from reset_target_user);
delete from public.accounts where user_id = (select id from reset_target_user);
delete from public.categories where user_id = (select id from reset_target_user);

commit;
