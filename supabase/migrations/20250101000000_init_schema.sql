-- LPFIN — Controle Financeiro Pessoal
-- Migration 0001: schema inicial
-- Hierarquia: Usuário -> Linha do Tempo (Ano/Mês) -> Categorias -> Lançamentos
-- "Mês" NÃO é tabela-mãe: é a chave (reference_year, reference_month).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- updated_at automatico
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Cards (Cartoes de credito)
-- ---------------------------------------------------------------------------
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  credit_limit numeric(12, 2) not null default 0 check (credit_limit >= 0),
  closing_day smallint not null default 1 check (closing_day between 1 and 31),
  due_day smallint not null default 10 check (due_day between 1 and 31),
  color text not null default '#0e6855',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cards_user_idx on public.cards (user_id);

-- ---------------------------------------------------------------------------
-- Fixed_Bills (Cadastro de contas fixas — apenas o "molde")
-- ---------------------------------------------------------------------------
create table if not exists public.fixed_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  due_day smallint check (due_day between 1 and 31),
  base_value numeric(12, 2) not null default 0 check (base_value >= 0),
  category text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fixed_bills_user_idx on public.fixed_bills (user_id);

-- ---------------------------------------------------------------------------
-- Fixed_Bills_Entries (valor real de cada conta fixa em cada mes)
-- ---------------------------------------------------------------------------
create table if not exists public.fixed_bills_entries (
  id uuid primary key default gen_random_uuid(),
  fixed_bill_id uuid not null references public.fixed_bills (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reference_year smallint not null check (reference_year between 2000 and 2100),
  reference_month smallint not null check (reference_month between 1 and 12),
  amount numeric(12, 2) not null check (amount >= 0),
  is_paid boolean not null default false,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fixed_bills_entries_month_unique unique (fixed_bill_id, reference_year, reference_month)
);

-- ---------------------------------------------------------------------------
-- Incomes (Ganhos / receitas por mes)
-- ---------------------------------------------------------------------------
create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  description text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  reference_year smallint not null check (reference_year between 2000 and 2100),
  reference_month smallint not null check (reference_month between 1 and 12),
  kind text not null default 'salary' check (kind in ('salary', 'extra', 'other')),
  is_received boolean not null default false,
  received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists incomes_month_idx
  on public.incomes (user_id, reference_year, reference_month);

-- ---------------------------------------------------------------------------
-- Transactions (compras / transacoes, possivelmente parceladas)
-- ---------------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid references public.cards (id) on delete set null,
  description text not null,
  category text not null default 'outros',
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  installments_count smallint not null default 1 check (installments_count >= 1),
  purchase_date date not null default current_date,
  start_year smallint not null check (start_year between 2000 and 2100),
  start_month smallint not null check (start_month between 1 and 12),
  is_subscription boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_user_idx on public.transactions (user_id);
create index if not exists transactions_card_idx on public.transactions (card_id);

-- ---------------------------------------------------------------------------
-- Installments (parcelas geradas a partir de uma Transaction)
-- Aqui o mes/ano vive de fato.
-- ---------------------------------------------------------------------------
create table if not exists public.installments (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid references public.cards (id) on delete set null,
  installment_number smallint not null check (installment_number >= 1),
  installment_total smallint not null check (installment_total >= 1),
  reference_year smallint not null check (reference_year between 2000 and 2100),
  reference_month smallint not null check (reference_month between 1 and 12),
  amount numeric(12, 2) not null check (amount >= 0),
  is_paid boolean not null default false,
  paid_at timestamptz,
  is_adjusted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint installments_unique_number unique (transaction_id, installment_number)
);

create index if not exists installments_month_idx
  on public.installments (user_id, reference_year, reference_month);
create index if not exists installments_transaction_idx
  on public.installments (transaction_id);

-- ---------------------------------------------------------------------------
-- Payroll_Deductions (debitos em folha — fixos ou parcelados)
-- ---------------------------------------------------------------------------
create table if not exists public.payroll_deductions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  kind text not null default 'fixed' check (kind in ('fixed', 'installment')),
  installment_number smallint,
  installment_total smallint,
  reference_year smallint not null check (reference_year between 2000 and 2100),
  reference_month smallint not null check (reference_month between 1 and 12),
  is_paid boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payroll_deductions_month_idx
  on public.payroll_deductions (user_id, reference_year, reference_month);

-- ---------------------------------------------------------------------------
-- Triggers de updated_at
-- ---------------------------------------------------------------------------
drop trigger if exists cards_set_updated_at on public.cards;
create trigger cards_set_updated_at before update on public.cards
  for each row execute function public.set_updated_at();

drop trigger if exists fixed_bills_set_updated_at on public.fixed_bills;
create trigger fixed_bills_set_updated_at before update on public.fixed_bills
  for each row execute function public.set_updated_at();

drop trigger if exists fixed_bills_entries_set_updated_at on public.fixed_bills_entries;
create trigger fixed_bills_entries_set_updated_at before update on public.fixed_bills_entries
  for each row execute function public.set_updated_at();

drop trigger if exists incomes_set_updated_at on public.incomes;
create trigger incomes_set_updated_at before update on public.incomes
  for each row execute function public.set_updated_at();

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();

drop trigger if exists installments_set_updated_at on public.installments;
create trigger installments_set_updated_at before update on public.installments
  for each row execute function public.set_updated_at();

drop trigger if exists payroll_deductions_set_updated_at on public.payroll_deductions;
create trigger payroll_deductions_set_updated_at before update on public.payroll_deductions
  for each row execute function public.set_updated_at();



