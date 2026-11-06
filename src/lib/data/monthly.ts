import { listCards } from '@/lib/data/cards';
import { listFixedBillEntries, listFixedBills } from '@/lib/data/fixedBills';
import { listIncomes } from '@/lib/data/incomes';
import { listPayroll } from '@/lib/data/payroll';
import { listInstallments, listTransactions } from '@/lib/data/transactions';
import { addMonths, currentMonth } from '@/lib/finance';
import type {
  Card,
  FixedBill,
  FixedBillEntry,
  Income,
  Installment,
  MonthRef,
  PayrollDeduction,
  Transaction,
} from '@/lib/types';

export interface MonthData {
  reference: MonthRef;
  cards: Card[];
  installments: Installment[];
  transactions: Transaction[];
  fixedBills: FixedBill[];
  fixedEntries: FixedBillEntry[];
  incomes: Income[];
  payroll: PayrollDeduction[];
}

/** Tudo que a Visão Mensal precisa, filtrado por competência. */
export async function getMonthData(reference: MonthRef): Promise<MonthData> {
  const [cards, installments, transactions, fixedBills, fixedEntries, incomes, payroll] =
    await Promise.all([
      listCards(),
      listInstallments({ from: reference, to: reference }),
      listTransactions(),
      listFixedBills(),
      listFixedBillEntries({ from: reference, to: reference }),
      listIncomes(reference),
      listPayroll(reference),
    ]);

  return {
    reference,
    cards,
    installments,
    transactions,
    fixedBills,
    fixedEntries,
    incomes,
    payroll,
  };
}


export interface RangeData {
  from: MonthRef;
  to: MonthRef;
  installments: Installment[];
  fixedEntries: FixedBillEntry[];
  payroll: PayrollDeduction[];
  transactions: Transaction[];
  fixedBills: FixedBill[];
}

/**
 * Dados de um intervalo de competências — base do histórico e da projeção.
 * Inclui parcelas futuras (necessárias para a soma exata da previsão).
 */
export async function getRangeData(from: MonthRef, to: MonthRef): Promise<RangeData> {
  const [installments, fixedEntries, payroll, transactions, fixedBills] = await Promise.all([
    listInstallments({ from, to }),
    listFixedBillEntries({ from, to }),
    listPayroll(),
    listTransactions(),
    listFixedBills(),
  ]);

  return { from, to, installments, fixedEntries, payroll, transactions, fixedBills };
}

/** Janela padrão do dashboard: 6 meses de histórico + 12 meses de projeção. */
export async function getDashboardData(reference: MonthRef = currentMonth()) {
  const from = addMonths(reference, -5);
  const to = addMonths(reference, 12);
  const data = await getRangeData(from, to);

  return { reference, ...data };
}
