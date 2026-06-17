insert into public.categories (user_id, name, color, category_type, budgetable, is_archived)
select
  users.id,
  'Uncategorized',
  '#737985',
  'expense',
  true,
  false
from auth.users
on conflict (user_id, name) do update
set
  color = excluded.color,
  category_type = excluded.category_type,
  budgetable = true,
  is_archived = false;

with default_categories as (
  select
    source_categories.id as source_category_id,
    target_categories.id as target_category_id
  from public.categories source_categories
  join public.categories target_categories
    on target_categories.user_id = source_categories.user_id
   and target_categories.name = 'Uncategorized'
  where source_categories.name in (
    'Expense',
    'Subscription or Service',
    'Subscriptions & Services',
    'Monthly Recurring',
    'Review',
    'Other'
  )
)
update public.transactions
set category_id = default_categories.target_category_id
from default_categories
where transactions.category_id = default_categories.source_category_id;

with default_categories as (
  select
    source_categories.id as source_category_id,
    target_categories.id as target_category_id
  from public.categories source_categories
  join public.categories target_categories
    on target_categories.user_id = source_categories.user_id
   and target_categories.name = 'Uncategorized'
  where source_categories.name in (
    'Expense',
    'Subscription or Service',
    'Subscriptions & Services',
    'Monthly Recurring',
    'Review',
    'Other'
  )
)
update public.recurring_cashflows
set category_id = default_categories.target_category_id
from default_categories
where recurring_cashflows.category_id = default_categories.source_category_id;

with default_categories as (
  select
    source_categories.id as source_category_id,
    target_categories.id as target_category_id
  from public.categories source_categories
  join public.categories target_categories
    on target_categories.user_id = source_categories.user_id
   and target_categories.name = 'Uncategorized'
  where source_categories.name in (
    'Expense',
    'Subscription or Service',
    'Subscriptions & Services',
    'Monthly Recurring',
    'Review',
    'Other'
  )
)
update public.transaction_match_rules
set category_id = default_categories.target_category_id
from default_categories
where transaction_match_rules.category_id = default_categories.source_category_id;

with default_budget_totals as (
  select
    budgets.user_id,
    budgets.month,
    target_categories.id as target_category_id,
    sum(budgets.planned) as planned
  from public.budgets
  join public.categories source_categories
    on source_categories.id = budgets.category_id
  join public.categories target_categories
    on target_categories.user_id = budgets.user_id
   and target_categories.name = 'Uncategorized'
  where source_categories.name in (
    'Expense',
    'Subscription or Service',
    'Subscriptions & Services',
    'Monthly Recurring',
    'Review',
    'Other'
  )
  group by budgets.user_id, budgets.month, target_categories.id
)
insert into public.budgets (user_id, month, category_id, planned)
select user_id, month, target_category_id, planned
from default_budget_totals
on conflict (user_id, category_id, month) do update
set planned = public.budgets.planned + excluded.planned;

delete from public.budgets
using public.categories
where budgets.category_id = categories.id
  and categories.name in (
    'Expense',
    'Subscription or Service',
    'Subscriptions & Services',
    'Monthly Recurring',
    'Transfers',
    'Review',
    'Other'
  );

update public.categories
set is_archived = true
where name in (
  'Expense',
  'Subscription or Service',
  'Subscriptions & Services',
  'Monthly Recurring',
  'Transfers',
  'Review',
  'Other'
);
