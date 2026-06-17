insert into public.categories (user_id, name, color, category_type, budgetable, is_archived)
select
  users.id,
  category.name,
  category.color,
  category.category_type,
  category.budgetable,
  false
from auth.users
cross join (
  values
    ('Income', '#187b63', 'income', false),
    ('Expense', '#c47a23', 'expense', true),
    ('Subscriptions & Services', '#7b5ea7', 'expense', true),
    ('Monthly Recurring', '#2f6f9f', 'expense', true),
    ('Transfers', '#737985', 'transfer', false),
    ('Review', '#b87925', 'expense', true),
    ('Other', '#737985', 'expense', true)
) as category(name, color, category_type, budgetable)
on conflict (user_id, name) do update
set
  color = excluded.color,
  category_type = excluded.category_type,
  budgetable = excluded.budgetable,
  is_archived = false;

with mapped_transactions as (
  select
    transactions.id as transaction_id,
    target_categories.id as target_category_id
  from public.transactions
  join public.categories source_categories
    on source_categories.id = transactions.category_id
  join public.categories target_categories
    on target_categories.user_id = transactions.user_id
   and target_categories.name = case
    when source_categories.name in ('Income') then 'Income'
    when source_categories.name in ('Transfer', 'Transfers') then 'Transfers'
    when source_categories.name in ('Subscriptions', 'Subscription', 'Subscriptions & Services') then 'Subscriptions & Services'
    when source_categories.name in ('Housing') then 'Monthly Recurring'
    when source_categories.name in ('Needs Review', 'Review', 'Uncategorized') then 'Review'
    when source_categories.name in ('Other') then 'Other'
    else 'Expense'
  end
  where source_categories.name not in (
    'Income',
    'Expense',
    'Subscriptions & Services',
    'Monthly Recurring',
    'Transfers',
    'Review',
    'Other'
  )
)
update public.transactions
set category_id = mapped_transactions.target_category_id
from mapped_transactions
where transactions.id = mapped_transactions.transaction_id;

with mapped_budgets as (
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
   and target_categories.name = case
    when source_categories.name in ('Subscriptions', 'Subscription', 'Subscriptions & Services') then 'Subscriptions & Services'
    when source_categories.name in ('Housing') then 'Monthly Recurring'
    when source_categories.name in ('Needs Review', 'Review', 'Uncategorized') then 'Review'
    when source_categories.name in ('Other') then 'Other'
    when source_categories.name in ('Income', 'Transfer', 'Transfers') then null
    else 'Expense'
  end
  where source_categories.name not in (
    'Expense',
    'Subscriptions & Services',
    'Monthly Recurring',
    'Review',
    'Other'
  )
  group by budgets.user_id, budgets.month, target_categories.id
)
insert into public.budgets (user_id, month, category_id, planned)
select user_id, month, target_category_id, planned
from mapped_budgets
where target_category_id is not null
on conflict (user_id, category_id, month) do update
set planned = public.budgets.planned + excluded.planned;

delete from public.budgets
using public.categories
where budgets.category_id = categories.id
  and categories.name not in (
    'Expense',
    'Subscriptions & Services',
    'Monthly Recurring',
    'Review',
    'Other'
  );

update public.categories
set is_archived = true
where name not in (
  'Income',
  'Expense',
  'Subscriptions & Services',
  'Monthly Recurring',
  'Transfers',
  'Review',
  'Other'
);

insert into public.tags (user_id, name, color, is_archived)
select
  users.id,
  tag.name,
  tag.color,
  false
from auth.users
cross join (
  values
    ('Annual', '#3f7c8c'),
    ('Variable', '#b87925'),
    ('One-Time', '#737985'),
    ('Streaming', '#8b6bb1'),
    ('Software', '#365f8c'),
    ('Cloud', '#5d7896'),
    ('Phone', '#4f6f52'),
    ('Internet', '#4f6f52'),
    ('Gym', '#187b63'),
    ('Delivery', '#c47a23'),
    ('Rent', '#2f6f9f'),
    ('Mortgage', '#2f6f9f'),
    ('Electric', '#b87925'),
    ('Gas', '#b87925'),
    ('Water', '#3f7c8c'),
    ('Groceries', '#c47a23'),
    ('Restaurants', '#c47a23'),
    ('Payroll', '#187b63'),
    ('Debt Payment', '#8b5c52'),
    ('Card Payment', '#737985'),
    ('Reimbursement', '#14795d'),
    ('Tax Deductible', '#365f8c'),
    ('Shared Expense', '#7b5ea7'),
    ('Needs Match', '#c47a23'),
    ('Possible Duplicate', '#b87925'),
    ('Cancel Candidate', '#b64a4a'),
    ('Price Changed', '#b87925')
) as tag(name, color)
on conflict (user_id, name) do update
set
  color = excluded.color,
  is_archived = false;

update public.tags
set is_archived = true
where name in (
  'Monthly Recurring',
  'Subscription',
  'Subscription Service',
  'Fixed Expense',
  'Needs Review',
  'Exclude From Budget'
);
