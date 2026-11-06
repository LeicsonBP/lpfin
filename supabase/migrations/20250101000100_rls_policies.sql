-- LPFIN — Migration 0002: Row Level Security
-- Toda linha pertence a um usuário (auth.users). Sem exceções.

alter table public.cards enable row level security;
alter table public.fixed_bills enable row level security;
alter table public.fixed_bills_entries enable row level security;
alter table public.incomes enable row level security;
alter table public.transactions enable row level security;
alter table public.installments enable row level security;
alter table public.payroll_deductions enable row level security;

-- ---------------------------------------------------------------------------
-- cards
-- ---------------------------------------------------------------------------
drop policy if exists cards_owner_all on public.cards;
create policy cards_owner_all on public.cards
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- fixed_bills
-- ---------------------------------------------------------------------------
drop policy if exists fixed_bills_owner_all on public.fixed_bills;
create policy fixed_bills_owner_all on public.fixed_bills
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- fixed_bills_entries (dono da linha + dono da conta fixa)
-- ---------------------------------------------------------------------------
drop policy if exists fixed_bills_entries_owner_all on public.fixed_bills_entries;
create policy fixed_bills_entries_owner_all on public.fixed_bills_entries
  for all
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.fixed_bills fb
      where fb.id = fixed_bills_entries.fixed_bill_id
        and fb.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.fixed_bills fb
      where fb.id = fixed_bills_entries.fixed_bill_id
        and fb.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- incomes
-- ---------------------------------------------------------------------------
drop policy if exists incomes_owner_all on public.incomes;
create policy incomes_owner_all on public.incomes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- transactions (dono da linha + cartão, se houver, do mesmo dono)
-- ---------------------------------------------------------------------------
drop policy if exists transactions_owner_all on public.transactions;
create policy transactions_owner_all on public.transactions
  for all
  using (
    auth.uid() = user_id
    and (
      card_id is null
      or exists (
        select 1 from public.cards c
        where c.id = transactions.card_id and c.user_id = auth.uid()
      )
    )
  )
  with check (
    auth.uid() = user_id
    and (
      card_id is null
      or exists (
        select 1 from public.cards c
        where c.id = transactions.card_id and c.user_id = auth.uid()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- installments (dono da linha + dono da transação)
-- ---------------------------------------------------------------------------
drop policy if exists installments_owner_all on public.installments;
create policy installments_owner_all on public.installments
  for all
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.transactions t
      where t.id = installments.transaction_id and t.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.transactions t
      where t.id = installments.transaction_id and t.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- payroll_deductions
-- ---------------------------------------------------------------------------
drop policy if exists payroll_deductions_owner_all on public.payroll_deductions;
create policy payroll_deductions_owner_all on public.payroll_deductions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
