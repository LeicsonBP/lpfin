import { AppHeader } from '@/components/layout/nav';
import { MonthPicker } from '@/components/layout/month-picker';
import { BalanceCard } from '@/components/monthly/balance-card';
import { CardsSection } from '@/components/monthly/cards-section';
import { FixedBillsSection, IncomeSection, PayrollSection } from '@/components/monthly/list-sections';
import { getMonthData } from '@/lib/data/monthly';
import { fixedBillMonthValues, summarizeMonth } from '@/lib/finance';
import { formatMonthLabel } from '@/lib/format';
import { resolveMonth } from '@/lib/month-context';

export default async function MesPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
  const params = await searchParams;
  const reference = await resolveMonth(params);
  const data = await getMonthData(reference);

  const summary = summarizeMonth({
    installments: data.installments,
    // conta fixa ainda sem lançamento no mês já entra pelo valor base: o
    // checkbox "pago" é só controle pessoal e não mexe no balanço.
    fixedEntries: fixedBillMonthValues(data.fixedBills, data.fixedEntries),
    incomes: data.incomes,
    payroll: data.payroll,
  });

  const monthLabel = formatMonthLabel(reference).toLowerCase();

  return (
    <div className="space-y-4">
      <AppHeader title="Visão mensal" subtitle="Tudo que acontece no mês selecionado">
        <MonthPicker reference={reference} />
      </AppHeader>

      <BalanceCard summary={summary} />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <CardsSection
            cards={data.cards}
            cardPayments={data.cardPayments}
            installments={data.installments}
            transactions={data.transactions}
            reference={reference}
            monthLabel={monthLabel}
          />
        </div>

        <div className="space-y-4 lg:col-span-2">
          <FixedBillsSection
            bills={data.fixedBills}
            entries={data.fixedEntries}
            reference={reference}
            monthLabel={monthLabel}
          />
          <PayrollSection payroll={data.payroll} />
          <IncomeSection incomes={data.incomes} />
        </div>
      </div>
    </div>
  );
}
