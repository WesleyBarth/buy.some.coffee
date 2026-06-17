insert into public.categories (user_id, name, color, category_type, budgetable, is_archived)
select
  users.id,
  category.name,
  category.color,
  'income',
  false,
  false
from auth.users
cross join (
  values
    ('Regular Income', '#187b63'),
    ('Irregular Income', '#2f8f7a')
) as category(name, color)
on conflict (user_id, name) do update
set
  color = excluded.color,
  category_type = excluded.category_type,
  budgetable = false,
  is_archived = false;

with mapped_income_categories as (
  select
    source_categories.id as source_category_id,
    target_categories.id as target_category_id
  from public.categories source_categories
  join public.categories target_categories
    on target_categories.user_id = source_categories.user_id
   and target_categories.name = 'Regular Income'
  where source_categories.name = 'Income'
)
update public.transactions
set category_id = mapped_income_categories.target_category_id
from mapped_income_categories
where transactions.category_id = mapped_income_categories.source_category_id;

with mapped_income_categories as (
  select
    source_categories.id as source_category_id,
    target_categories.id as target_category_id
  from public.categories source_categories
  join public.categories target_categories
    on target_categories.user_id = source_categories.user_id
   and target_categories.name = 'Regular Income'
  where source_categories.name = 'Income'
)
update public.recurring_cashflows
set category_id = mapped_income_categories.target_category_id
from mapped_income_categories
where recurring_cashflows.category_id = mapped_income_categories.source_category_id;

with mapped_income_categories as (
  select
    source_categories.id as source_category_id,
    target_categories.id as target_category_id
  from public.categories source_categories
  join public.categories target_categories
    on target_categories.user_id = source_categories.user_id
   and target_categories.name = 'Regular Income'
  where source_categories.name = 'Income'
)
update public.transaction_match_rules
set category_id = mapped_income_categories.target_category_id
from mapped_income_categories
where transaction_match_rules.category_id = mapped_income_categories.source_category_id;

delete from public.budgets
using public.categories
where budgets.category_id = categories.id
  and categories.name in ('Income', 'Regular Income', 'Irregular Income');

update public.categories
set budgetable = false
where name in ('Income', 'Regular Income', 'Irregular Income');

update public.categories
set is_archived = true
where name = 'Income';
