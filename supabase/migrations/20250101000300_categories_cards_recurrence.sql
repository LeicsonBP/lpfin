-- LPFIN — Migration 0004
-- 1) Categorias de compra passam a ser apenas "à vista" e "à prazo"
-- 2) Fatura mensal paga/não paga por cartão
-- 3) Ganhos recorrentes (série mensal com ajuste a partir de um mês)

-- ---------------------------------------------------------------------------
-- 1) transactions.category
-- ---------------------------------------------------------------------------
alter table public.transactions drop constraint if exists transactions_category_check;

update public.transactions
   set category = case when installments_count > 1 then 'aprazo' else 'avista' end
 where category not in ('avista', 'aprazo');

alter table public.transactions alter column category set default 'avista';

alter table public.transactions
  add constraint transactions_category_check check (category in ('avista', 'aprazo'));

-- ---------------------------------------------------------------------------
-- 2) card_payments — checkbox mensal "fatura paga?" por cartão
-- ---------------------------------------------------------------------------
create table if not exists public.card_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  reference_year smallint not null check (reference_year between 2000 and 2100),
  reference_month smallint not null check (reference_month between 1 and 12),
  is_paid boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint card_payments_unique unique (card_id, reference_year, reference_month)
);

create index if not exists card_payments_month_idx
  on public.card_payments (user_id, reference_year, reference_month);

alter table public.card_payments enable row level security;

drop policy if exists card_payments_owner_all on public.card_payments;
create policy card_payments_owner_all on public.card_payments
  for all
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.cards c
      where c.id = card_payments.card_id and c.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.cards c
      where c.id = card_payments.card_id and c.user_id = auth.uid()
    )
  );

drop trigger if exists card_payments_set_updated_at on public.card_payments;
create trigger card_payments_set_updated_at before update on public.card_payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3) Ganhos recorrentes
--    series_id agrupa as ocorrências mensais; is_recurring marca a série.
--    O ajuste de valor grava apenas do mês escolhido em diante.
-- ---------------------------------------------------------------------------
alter table public.incomes add column if not exists series_id uuid;
alter table public.incomes add column if not exists is_recurring boolean not null default false;

create index if not exists incomes_series_idx
  on public.incomes (series_id)
  where series_id is not null;

create unique index if not exists incomes_series_month_unique
  on public.incomes (series_id, reference_year, reference_month)
  where series_id is not null;
