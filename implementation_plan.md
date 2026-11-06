# Implementation Plan

## [Overview]

Construir o **LPFIN**, uma aplicação web responsiva (Next.js 16 App Router + React 19 + TypeScript estrito + Tailwind CSS 4 + Supabase + Recharts) para controle financeiro pessoal, substituindo a planilha do Google Sheets, com visão mensal, motor de parcelamento e projeção de cenários futuros.

Escopo confirmado pelo briefing (`docs/briefing-lpfin.pdf`, 3 páginas):

1. **Contexto** — substituir uma planilha complexa; o diferencial é a **projeção de cenários futuros** baseada em parcelamentos e contas recorrentes.
2. **Stack** — Next.js (App Router), React, TypeScript, Tailwind CSS; Supabase (PostgreSQL) para banco + autenticação; Recharts; Vercel; Git/GitHub (repositório já configurado, remote `lpfin`).
3. **Ambiente** — `.env.local` com `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (uso restrito ao backend) e `SUPABASE_JWKS_URL`; `.env.local` obrigatoriamente no `.gitignore`.
4. **Arquitetura de dados** — hierarquia `Usuário -> Linha do Tempo (Ano/Mês) -> Categorias -> Lançamentos`. O "Mês" **não é tabela-mãe**: é a chave `reference_year/reference_month` que une os dados no painel.
5. **Telas** — Visão Mensal (cartões, contas fixas com valor real editável, débitos em folha, ganhos, balanço) e Dashboard com projeção.
6. **Instruções ao agente** — passo a passo, commit/push ao fim de cada etapa (nunca `git init`/`git remote add`), TypeScript estrito, lógica financeira isolada em `/lib/finance.ts`, mobile-first.

Estado verificado do ambiente: repositório em `main` **sem commits**, remote `lpfin` → `https://github.com/LeicsonBP/lpfin.git`; **Node.js 26.13.0** em `C:\Program Files\nodejs` (PATH de máquina OK, PATH da sessão desatualizado → prefixar `$env:PATH` nos comandos), **npm 9.2.0**, Git 2.56 com Credential Manager, `curl`/`winget`/`choco` disponíveis, **sem `psql`/Docker/Supabase CLI** (migrations aplicadas via Supabase Management API com PAT).

**Fora de escopo (v1):** tabelas "Dívidas" e "Informações/A receber" da planilha de referência (não constam nos requisitos 4.1/5 do briefing) — backlog; Open Finance; compartilhamento multiusuário.

## [Types]

### 1. Schema PostgreSQL (`supabase/migrations/*.sql`)

Todas as tabelas em `public`, PK `uuid default gen_random_uuid()`, `user_id uuid not null references auth.users(id) on delete cascade`, `created_at timestamptz default now()`, `updated_at timestamptz default now()` com trigger `set_updated_at()`.

| Tabela | Colunas específicas |
|---|---|
| `cards` | `name text not null`, `credit_limit numeric(12,2) default 0`, `closing_day smallint check (1..31)` (fechamento / "melhor dia de compras"), `due_day smallint check (1..31)`, `color text default '#0f766e'`, `is_active boolean default true` |
| `fixed_bills` | `name text not null`, `due_day smallint check (1..31)`, `base_value numeric(12,2) default 0`, `category text`, `is_active boolean default true` (apenas o "molde") |
| `fixed_bills_entries` | `fixed_bill_id → fixed_bills on delete cascade`, `reference_year smallint`, `reference_month smallint check (1..12)`, `amount numeric(12,2) not null`, `is_paid boolean default false`, `paid_at timestamptz`, `notes text`, **`unique (fixed_bill_id, reference_year, reference_month)`** |
| `incomes` | `description text not null`, `amount numeric(12,2) not null`, `reference_year`, `reference_month`, `kind text default 'salary'` (`salary`/`extra`/`other`), `is_received boolean default false`, `received_at timestamptz` |
| `transactions` | `card_id uuid references cards(id) on delete set null`, `description text not null`, `category text default 'outros'`, `total_amount numeric(12,2) check (>=0)`, `installments_count smallint default 1 check (>=1)`, `purchase_date date default current_date`, `start_year smallint`, `start_month smallint`, `is_subscription boolean default false`, `notes text` |
| `installments` | `transaction_id → transactions on delete cascade`, `card_id` (desnormalizado), `installment_number smallint`, `installment_total smallint`, `reference_year`, `reference_month`, `amount numeric(12,2) not null`, `is_paid boolean default false`, `paid_at timestamptz`, `is_adjusted boolean default false`, **`unique (transaction_id, installment_number)`** |
| `payroll_deductions` | `name text not null`, `amount numeric(12,2) not null`, `kind text default 'fixed'` (`fixed`/`installment`), `installment_number smallint`, `installment_total smallint`, `reference_year`, `reference_month`, `is_paid boolean default false`, `paid_at timestamptz` |

Índices: `(user_id)` em todas; `(user_id, reference_year, reference_month)` em `fixed_bills_entries`, `incomes`, `installments`, `payroll_deductions`.

RLS habilitado em todas as tabelas, com 4 policies por tabela (`select/insert/update/delete`) usando `auth.uid() = user_id`; em `fixed_bills_entries` e `installments` também validar posse do registro pai (`exists`).

### 2. Tipos TypeScript (`src/lib/types.ts`)

`Card`, `FixedBill`, `FixedBillEntry`, `Income`, `Transaction`, `Installment`, `PayrollDeduction`, `MonthRef` (`{ year: number; month: number }`, month 1..12), `ActionResult<T>`, `MonthlySummary`, `CardTotal`, `ForecastMonth`, `HistoryPoint` — espelhando exatamente as colunas SQL (números como `number`, datas como `string` ISO).

### 3. Schemas de validação (`src/lib/schemas.ts`, zod 4)

`cardSchema`, `fixedBillSchema`, `fixedBillEntrySchema`, `incomeSchema`, `payrollDeductionSchema`, `transactionSchema` (com `installments_count >= 1`, `category` default `'outros'`), `monthRefSchema`. Tipos inferidos com `z.infer<>` para os formulários.

## [Files]

### Raiz
| Arquivo | Propósito |
|---|---|
| `package.json` | Scripts `dev`, `build`, `start`, `lint` (`eslint .` — `next lint` foi removido no Next 16), `typecheck`, `test`, `test:watch` |
| `tsconfig.json` | `strict`, `noUncheckedIndexedAccess`, paths `@/*` → `./src/*` |
| `next.config.ts` | Config padrão (Turbopack é o bundler padrão no Next 16) |
| `postcss.config.mjs` | Plugin `@tailwindcss/postcss` |
| `eslint.config.mjs` | Flat config com `eslint-config-next` |
| `vitest.config.ts` | `environment: 'node'`, `include: ['src/**/*.test.ts']` |
| `.gitignore` | `node_modules`, `.next`, `.env*.local`, `.vercel`, `coverage`, `*.log` |
| `.env.local` | 4 variáveis do briefing (**nunca commitado**; `SUPABASE_SECRET_KEY` = placeholder até o usuário enviar) |
| `.env.example` | Mesmas chaves com valores fictícios |
| `README.md` | Setup Supabase (migrations via Management API/SQL Editor), Google OAuth, envs, Vercel, comandos |
| `docs/briefing-lpfin.pdf` | Briefing original versionado (movido da raiz) |
| `implementation_plan.md` | Este documento |

### Banco (`supabase/migrations/`)
- `20250101000000_init_schema.sql` — `pgcrypto`, 7 tabelas, índices, `set_updated_at()` + triggers.
- `20250101000100_rls_policies.sql` — RLS habilitado + 4 policies por tabela.
- `20250101000200_views.sql` — view `v_month_totals` (`security_invoker = true`) agregando por `user_id/reference_year/reference_month` (sanity-check dos cálculos em TS).

### Aplicação (`src/`)
| Arquivo | Propósito |
|---|---|
| `src/proxy.ts` | **Convenção Next 16** (substitui `middleware.ts`, deprecado): `export async function proxy(request)`, chama `updateSession` do `@supabase/ssr` e redireciona não autenticados para `/login`; `config.matcher` excluindo `_next/static`, `_next/image`, `favicon.ico` e assets |
| `src/app/globals.css` | Tailwind 4 (`@import "tailwindcss"`) + tokens (`@theme`) + `tabular-nums` |
| `src/app/layout.tsx` | `<html lang="pt-BR">`, metadata, fonte Inter (`next/font`) |
| `src/app/page.tsx` | `redirect('/mes')` |
| `src/app/(auth)/login/page.tsx` | Botão **Login com Google** + form e-mail/senha (login e cadastro) |
| `src/app/auth/callback/route.ts` | `exchangeCodeForSession(code)` → `redirect('/mes')` |
| `src/app/(app)/layout.tsx` | AppShell com sidebar (desktop) / bottom-nav (mobile) |
| `src/app/(app)/mes/page.tsx` | **Visão Mensal** (`searchParams`: `ano`, `mes`; default mês atual) |
| `src/app/(app)/dashboard/page.tsx` | Gráfico 1 (histórico 6 meses) e Gráfico 2 (previsão 6–12 meses) |
| `src/app/(app)/compras/page.tsx` | `transactions`: listagem + nova compra (gera parcelas) + edição/exclusão |
| `src/app/(app)/cartoes/page.tsx` | CRUD de cartões |
| `src/app/(app)/contas-fixas/page.tsx` | CRUD de contas fixas (molde) |
| `src/app/(app)/ganhos/page.tsx` | CRUD de receitas por mês/ano |
| `src/app/(app)/debitos/page.tsx` | CRUD de débitos em folha |
| `src/components/layout/*` | `AppShell`, `SideNav`, `MobileNav`, `TopBar`, `MonthSelector` (client) |
| `src/components/ui/*` | `Button`, `Card`, `Input`, `MoneyInput`, `Select`, `Badge`, `Modal`, `EmptyState`, `StatTile`, `SubmitButton` |
| `src/components/monthly/*` | `CardsSection`, `CardBlock`, `InstallmentRow`, `FixedBillsSection`, `FixedBillRow`, `PayrollSection`, `IncomeSection`, `BalanceCard` |
| `src/components/forms/*` | `CardForm`, `FixedBillForm`, `IncomeForm`, `PayrollForm`, `TransactionForm`, `InstallmentEditForm` |
| `src/components/charts/*` | `HistoryChart`, `ForecastChart` (`'use client'` + Recharts) |
| `src/lib/finance.ts` | Motor financeiro puro (parcelas, resumo mensal, projeção) |
| `src/lib/money.ts` | `toCents`, `fromCents`, `roundMoney` |
| `src/lib/format.ts` | `formatBRL`, `formatDateBR`, `formatMonthLabel` (`Intl` pt-BR) |
| `src/lib/finance.test.ts` | Testes unitários (vitest) |
| `src/lib/supabase/{client,server,proxy}.ts` | Clientes browser/server e `updateSession` |
| `src/lib/data/*.ts` | Queries `server-only` por entidade + `getMonthData` / `getRangeData` |
| `src/lib/actions/*.ts` | Server Actions (`'use server'`) por entidade |

### Configurações externas (manuais, documentadas no README)
1. Supabase → **Authentication > Providers > Google** (Client ID/Secret) e redirect `https://hyubceacbustqjhmlovb.supabase.co/auth/v1/callback`.
2. Supabase → **URL Configuration**: Site URL `http://localhost:3000`; Redirect URLs `http://localhost:3000/auth/callback` + domínio de produção.
3. Vercel → as 4 variáveis de ambiente.
