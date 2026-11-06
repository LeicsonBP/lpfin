-- LPFIN — Migration 0003: views de conferência
-- Usadas como sanity-check dos cálculos feitos em TypeScript (lib/finance.ts).
-- security_invoker garante que o RLS das tabelas base seja respeitado.

create or replace view public.v_month_totals
with (security_invoker = true) as
with months as (
  select user_id, reference_year, reference_month from public.installments
  union
  select user_id, reference_year, reference_month from public.fixed_bills_entries
  union
  select user_id, reference_year, reference_month from public.incomes
  union
  select user_id, reference_year, reference_month from public.payroll_deductions
)
select
  m.user_id,
  m.reference_year,
  m.reference_month,
  coalesce((
    select sum(i.amount) from public.installments i
    where i.user_id = m.user_id
      and i.reference_year = m.reference_year
      and i.reference_month = m.reference_month
  ), 0)::numeric(12, 2) as cards_total,
  coalesce((
    select sum(f.amount) from public.fixed_bills_entries f
    where f.user_id = m.user_id
      and f.reference_year = m.reference_year
      and f.reference_month = m.reference_month
  ), 0)::numeric(12, 2) as fixed_total,
  coalesce((
    select sum(p.amount) from public.payroll_deductions p
    where p.user_id = m.user_id
      and p.reference_year = m.reference_year
      and p.reference_month = m.reference_month
  ), 0)::numeric(12, 2) as payroll_total,
  coalesce((
    select sum(ic.amount) from public.incomes ic
    where ic.user_id = m.user_id
      and ic.reference_year = m.reference_year
      and ic.reference_month = m.reference_month
  ), 0)::numeric(12, 2) as income_total
from months m;
