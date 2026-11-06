import { AppHeader } from '@/components/layout/nav';
import { EntityForm, type EntityField } from '@/components/forms/entity-form';
import { Badge, Card, EmptyState, SectionTitle } from '@/components/ui/kit';
import { GhostSubmitButton } from '@/components/ui/submit-button';
import {
  adjustRecurringIncomeAction,
  createIncomeAction,
  deleteIncomeAction,
  endRecurringIncomeAction,
} from '@/lib/actions/incomes';
import { listIncomes } from '@/lib/data/incomes';
import { currentMonth, monthKey } from '@/lib/finance';
import { formatBRL, formatMonthLabel, monthSelectOptions, yearSelectOptions } from '@/lib/format';
import type { Income, MonthRef } from '@/lib/types';

const NOW = currentMonth();

const FIELDS: EntityField[] = [
  { name: 'description', label: 'Descrição', required: true, placeholder: 'Salário, freela...' },
  { name: 'amount', label: 'Valor', type: 'money', required: true },
  {
    name: 'kind',
    label: 'Tipo',
    type: 'select',
    defaultValue: 'salary',
    options: [
      { value: 'salary', label: 'Salário' },
      { value: 'extra', label: 'Extra' },
      { value: 'other', label: 'Outros' },
    ],
  },
  {
    name: 'reference_month',
    label: 'Mês de referência',
    type: 'select',
    defaultValue: NOW.month,
    options: monthSelectOptions(),
    required: true,
  },
  {
    name: 'reference_year',
    label: 'Ano de referência',
    type: 'select',
    defaultValue: NOW.year,
    options: yearSelectOptions(),
    required: true,
  },
  { name: 'is_recurring', label: 'Recorrente (ex.: salário)', type: 'checkbox', defaultValue: false },
];

interface SeriesSummary {
  seriesId: string;
  description: string;
  amount: number;
  months: number;
  first: MonthRef;
  last: MonthRef;
}

/** Agrupa as ocorrências mensais de cada recorrência. */
function buildSeries(incomes: Income[]): SeriesSummary[] {
  const map = new Map<string, SeriesSummary>();

  for (const income of incomes) {
    if (!income.series_id) continue;
    const month = { year: income.reference_year, month: income.reference_month };
    const current = map.get(income.series_id);

    if (!current) {
      map.set(income.series_id, {
        seriesId: income.series_id,
        description: income.description,
        amount: income.amount,
        months: 1,
        first: month,
        last: month,
      });
      continue;
    }

    current.months += 1;
    if (monthKey(month) < monthKey(current.first)) current.first = month;
    if (monthKey(month) > monthKey(current.last)) {
      current.last = month;
      current.amount = income.amount;
      current.description = income.description;
    }
  }

  return [...map.values()].sort((a, b) => a.description.localeCompare(b.description));
}

export default async function GanhosPage() {
  const incomes = await listIncomes();
  const monthIncomes = incomes.filter(
    (income) => income.reference_year === NOW.year && income.reference_month === NOW.month,
  );
  const series = buildSeries(incomes);
  const totalMonth = monthIncomes.reduce((sum, income) => sum + income.amount, 0);

  return (
    <div className="space-y-4">
      <AppHeader
        title="Ganhos"
        subtitle="Receitas do mês e recorrências (ex.: salário com ajuste anual)"
      />

      <Card>
        <SectionTitle
          title="Novo ganho"
          description="Marque como recorrente para gerar automaticamente os próximos meses"
        />
        <EntityForm action={createIncomeAction} fields={FIELDS} submitLabel="Lançar ganho" />
      </Card>

      <Card>
        <SectionTitle
          title={`Ganhos de ${formatMonthLabel(NOW).toLowerCase()}`}
          description={`${monthIncomes.length} lançamento(s)`}
          action={
            <span className="money text-sm font-semibold text-positive">{formatBRL(totalMonth)}</span>
          }
        />

        {monthIncomes.length === 0 ? (
          <EmptyState
            title="Nenhum ganho neste mês"
            description="Lance o salário ou um ganho esporádico acima."
          />
        ) : (
          <ul className="space-y-2">
            {monthIncomes.map((income) => (
              <li
                key={income.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line p-3"
              >
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    {income.description}
                    {income.is_recurring ? <Badge tone="brand">recorrente</Badge> : null}
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    {income.kind === 'salary'
                      ? 'Salário'
                      : income.kind === 'extra'
                        ? 'Extra'
                        : 'Outros'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="money text-sm font-medium text-positive">
                    {formatBRL(income.amount)}
                  </span>
                  <form action={deleteIncomeAction}>
                    <input type="hidden" name="id" value={income.id} />
                    <GhostSubmitButton className="text-negative">excluir</GhostSubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <SectionTitle
          title="Recorrências"
          description="Ajuste o valor a partir de um mês sem alterar o histórico anterior"
        />

        {series.length === 0 ? (
          <EmptyState
            title="Nenhum ganho recorrente"
            description="Cadastre o salário como recorrente para não precisar lançar todo mês."
          />
        ) : (
          <ul className="space-y-2">
            {series.map((item) => (
              <li key={item.seriesId} className="rounded-xl border border-line p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-ink">{item.description}</p>
                    <p className="text-[11px] text-ink-muted">
                      {formatMonthLabel(item.first)} → {formatMonthLabel(item.last)} · {item.months}{' '}
                      meses
                    </p>
                  </div>
                  <span className="money text-sm font-semibold text-positive">
                    {formatBRL(item.amount)}
                  </span>
                </div>

                <details className="mt-2">
                  <summary className="cursor-pointer text-[11px] font-semibold text-brand-700">
                    Ajustar valor a partir de um mês
                  </summary>
                  <div className="mt-3">
                    <EntityForm
                      action={adjustRecurringIncomeAction}
                      fields={[
                        { name: 'series_id', type: 'hidden', defaultValue: item.seriesId },
                        {
                          name: 'amount',
                          label: 'Novo valor',
                          type: 'money',
                          required: true,
                          defaultValue: item.amount,
                        },
                        {
                          name: 'reference_month',
                          label: 'A partir do mês',
                          type: 'select',
                          defaultValue: NOW.month,
                          options: monthSelectOptions(),
                          required: true,
                        },
                        {
                          name: 'reference_year',
                          label: 'Ano',
                          type: 'select',
                          defaultValue: NOW.year,
                          options: yearSelectOptions(),
                          required: true,
                        },
                      ]}
                      submitLabel="Aplicar deste mês em diante"
                    />
                  </div>
                </details>

                <details className="mt-2">
                  <summary className="cursor-pointer text-[11px] font-semibold text-negative">
                    Encerrar recorrência
                  </summary>
                  <div className="mt-3">
                    <p className="mb-2 text-[11px] text-ink-muted">
                      Os meses anteriores a este são preservados; este mês e os futuros são
                      removidos.
                    </p>
                    <EntityForm
                      action={endRecurringIncomeAction}
                      fields={[
                        { name: 'series_id', type: 'hidden', defaultValue: item.seriesId },
                        {
                          name: 'reference_month',
                          label: 'Encerrar a partir de',
                          type: 'select',
                          defaultValue: NOW.month,
                          options: monthSelectOptions(),
                          required: true,
                        },
                        {
                          name: 'reference_year',
                          label: 'Ano',
                          type: 'select',
                          defaultValue: NOW.year,
                          options: yearSelectOptions(),
                          required: true,
                        },
                      ]}
                      submitLabel="Encerrar recorrência"
                    />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

