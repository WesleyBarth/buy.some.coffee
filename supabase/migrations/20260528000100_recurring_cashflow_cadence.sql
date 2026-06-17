alter table public.recurring_cashflows
  add column if not exists frequency text not null default 'monthly'
    check (frequency in ('monthly', 'quarterly', 'semi_annual', 'annual')),
  add column if not exists next_due_date date;

update public.recurring_cashflows
set next_due_date = make_date(
  extract(year from current_date)::integer,
  extract(month from current_date)::integer,
  least(day, extract(day from date_trunc('month', current_date) + interval '1 month - 1 day')::integer)
)
where next_due_date is null;
