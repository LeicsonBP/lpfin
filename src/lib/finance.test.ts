import { describe, expect, it } from 'vitest';

import {
  addMonths,
  averageFixedBill,
  buildInstallmentPlan,
  fixedBillMonthValues,
  forecastNextMonths,
  groupByCard,
  historicalSeries,
  isOverdue,
  monthKey,
  monthRange,
  parseMonthParam,
  splitInstallments,
  suggestFirstInstallmentMonth,
  summarizeCardLimit,
  summarizeMonth,
} from '@/lib/finance';
import type {
  Card,
  FixedBill,
  FixedBillEntry,
  Income,
  Installment,
  PayrollDeduction,
  Transaction,
} from '@/lib/types';

const NOW = new Date(2026, 9, 15); // 15/10/2026

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'card-1',
    user_id: 'user-1',
    name: 'Mercado Pago',
    credit_limit: 5000,
    closing_day: 5,
    due_day: 15,
    color: '#0e6855',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeInstallment(overrides: Partial<Installment> = {}): Installment {
  return {
    id: 'inst-1',
    transaction_id: 'tx-1',
    user_id: 'user-1',
    card_id: 'card-1',
    installment_number: 1,
    installment_total: 1,
    reference_year: 2026,
    reference_month: 10,
    amount: 100,
    is_paid: false,
    paid_at: null,
    is_adjusted: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeEntry(overrides: Partial<FixedBillEntry> = {}): FixedBillEntry {
  return {
    id: 'entry-1',
    fixed_bill_id: 'bill-1',
    user_id: 'user-1',
    reference_year: 2026,
    reference_month: 10,
    amount: 500,
    is_paid: false,
    paid_at: null,
    notes: null,
    installment_number: null,
    installment_total: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeBill(overrides: Partial<FixedBill> = {}): FixedBill {
  return {
    id: 'bill-1',
    user_id: 'user-1',
    name: 'Aluguel',
    due_day: 10,
    base_value: 1500,
    category: 'moradia',
    kind: 'fixed',
    installments_count: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    user_id: 'user-1',
    card_id: 'card-1',
    description: 'Compra',
    category: 'aprazo',
    total_amount: 300,
    installments_count: 3,
    purchase_date: '2026-09-10',
    start_year: 2026,
    start_month: 9,
    is_subscription: false,
    notes: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('linha do tempo (Ano/Mês)', () => {
  it('avança e volta meses atravessando a virada de ano', () => {
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(addMonths({ year: 2026, month: 10 }, 14)).toEqual({ year: 2027, month: 12 });
  });

  it('gera intervalo inclusivo de meses', () => {
    const months = monthRange({ year: 2026, month: 11 }, { year: 2027, month: 2 });
    expect(months.map(monthKey)).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
    expect(monthRange({ year: 2027, month: 1 }, { year: 2026, month: 1 })).toEqual([]);
  });

  it('cai no mês atual quando os parâmetros são inválidos', () => {
    const fallback = { year: NOW.getFullYear(), month: NOW.getMonth() + 1 };
    expect(parseMonthParam('abc', '99', NOW)).toEqual(fallback);
    expect(parseMonthParam(undefined, '10', NOW)).toEqual(fallback);
    expect(parseMonthParam('2026', '10', NOW)).toEqual({ year: 2026, month: 10 });
    expect(parseMonthParam(['2026'], ['3'], NOW)).toEqual({ year: 2026, month: 3 });
  });
});

describe('motor de parcelamento', () => {
  it('divide valores em centavos sem perder 1 centavo', () => {
    expect(splitInstallments(100, 3)).toEqual([33.34, 33.33, 33.33]);
    expect(splitInstallments(10, 4)).toEqual([2.5, 2.5, 2.5, 2.5]);
    expect(splitInstallments(0.05, 2)).toEqual([0.03, 0.02]);
    expect(splitInstallments(120, 1)).toEqual([120]);
  });

  it('gera o plano de parcelas atravessando o ano', () => {
    const plan = buildInstallmentPlan({ total: 100, count: 3, start: { year: 2026, month: 11 } });

    expect(plan).toEqual([
      { number: 1, month: { year: 2026, month: 11 }, amount: 33.34 },
      { number: 2, month: { year: 2026, month: 12 }, amount: 33.33 },
      { number: 3, month: { year: 2027, month: 1 }, amount: 33.33 },
    ]);
    expect(plan.reduce((total, item) => total + item.amount, 0)).toBeCloseTo(100, 2);
  });

  it('joga a compra para a fatura seguinte quando passa do fechamento', () => {
    expect(suggestFirstInstallmentMonth('2026-10-04', 5)).toEqual({ year: 2026, month: 10 });
    expect(suggestFirstInstallmentMonth('2026-10-06', 5)).toEqual({ year: 2026, month: 11 });
    expect(suggestFirstInstallmentMonth('2026-10-30', null)).toEqual({ year: 2026, month: 10 });
  });
});

describe('resumo mensal', () => {
  const income: Income = {
    id: 'inc-1',
    user_id: 'user-1',
    description: 'Salário',
    amount: 8000,
    reference_year: 2026,
    reference_month: 10,
    kind: 'salary',
    is_received: true,
    received_at: null,
    series_id: null,
    is_recurring: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  const payroll: PayrollDeduction = {
    id: 'pay-1',
    user_id: 'user-1',
    name: 'Empréstimo',
    amount: 669.94,
    kind: 'installment',
    installment_number: 11,
    installment_total: 12,
    reference_year: 2026,
    reference_month: 10,
    is_paid: false,
    paid_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  it('calcula balanço positivo', () => {
    const summary = summarizeMonth({
      installments: [makeInstallment({ amount: 1000 })],
      fixedEntries: [makeEntry({ amount: 2000 })],
      incomes: [income],
      payroll: [payroll],
    });

    expect(summary).toEqual({
      incomeTotal: 8000,
      cardsTotal: 1000,
      fixedTotal: 2000,
      payrollTotal: 669.94,
      balance: 4330.06,
    });
  });

  it('calcula balanço negativo', () => {
    const summary = summarizeMonth({
      installments: [makeInstallment({ amount: 5000 })],
      fixedEntries: [makeEntry({ amount: 3000 })],
      incomes: [{ ...income, amount: 1000 }],
      payroll: [],
    });

    expect(summary.balance).toBe(-7000);
  });

  it('conta fixa sem lançamento no mês entra pelo valor base', () => {
    const values = fixedBillMonthValues([makeBill({ base_value: 1500 })], []);

    expect(values).toHaveLength(1);
    expect(values[0]).toMatchObject({ amount: 1500, entry: null, isPaid: false });
  });

  it('lançamento do mês substitui o valor base e o "pago" não muda o total', () => {
    const paid = fixedBillMonthValues(
      [makeBill({ base_value: 1500 })],
      [makeEntry({ amount: 1620.5, is_paid: true })],
    );
    const pending = fixedBillMonthValues(
      [makeBill({ base_value: 1500 })],
      [makeEntry({ amount: 1620.5, is_paid: false })],
    );

    expect(paid[0]?.amount).toBe(1620.5);
    expect(paid[0]?.isPaid).toBe(true);
    expect(pending[0]?.amount).toBe(1620.5);
    expect(pending[0]?.isPaid).toBe(false);
  });

  it('ignora conta inativa sem lançamento e conta parcelada fora da janela', () => {
    const values = fixedBillMonthValues(
      [
        makeBill({ id: 'inativa', is_active: false }),
        makeBill({ id: 'parcelada', kind: 'installment', installments_count: 36 }),
        makeBill({ id: 'ativa' }),
      ],
      [],
    );

    expect(values.map((value) => value.bill.id)).toEqual(['ativa']);
  });

  it('mantém conta inativa que já tem lançamento (histórico)', () => {
    const values = fixedBillMonthValues(
      [makeBill({ id: 'inativa', is_active: false })],
      [makeEntry({ fixed_bill_id: 'inativa', amount: 300 })],
    );

    expect(values).toHaveLength(1);
    expect(values[0]?.amount).toBe(300);
  });

  it('balanço inclui a conta estimada, independentemente de estar paga', () => {
    const bills = [makeBill({ base_value: 2000 })];

    const semLancamento = summarizeMonth({
      installments: [makeInstallment({ amount: 1000 })],
      fixedEntries: fixedBillMonthValues(bills, []),
      incomes: [income],
      payroll: [],
    });

    const pago = summarizeMonth({
      installments: [makeInstallment({ amount: 1000 })],
      fixedEntries: fixedBillMonthValues(bills, [makeEntry({ amount: 2000, is_paid: true })]),
      incomes: [income],
      payroll: [],
    });

    expect(semLancamento.fixedTotal).toBe(2000);
    expect(semLancamento.balance).toBe(5000);
    expect(pago.balance).toBe(5000);
  });

  it('agrupa por cartão e cria a linha "Sem cartão"', () => {
    const cards = [makeCard(), makeCard({ id: 'card-2', name: 'Neon' })];
    const groups = groupByCard(
      [
        makeInstallment({ amount: 370.33 }),
        makeInstallment({ id: 'inst-2', amount: 42.5 }),
        makeInstallment({ id: 'inst-3', card_id: null, amount: 30 }),
      ],
      cards,
    );

    expect(groups).toEqual([
      { cardId: 'card-1', name: 'Mercado Pago', total: 412.83, count: 2 },
      { cardId: 'card-2', name: 'Neon', total: 0, count: 0 },
      { cardId: null, name: 'Sem cartão', total: 30, count: 1 },
    ]);
  });

  it('marca como atrasado apenas o que ficou para trás e segue em aberto', () => {
    expect(isOverdue({ reference_year: 2026, reference_month: 9, is_paid: false }, NOW)).toBe(true);
    expect(isOverdue({ reference_year: 2026, reference_month: 9, is_paid: true }, NOW)).toBe(false);
    expect(isOverdue({ reference_year: 2026, reference_month: 10, is_paid: false }, NOW)).toBe(
      false,
    );
  });
});

describe('médias e projeção futura', () => {
  it('usa a média histórica das contas fixas e o valor base como fallback', () => {
    const history = [
      makeEntry({ id: 'e1', reference_month: 8, amount: 1000 }),
      makeEntry({ id: 'e2', reference_month: 9, amount: 1200 }),
    ];

    expect(averageFixedBill(history, 'bill-1', 1500, { year: 2026, month: 10 })).toBe(1100);
    expect(averageFixedBill([], 'bill-1', 1500, { year: 2026, month: 10 })).toBe(1500);
    expect(
      averageFixedBill([makeEntry({ reference_year: 2020, amount: 9999 })], 'bill-1', 1500, {
        year: 2026,
        month: 10,
      }),
    ).toBe(1500);
  });

  it('projeta parcelas exatas, contas fixas pela média e "Outros" pela média da categoria', () => {
    const installments = [
      makeInstallment({
        id: 'i1',
        transaction_id: 'tx-parcelada',
        reference_year: 2026,
        reference_month: 11,
        amount: 300,
      }),
      makeInstallment({
        id: 'i2',
        transaction_id: 'tx-outros',
        reference_year: 2026,
        reference_month: 9,
        amount: 300,
      }),
      makeInstallment({
        id: 'i3',
        transaction_id: 'tx-outros',
        reference_year: 2026,
        reference_month: 8,
        amount: 300,
      }),
      makeInstallment({
        id: 'i4',
        transaction_id: 'tx-outros',
        reference_year: 2026,
        reference_month: 7,
        amount: 300,
      }),
    ];

    const transactions = [
      makeTransaction({ id: 'tx-parcelada', category: 'aprazo' }),
      makeTransaction({ id: 'tx-outros', category: 'avista' }),
    ];

    const forecast = forecastNextMonths({
      anchor: { year: 2026, month: 10 },
      monthsAhead: 2,
      fixedBills: [makeBill()],
      fixedHistory: [makeEntry({ reference_month: 9, amount: 1800 })],
      installments,
      transactions,
      payroll: [],
    });

    expect(forecast).toHaveLength(2);
    // novembro: 300 de parcela + 300 de média de "outros" + 1800 de conta fixa
    expect(forecast[0]?.month).toEqual({ year: 2026, month: 11 });
    expect(forecast[0]?.cards).toBe(600);
    expect(forecast[0]?.fixed).toBe(1800);
    expect(forecast[0]?.total).toBe(2400);
    // dezembro: sem parcelas agendadas, entra só a média de "outros"
    expect(forecast[1]?.cards).toBe(300);
    expect(forecast[1]?.fixedDetails).toEqual([{ name: 'Aluguel', amount: 1800 }]);
  });

  it('monta o histórico dos últimos meses incluindo o mês de referência', () => {
    const series = historicalSeries({
      reference: { year: 2026, month: 10 },
      months: 3,
      installments: [makeInstallment({ reference_month: 10, amount: 100 })],
      fixedEntries: [makeEntry({ reference_month: 9, amount: 50 })],
      payroll: [],
    });

    expect(series.map((point) => monthKey(point.month))).toEqual([
      '2026-08',
      '2026-09',
      '2026-10',
    ]);
    expect(series[1]?.fixed).toBe(50);
    expect(series[2]?.total).toBe(100);
  });
});

describe('limite do cartão', () => {
  it('desconta fatura atual, parcelas atrasadas e futuras do limite', () => {
    const summary = summarizeCardLimit({
      limit: 5000,
      reference: { year: 2026, month: 10 },
      installments: [
        makeInstallment({ id: 'a', amount: 1000, reference_month: 10 }),
        makeInstallment({ id: 'b', amount: 500, reference_month: 9 }),
        makeInstallment({ id: 'c', amount: 300, reference_month: 11 }),
        makeInstallment({ id: 'd', amount: 200, reference_month: 8, is_paid: true }),
      ],
    });

    expect(summary.currentInvoice).toBe(1000);
    expect(summary.overdue).toBe(500);
    expect(summary.futureInstallments).toBe(300);
    expect(summary.paid).toBe(200);
    expect(summary.committed).toBe(1800);
    expect(summary.available).toBe(3200);
    expect(summary.usedPercent).toBe(36);
  });
});


