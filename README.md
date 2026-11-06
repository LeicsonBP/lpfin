# LPFIN — Controle Financeiro Pessoal

Aplicação web responsiva (mobile-first) para controle financeiro pessoal, construída para
substituir uma planilha de Google Sheets. O diferencial é a **projeção de cenários futuros**
baseada em parcelamentos e contas recorrentes.

> Briefing original: [`docs/briefing-lpfin.pdf`](docs/briefing-lpfin.pdf) ·
> Plano de implementação: [`implementation_plan.md`](implementation_plan.md)

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript estrito |
| Estilo | Tailwind CSS 4 |
| Banco de dados | Supabase (PostgreSQL) com Row Level Security |
| Autenticação | Supabase Auth (Google OAuth + e-mail/senha) |
| Gráficos | Recharts 3 |
| Testes | Vitest (motor financeiro) |
| Deploy | Vercel |

## Requisitos

- Node.js 20.9+ (testado com Node 26)
- npm 10+ (recomendado)
- Projeto Supabase com o schema aplicado (veja abaixo)

## Configuração de ambiente

Crie o `.env.local` na raiz (nunca commite este arquivo):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...      # uso restrito ao backend
SUPABASE_JWKS_URL=https://<seu-projeto>.supabase.co/auth/v1/.well-known/jwks.json
```

O `.gitignore` já exclui `.env.local`, `.env*.local` e `.env`.

## Banco de dados

As migrations ficam em [`supabase/migrations`](supabase/migrations):

1. `20250101000000_init_schema.sql` — 7 tabelas (`cards`, `fixed_bills`,
   `fixed_bills_entries`, `incomes`, `transactions`, `installments`, `payroll_deductions`),
   índices e triggers de `updated_at`.
2. `20250101000100_rls_policies.sql` — RLS habilitado em todas as tabelas, com policies
   `auth.uid() = user_id` (e validação do registro pai em entries/installments).
3. `20250101000200_views.sql` — view `v_month_totals` para conferência dos totais por mês.

**Opção A — SQL Editor (manual):** abra o SQL Editor do Supabase e cole o conteúdo dos três
arquivos, na ordem.

**Opção B — Management API (sem instalar nada):**

```powershell
$env:SUPABASE_ACCESS_TOKEN = 'sbp_...'   # Account → Access Tokens
npm run db:migrate                       # aplica todas as migrations em ordem
```

O script está em [`scripts/apply-migrations.mjs`](scripts/apply-migrations.mjs), deriva o
`project-ref` do `.env.local` (ou use `$env:SUPABASE_PROJECT_REF`) e ao final imprime as
tabelas e a quantidade de policies RLS criadas.

**Opção C — Supabase CLI:** `npx supabase login`, `npx supabase link --project-ref <ref>` e
`npx supabase db push`.

## Autenticação (Google)

1. **Google Cloud Console** → *APIs & Services → Credentials* → crie um **OAuth client ID**
   (tipo *Web application*).
2. Em *Authorized redirect URIs* adicione
   `https://<seu-projeto>.supabase.co/auth/v1/callback`.
3. **Supabase** → *Authentication → Providers → Google*: habilite e cole Client ID/Secret.
4. **Supabase** → *Authentication → URL Configuration*:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback` e o domínio de produção.

Sem essas configurações o botão **Entrar com Google** falha, mas o login por e-mail/senha
continua funcionando.

## Scripts

```bash
npm run dev        # http://localhost:3000
npm run build      # build de produção (Turbopack)
npm run start      # serve o build
npm run lint       # ESLint (flat config)
npm run typecheck  # tsc --noEmit
npm test           # Vitest (motor financeiro)
```

## Estrutura

```
src/
├─ proxy.ts                     # antigo middleware (Next 16): sessão + rotas privadas
├─ app/
│  ├─ (auth)/login              # login Google + e-mail/senha
│  ├─ auth/callback             # troca do code do OAuth pela sessão
│  ├─ (app)/layout.tsx          # shell autenticado (sidebar/bottom-nav)
│  ├─ (app)/mes                 # VISÃO MENSAL
│  ├─ (app)/dashboard           # histórico + previsão
│  ├─ (app)/compras             # transactions + parcelas
│  ├─ (app)/cartoes             # CRUD de cartões
│  ├─ (app)/contas-fixas        # CRUD do "molde" das contas fixas
│  ├─ (app)/ganhos              # receitas do mês
│  └─ (app)/debitos             # débitos em folha (fixos/parcelados)
├─ components/                  # ui, layout, monthly, forms, charts
└─ lib/
   ├─ finance.ts                # MOTOR FINANCEIRO (puro, testado)
   ├─ money.ts                  # aritmética em centavos
   ├─ format.ts                 # BRL, mês/ano, opções de select
   ├─ schemas.ts                # validação zod dos formulários
   ├─ data/                     # queries server-side por entidade
   ├─ actions/                  # Server Actions (CRUD + auth)
   └─ supabase/                 # clients browser/server + updateSession
```

## Regras de negócio implementadas

- **O "mês" não é tabela**: é a chave `reference_year` + `reference_month`. A visão mensal
  consulta `installments`, `fixed_bills_entries`, `incomes` e `payroll_deductions` por essa
  competência (sempre filtrada por RLS/`user_id`).
- **Motor de parcelamento** (`lib/finance.ts`): `buildInstallmentPlan` divide o total em centavos
  (a sobra vai para as primeiras parcelas — `100,00 / 3 = 33,34 + 33,33 + 33,33`) e cria uma
  linha em `installments` por mês.
- **Ajuste individual de parcela**: editar o valor de uma parcela grava `is_adjusted = true`
  sem afetar as demais nem o total da compra.
- **Contas fixas em duas camadas**: `fixed_bills` é o molde (nome, vencimento, valor base) e
  `fixed_bills_entries` guarda o valor real de cada mês (upsert por competência).
- **Balanço do mês**: `Ganhos − (Cartões + Contas Fixas + Folha)`, verde se positivo e vermelho
  se negativo.
- **Projeção futura** (`forecastNextMonths`): contas fixas pela média histórica real
  (fallback no valor base), parcelas pela soma exata já agendada e compras **à vista** pela média
  histórica (descontando o que já está agendado no mês).

### Ajustes da segunda rodada (v2)

- **Tema claro/escuro** com persistência em `localStorage` e paleta escura de maior contraste
  (`ThemeToggle`, tokens em `globals.css` via `@theme inline` + custom variant `dark`).
- **Identidade visual**: monograma **LP** (`src/components/brand/logo.tsx`) usado no login,
  na sidebar e no favicon (`src/app/icon.svg`).
- **Seletor de competência** (`MonthPicker`): setas + popover com grade de meses e navegação por ano.
- **Compras em lote**: um cartão por lote, várias compras, informando **valor da parcela ×
  quantidade** (o total é calculado). A data da compra não é mais solicitada.
- **Categorias de compra**: apenas **à vista** e **à prazo** (constraint `transactions_category_check`).
- **Cartões**: seletor de cor em grade (paleta + hexadecimal), **limite restante** calculado com
  fatura do mês + parcelas atrasadas + futuras (`summarizeCardLimit`) e **checkbox mensal de fatura
  paga** (`card_payments`).
- **Contas fixas**: checkbox de pago por mês mesmo sem lançamento (upsert automático do valor real).
- **Débitos em folha**: sem checkbox — são recorrentes/automáticos (badge "automático").
- **Ganhos recorrentes**: geração automática de até 36 meses com `series_id` e ajuste de valor
  a partir de um mês (preserva o histórico anterior).

### Ajustes da terceira rodada (v3)

- **Logotipo** refeito do zero: monograma geométrico **LP** (traço contínuo com pontas
  arredondadas) em `src/components/brand/logo.tsx` e no favicon `src/app/icon.svg`.
- **Tema** virou **caixa de seleção** (Sistema / Claro / Escuro) — grava cookie e o servidor já
  entrega o HTML no tema correto (sem flash).
- **Cor do cartão** agora fica dentro de um **card flutuante** aberto por botão: paleta, campo
  hexadecimal e “Usar esta cor”.
- **Contas fixas** não possuem categoria; o campo de referência passou a se chamar
  **“Valor estimado”** (usado na projeção — o valor real é lançado mês a mês).
- **Pago** é **individual por conta fixa** e **unificado por cartão**: o checkbox “Fatura paga?”
  marca/desmarca todas as parcelas daquele cartão no mês.
- **Cadastro em andamento**: compras e débitos em folha aceitam **“parcela atual”** (ex.: 2 de 3 ou
  11 de 12); os meses anteriores são gerados automaticamente e entram como **pagos**.

## Deploy na Vercel

1. Importe o repositório `LeicsonBP/lpfin`.
2. Configure as 4 variáveis de ambiente do `.env.local` em *Settings → Environment Variables*.
3. Adicione o domínio de produção em *Supabase → Authentication → URL Configuration*
   (`https://<app>.vercel.app/auth/callback`).

## Backlog (fora do v1)

- Tabelas "Dívidas" e "A receber" da planilha de referência.
- Categorias configuráveis e relatórios por categoria.
- Importação/exportação CSV da planilha antiga.
- Notificações de vencimento.


