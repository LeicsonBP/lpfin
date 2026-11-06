-- LPFIN — Migration 0006
-- Contas fixas passam a poder ter parcelas (financiamentos, empréstimos etc.).
-- O tipo fica no "molde" (fixed_bills) e o número da parcela no lançamento mensal
-- (fixed_bills_entries), igual ao padrão de débitos em folha.

alter table public.fixed_bills
  add column if not exists kind text not null default 'fixed'
    check (kind in ('fixed', 'installment')),
  add column if not exists installments_count smallint
    check (installments_count is null or installments_count between 1 and 480);

alter table public.fixed_bills_entries
  add column if not exists installment_number smallint,
  add column if not exists installment_total smallint;

create index if not exists fixed_bills_kind_idx on public.fixed_bills (kind);
