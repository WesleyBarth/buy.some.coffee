-- Run this from the Supabase SQL editor after setting target_user_id below.
-- It deletes one user's app data, including local Plaid records, and keeps the auth user.
-- Use the app's Plaid disconnect action first if you need to revoke Plaid Item authorization.

begin;

create temp table reset_target_user (id uuid primary key) on commit drop;

-- Replace this with your auth.users.id.
insert into reset_target_user (id)
values ('00000000-0000-0000-0000-000000000000');

delete from public.plaid_items where user_id = (select id from reset_target_user);
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
