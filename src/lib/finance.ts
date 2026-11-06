import { fromCents, sumMoney, toCents } from '@/lib/money';
import type {
  Card,
  FixedBill,
  FixedBillEntry,
  Income,
  Installment,
  ISODate,
  MonthRef,
  PayrollDeduction,
  Transaction,
  UUID,
} from '@/lib/types';

export const MONTHS_IN_YEAR = 12;

/* -------------------------------------------------------------------------- */
/* Linha do tempo (Ano/Mês)                                                    */
/* -------------------------------------------------------------------------- */

export function currentMonth(today: Date = new Date()): MonthRef {
  return { year: today.getFullYear(), month: today.getMonth() + 1 };
}

/** '2026-10' — chave estável para mapas/ordenação. */
export function monthKey({ year, month }: MonthRef): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function isSameMonth(a: MonthRef, b: MonthRef): boolean {
  return a.year === b.year && a.month === b.month;
}

export function compareMonths(a: MonthRef, b: MonthRef): number {
  if (a.year !== b.year) return a.year - b.year;
  return a.month - b.month;
}

/** Diferença em meses (b - a). */
export function monthsBetween(a: MonthRef, b: MonthRef): number {
  return (b.year - a.year) * MONTHS_IN_YEAR + (b.month - a.month);
}

export function addMonths(reference: MonthRef, delta: number): MonthRef {
  const zeroBased = reference.year * MONTHS_IN_YEAR + (reference.month - 1) + delta;
  return {
    year: Math.floor(zeroBased / MONTHS_IN_YEAR),
    month: (zeroBased % MONTHS_IN_YEAR) + 1,
  };
}

/** Lista inclusiva de meses entre `from` e `to`. */
export function monthRange(from: MonthRef, to: MonthRef): MonthRef[] {
  const total = monthsBetween(from, to);
  if (total < 0) return [];
  return Array.from({ length: total + 1 }, (_, index) => addMonths(from, index));
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Lê `?ano=&mes=` da URL. Qualquer valor inválido cai no mês atual.
 */
export function parseMonthParam(
  yearParam?: string | string[],
  monthParam?: string | string[],
  today: Date = new Date(),
): MonthRef {
  const fallback = currentMonth(today);
  const yearRaw = firstParam(yearParam);
  const monthRaw = firstParam(monthParam);

  if (!yearRaw || !monthRaw) return fallback;

  const year = Number.parseInt(yearRaw, 10);
  const month = Number.parseInt(monthRaw, 10);

  if (!Number.isInteger(year) || year < 2000 || year > 2100) return fallback;
  if (!Number.isInteger(month) || month < 1 || month > MONTHS_IN_YEAR) return fallback;

  return { year, month };
}

export function monthFromDate(date: ISODate | Date): MonthRef {
  const parsed = date instanceof Date ? date : new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return currentMonth();
  return { year: parsed.getFullYear(), month: parsed.getMonth() + 1 };
}

export function monthDate(reference: MonthRef, day = 1): Date {
  return new Date(reference.year, reference.month - 1, Math.min(Math.max(day, 1), 28));
}

/* -------------------------------------------------------------------------- */
/* Motor de parcelamento                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Divide um total em `count` parcelas distribuidas em centavos.
 * A sobra do arredondamento vai para as primeiras parcelas.
 * Ex.: 100,00 em 3x => [33.34, 33.33, 33.33]
 */
export function splitInstallments(total: number, count: number): number[] {
  const parcels = Math.max(1, Math.trunc(count));
  const totalCents = toCents(total);
  const base = Math.trunc(totalCents / parcels);
  const remainder = totalCents - base * parcels;

  return Array.from({ length: parcels }, (_, index) =>
    fromCents(base + (index < remainder ? 1 : 0)),
  );
}

export interface PlannedInstallment {
  number: number;
  month: MonthRef;
  amount: number;
}

/**
 * Gera o plano de parcelas de uma compra (é o que alimenta a tabela `installments`).
 * Números são sempre sequenciais a partir de 1.
 */
export function buildInstallmentPlan(params: {
  total: number;
  count: number;
  start: MonthRef;
}): PlannedInstallment[] {
  const count = Math.max(1, Math.trunc(params.count));
  const amounts = splitInstallments(params.total, count);

  return amounts.map((amount, index) => ({
    number: index + 1,
    month: addMonths(params.start, index),
    amount,
  }));
}

/**
 * Sugere o mês da primeira parcela a partir do dia do fechamento do cartão:
 * compras feitas depois do fechamento entram na fatura seguinte.
 * Sem cartão (ou sem fechamento) a compra entra no próprio mês da compra.
 */
export function suggestFirstInstallmentMonth(
  purchaseDate: ISODate | Date,
  closingDay: number | null | undefined,
): MonthRef {
  const purchaseMonth = monthFromDate(purchaseDate);
  if (!closingDay) return purchaseMonth;

  const parsed = purchaseDate instanceof Date ? purchaseDate : new Date(`${purchaseDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return purchaseMonth;

  return parsed.getDate() > closingDay ? addMonths(purchaseMonth, 1) : purchaseMonth;
}

/** Soma das parcelas de uma compra (para conferência do total). */
export function plannedTotal(plan: readonly PlannedInstallment[]): number {
  return sumMoney(plan.map((item) => item.amount));
}

/** Saldo restante (parcelas não pagas) de uma compra. */
export function remainingAmount(installments: readonly Installment[]): number {
  return sumMoney(
    installments.filter((item) => !item.is_paid).map((item) => item.amount),
  );
}

/* -------------------------------------------------------------------------- */
/* Filtros por competência                                                     */
/* -------------------------------------------------------------------------- */

function inMonth(
  row: { reference_year: number; reference_month: number },
  reference: MonthRef,
): boolean {
  return row.reference_year === reference.year && row.reference_month === reference.month;
}

export function installmentsInMonth(
  installments: readonly Installment[],
  reference: MonthRef,
): Installment[] {
  return installments.filter((item) => inMonth(item, reference));
}

export function fixedEntriesInMonth(
  entries: readonly FixedBillEntry[],
  reference: MonthRef,
): FixedBillEntry[] {
  return entries.filter((item) => inMonth(item, reference));
}

export function incomesInMonth(incomes: readonly Income[], reference: MonthRef): Income[] {
  return incomes.filter((item) => inMonth(item, reference));
}

export function payrollInMonth(
  payroll: readonly PayrollDeduction[],
  reference: MonthRef,
): PayrollDeduction[] {
  return payroll.filter((item) => inMonth(item, reference));
}

/**
 * Uma parcela/conta está atrasada quando o mês de competência já passou
 * e ela continua em aberto.
 */
export function isOverdue(
  row: { reference_year: number; reference_month: number; is_paid: boolean },
  today: Date = new Date(),
): boolean {
  if (row.is_paid) return false;
  return compareMonths({ year: row.reference_year, month: row.reference_month }, currentMonth(today)) < 0;
}

/** `true` quando o mês de competência é o mês corrente. */
export function isCurrentMonth(reference: MonthRef, today: Date = new Date()): boolean {
  return isSameMonth(reference, currentMonth(today));
}

/* -------------------------------------------------------------------------- */
/* Resumo mensal                                                               */
/* -------------------------------------------------------------------------- */

export interface CardTotal {
  cardId: UUID | null;
  name: string;
  total: number;
  count: number;
}

export interface MonthlySummary {
  /** Ganhos do mês */
  incomeTotal: number;
  /** Compras de cartão do mês (soma das parcelas) */
  cardsTotal: number;
  /** Contas fixas com o valor real do mês */
  fixedTotal: number;
  /** Débitos em folha */
  payrollTotal: number;
  /** incomeTotal - (cardsTotal + fixedTotal + payrollTotal) */
  balance: number;
}

export function summarizeMonth(input: {
  installments: readonly Installment[];
  fixedEntries: readonly FixedBillEntry[];
  incomes: readonly Income[];
  payroll: readonly PayrollDeduction[];
}): MonthlySummary {
  const incomeTotal = sumMoney(input.incomes.map((item) => item.amount));
  const cardsTotal = sumMoney(input.installments.map((item) => item.amount));
  const fixedTotal = sumMoney(input.fixedEntries.map((item) => item.amount));
  const payrollTotal = sumMoney(input.payroll.map((item) => item.amount));

  return {
    incomeTotal,
    cardsTotal,
    fixedTotal,
    payrollTotal,
    balance: fromCents(
      toCents(incomeTotal) - toCents(cardsTotal) - toCents(fixedTotal) - toCents(payrollTotal),
    ),
  };
}

/**
 * Agrupa as parcelas do mês por cartão, preservando a ordem dos cartões
 * cadastrados e incluindo compras sem cartão ("Sem cartão").
 */
export function groupByCard(
  installments: readonly Installment[],
  cards: readonly Card[],
): CardTotal[] {
  const totals = new Map<string, CardTotal>();

  for (const card of cards) {
    totals.set(card.id, { cardId: card.id, name: card.name, total: 0, count: 0 });
  }

  for (const installment of installments) {
    const key = installment.card_id ?? 'none';
    const current = totals.get(key) ?? {
      cardId: installment.card_id ?? null,
      name: 'Sem cartão',
      total: 0,
      count: 0,
    };
    totals.set(key, {
      ...current,
      total: fromCents(toCents(current.total) + toCents(installment.amount)),
      count: current.count + 1,
    });
  }

  return [...totals.values()].filter(
    (item) => item.total > 0 || item.cardId !== null,
  );
}

/** Parcelas de uma compra ordenadas pela numeração. */
export function sortByNumber(installments: readonly Installment[]): Installment[] {
  return [...installments].sort((a, b) => a.installment_number - b.installment_number);
}

/** Agrupa parcelas por transação (usado na tela de compras). */
export function groupByTransaction(
  installments: readonly Installment[],
): Map<UUID, Installment[]> {
  const grouped = new Map<UUID, Installment[]>();
  for (const installment of installments) {
    const list = grouped.get(installment.transaction_id) ?? [];
    list.push(installment);
    grouped.set(installment.transaction_id, list);
  }
  for (const [key, list] of grouped) {
    grouped.set(key, sortByNumber(list));
  }
  return grouped;
}

/* -------------------------------------------------------------------------- */
/* Médias históricas (base da projeção futura)                                 */
/* -------------------------------------------------------------------------- */

/**
 * Média histórica do valor real de uma conta fixa.
 * Considera apenas meses com lançamento registrado dentro da janela;
 * sem nenhum histórico, devolve o valor base cadastrado.
 */
export function averageFixedBill(
  history: readonly FixedBillEntry[],
  fixedBillId: UUID,
  fallback: number,
  reference: MonthRef,
  window = 6,
): number {
  const months = new Set(
    monthRange(addMonths(reference, -(window - 1)), reference).map(monthKey),
  );

  const amounts = history
    .filter(
      (entry) =>
        entry.fixed_bill_id === fixedBillId &&
        months.has(monthKey({ year: entry.reference_year, month: entry.reference_month })),
    )
    .map((entry) => entry.amount);

  if (amounts.length === 0) return fallback;
  const totalCents = amounts.reduce((total, value) => total + toCents(value), 0);
  return fromCents(Math.round(totalCents / amounts.length));
}

/**
 * Média mensal de gastos de uma categoria nos `window` meses anteriores
 * ao mês de referência (o mês de referência não entra, pois costuma estar incompleto).
 */
export function averageCategorySpend(params: {
  transactions: readonly Transaction[];
  installments: readonly Installment[];
  category: string;
  reference: MonthRef;
  window?: number;
}): number {
  const window = params.window ?? 3;
  const allowed = new Set(
    Array.from({ length: window }, (_, index) =>
      monthKey(addMonths(params.reference, -(index + 1))),
    ),
  );

  const transactionCategory = new Map(
    params.transactions.map((transaction) => [transaction.id, transaction.category] as const),
  );

  const totalsByMonth = new Map<string, number>();
  for (const installment of params.installments) {
    const category = transactionCategory.get(installment.transaction_id);
    if (category !== params.category) continue;
    const key = monthKey({ year: installment.reference_year, month: installment.reference_month });
    if (!allowed.has(key)) continue;
    totalsByMonth.set(key, (totalsByMonth.get(key) ?? 0) + toCents(installment.amount));
  }

  const totalCents = [...totalsByMonth.values()].reduce((total, value) => total + value, 0);
  return fromCents(Math.round(totalCents / window));
}

/**
 * Média mensal de um conjunto de lançamentos (ex.: débitos em folha)
 * nos `window` meses anteriores ao mês de referência.
 */
export function averageMonthlyTotal(
  rows: readonly { reference_year: number; reference_month: number; amount: number }[],
  reference: MonthRef,
  window = 3,
): number {
  const months = new Set(
    Array.from({ length: window }, (_, index) => monthKey(addMonths(reference, -(index + 1)))),
  );

  const amounts = rows
    .filter((row) =>
      months.has(monthKey({ year: row.reference_year, month: row.reference_month })),
    )
    .map((row) => row.amount);

  if (amounts.length === 0) return 0;
  const totalCents = amounts.reduce((total, value) => total + toCents(value), 0);
  return fromCents(Math.round(totalCents / window));
}

/* -------------------------------------------------------------------------- */
/* Histórico                                                                   */
/* -------------------------------------------------------------------------- */

export interface HistoryPoint {
  month: MonthRef;
  cards: number;
  fixed: number;
  payroll: number;
  total: number;
}

export interface HistoryInput {
  reference: MonthRef;
  months: number;
  installments: readonly Installment[];
  fixedEntries: readonly FixedBillEntry[];
  payroll: readonly PayrollDeduction[];
}

/** Gastos mensais dos últimos `months` meses (inclui o mês de referência). */
export function historicalSeries(input: HistoryInput): HistoryPoint[] {
  const months = Array.from({ length: input.months }, (_, index) =>
    addMonths(input.reference, -(input.months - 1 - index)),
  );

  return months.map((month) => {
    const cards = sumMoney(
      installmentsInMonth(input.installments, month).map((item) => item.amount),
    );
    const fixed = sumMoney(
      fixedEntriesInMonth(input.fixedEntries, month).map((item) => item.amount),
    );
    const payroll = sumMoney(payrollInMonth(input.payroll, month).map((item) => item.amount));

    return {
      month,
      cards,
      fixed,
      payroll,
      total: fromCents(toCents(cards) + toCents(fixed) + toCents(payroll)),
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Previsão futura                                                             */
/* -------------------------------------------------------------------------- */

export interface ForecastDetail {
  name: string;
  amount: number;
}

export interface ForecastMonth {
  month: MonthRef;
  /** Parcelas já geradas + estimativa de novas compras da categoria projetada */
  cards: number;
  /** Média histórica das contas fixas (ou valor base) */
  fixed: number;
  /** Débitos em folha lançados no mês ou média histórica */
  payroll: number;
  total: number;
  /** Composição das contas fixas (tooltip/relatório) */
  fixedDetails: ForecastDetail[];
}

export interface ForecastInput {
  /** Mês atual — a projeção começa no mês seguinte */
  anchor: MonthRef;
  monthsAhead?: number;
  fixedBills: readonly FixedBill[];
  fixedHistory: readonly FixedBillEntry[];
  installments: readonly Installment[];
  transactions: readonly Transaction[];
  payroll: readonly PayrollDeduction[];
  historyWindow?: number;
  categoryWindow?: number;
  /** Categoria cujas novas compras são estimadas pela média histórica */
  projectionCategory?: string;
}

/**
 * Projeção dos próximos meses.
 * - Contas fixas: média histórica real (janela de 3 a 6 meses), com fallback no valor base.
 * - Parcelas: soma exata das parcelas já geradas (respeita ajustes individuais).
 * - Compras à vista: média histórica, descontando o que já está agendado no mês.
 */
export function forecastNextMonths(input: ForecastInput): ForecastMonth[] {
  const monthsAhead = input.monthsAhead ?? 6;
  const historyWindow = input.historyWindow ?? 6;
  const categoryWindow = input.categoryWindow ?? 3;
  const projectionCategory = input.projectionCategory ?? 'avista';

  const fixedDetails: ForecastDetail[] = input.fixedBills
    .filter((bill) => bill.is_active)
    .map((bill) => ({
      name: bill.name,
      amount: averageFixedBill(
        input.fixedHistory,
        bill.id,
        bill.base_value,
        input.anchor,
        historyWindow,
      ),
    }));
  const fixedTotal = sumMoney(fixedDetails.map((detail) => detail.amount));

  const othersAverage = averageCategorySpend({
    transactions: input.transactions,
    installments: input.installments,
    category: projectionCategory,
    reference: input.anchor,
    window: categoryWindow,
  });

  const payrollAverage = averageMonthlyTotal(input.payroll, input.anchor, 3);
  const transactionCategory = new Map(
    input.transactions.map((transaction) => [transaction.id, transaction.category] as const),
  );

  return Array.from({ length: monthsAhead }, (_, index) => {
    const month = addMonths(input.anchor, index + 1);
    const scheduled = installmentsInMonth(input.installments, month);

    const scheduledCents = scheduled.reduce(
      (total, installment) => total + toCents(installment.amount),
      0,
    );
    const scheduledOthersCents = scheduled.reduce((total, installment) => {
      const category = transactionCategory.get(installment.transaction_id);
      return category === projectionCategory ? total + toCents(installment.amount) : total;
    }, 0);

    const missingOthersCents = Math.max(0, toCents(othersAverage) - scheduledOthersCents);
    const cards = fromCents(scheduledCents + missingOthersCents);

    const recordedPayroll = sumMoney(
      payrollInMonth(input.payroll, month).map((item) => item.amount),
    );
    const payroll = recordedPayroll > 0 ? recordedPayroll : payrollAverage;

    return {
      month,
      cards,
      fixed: fixedTotal,
      payroll,
      total: fromCents(toCents(cards) + toCents(fixedTotal) + toCents(payroll)),
      fixedDetails,
    };
  });
}

/** Último mês com parcelas geradas (mostra quando os parcelamentos terminam). */
export function lastCommitmentMonth(installments: readonly Installment[]): MonthRef | null {
  const first = installments[0];
  if (!first) return null;

  return installments.reduce<MonthRef>((latest, installment) => {
    const current = { year: installment.reference_year, month: installment.reference_month };
    return compareMonths(current, latest) > 0 ? current : latest;
  }, { year: first.reference_year, month: first.reference_month });
}

/* -------------------------------------------------------------------------- */
/* Limite do cartão                                                            */
/* -------------------------------------------------------------------------- */

export interface CardLimitSummary {
  /** parcelas em aberto no mês de referência (fatura atual) */
  currentInvoice: number;
  /** parcelas em aberto de meses anteriores (atrasadas) */
  overdue: number;
  /** parcelas em aberto de meses futuros */
  futureInstallments: number;
  /** já pago */
  paid: number;
  /** fatura atual + atrasadas + futuras (o que ainda vai consumir limite) */
  committed: number;
  /** limite disponível depois de descontar o comprometido */
  available: number;
  /** percentual do limite comprometido (0-100) */
  usedPercent: number;
}

/**
 * Calcula o limite restante do cartão considerando a fatura do mês,
 * parcelas atrasadas e todas as parcelas futuras já geradas.
 */
export function summarizeCardLimit(params: {
  limit: number;
  installments: readonly Installment[];
  reference: MonthRef;
}): CardLimitSummary {
  let currentCents = 0;
  let overdueCents = 0;
  let futureCents = 0;
  let paidCents = 0;

  for (const installment of params.installments) {
    const cents = toCents(installment.amount);
    const month = { year: installment.reference_year, month: installment.reference_month };

    if (installment.is_paid) {
      paidCents += cents;
      continue;
    }

    const diff = monthsBetween(params.reference, month);
    if (diff === 0) currentCents += cents;
    else if (diff > 0) futureCents += cents;
    else overdueCents += cents;
  }

  const committedCents = currentCents + overdueCents + futureCents;
  const limitCents = toCents(params.limit);

  return {
    currentInvoice: fromCents(currentCents),
    overdue: fromCents(overdueCents),
    futureInstallments: fromCents(futureCents),
    paid: fromCents(paidCents),
    committed: fromCents(committedCents),
    available: fromCents(limitCents - committedCents),
    usedPercent:
      limitCents > 0 ? Math.min(100, Math.round((committedCents / limitCents) * 100)) : 0,
  };
}



