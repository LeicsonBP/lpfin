import { AppHeader } from '@/components/layout/nav';
import { MonthPicker } from '@/components/layout/month-picker';
import { EntityForm, type EntityField } from '@/components/forms/entity-form';
import { Badge, Card, EmptyState, SectionTitle } from '@/components/ui/kit';
import { GhostSubmitButton } from '@/components/ui/submit-button';
import { createPayrollDeductionAction, deletePayrollDeductionAction } from '@/lib/actions/payroll';
import { listPayroll } from '@/lib/data/payroll';
import { currentMonth } from '@/lib/finance';
import {
  formatBRL,
  formatInstallmentLabel,
  formatMonthLabel,
  monthSelectOptions,
  yearSelectOptions,
} from '@/lib/format';
import { resolveMonth } from '@/lib/month-context';

const now = currentMonth();

const FIELDS: EntityField[] = [
  { name: 'name', label: 'Nome do débito', required: true, placeholder: 'Empréstimo, consignado...' },
  {
    name: 'amount',
    label: 'Valor',
    type: 'money',
    required: true,
    hint: 'Valor descontado por mês — se parcelado, o valor de cada parcela',
  },
  {
    name: 'kind',
    label: 'Tipo',
    type: 'select',
    defaultValue: 'fixed',
    options: [
      { value: 'fixed', label: 'Fixo' },
      { value: 'installment', label: 'Parcelado' },
    ],
  },
  {
    name: 'installments_count',
    label: 'Nº de parcelas',
    type: 'number',
    min: 1,
    max: 120,
    defaultValue: 1,
    hint: 'Usado apenas quando o tipo é parcelado',
    showWhen: { field: 'kind', equals: ['installment'] },
  },
  {
    name: 'current_installment',
    label: 'Parcela atual',
    type: 'number',
    min: 1,
    max: 120,
    defaultValue: 1,
    hint: 'Ex.: 11 de 12 — as anteriores entram como pagas',
    showWhen: { field: 'kind', equals: ['installment'] },
  },
  {
    name: 'reference_month',
    label: 'Mês',
    type: 'select',
    defaultValue: now.month,
    options: monthSelectOptions(),
    required: true,
    hint: 'Mês de referência do débito',
  },
  {
    name: 'reference_year',
    label: 'Ano',
    type: 'select',
    defaultValue: now.year,
    options: yearSelectOptions(),
    required: true,
  },
];

export default async function DebitosPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
  const params = await searchParams;
  const reference = await resolveMonth(params);

  const payroll = await listPayroll(reference);
  const total = payroll.reduce((sum, item) => sum + item.amount, 0);
  const monthLabel = formatMonthLabel(reference).toLowerCase();

  return (
    <div className="space-y-4">
      <AppHeader
        title="Débitos em folha"
        subtitle={`Descontos automáticos no salário — ${monthLabel}`}
      >
        <MonthPicker reference={reference} basePath="/debitos" />
      </AppHeader>

      <Card>
        <SectionTitle
          title="Novo débito em folha"
          description="Parcelados geram uma linha por mês automaticamente"
        />
        <EntityForm
          action={createPayrollDeductionAction}
          fields={FIELDS}
          submitLabel="Lançar débito"
        />
      </Card>

      <Card>
        <SectionTitle
          title="Débitos lançados"
          description={`${payroll.length} lançamento(s) em ${monthLabel}`}
          action={<span className="money text-sm font-semibold text-ink">{formatBRL(total)}</span>}
        />

        {payroll.length === 0 ? (
          <EmptyState title="Nenhum débito" description="Lance empréstimos e consignados acima." />
        ) : (
          <ul className="space-y-2">
            {payroll.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line p-3"
              >
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    {item.name}
                    <Badge tone={item.kind === 'fixed' ? 'neutral' : 'brand'}>
                      {formatInstallmentLabel(item.installment_number, item.installment_total)}
                    </Badge>
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    {formatMonthLabel({ year: item.reference_year, month: item.reference_month })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="money text-sm font-medium text-ink">{formatBRL(item.amount)}</span>
                  <form action={deletePayrollDeductionAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <GhostSubmitButton className="text-negative">excluir</GhostSubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
