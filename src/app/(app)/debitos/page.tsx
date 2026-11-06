import { AppHeader } from '@/components/layout/nav';
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

const now = currentMonth();

const FIELDS: EntityField[] = [
  { name: 'name', label: 'Nome do débito', required: true, placeholder: 'Empréstimo, consignado...' },
  {
    name: 'amount',
    label: 'Valor da parcela',
    type: 'money',
    required: true,
    hint: 'Valor descontado por mês',
  },
  {
    name: 'kind',
    label: 'Tipo',
    type: 'select',
    defaultValue: 'fixed',
    options: [
      { value: 'fixed', label: 'Fixo (todo mês)' },
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
  },
  {
    name: 'current_installment',
    label: 'Parcela atual',
    type: 'number',
    min: 1,
    max: 120,
    defaultValue: 1,
    hint: 'Ex.: 11 de 12 — as anteriores entram como pagas',
  },
  {
    name: 'reference_month',
    label: 'Mês da parcela',
    type: 'select',
    defaultValue: now.month,
    options: monthSelectOptions(),
    required: true,
  },
  {
    name: 'reference_year',
    label: 'Ano inicial',
    type: 'select',
    defaultValue: now.year,
    options: yearSelectOptions(),
    required: true,
  },
];

export default async function DebitosPage() {
  const payroll = await listPayroll();
  const total = payroll.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-4">
      <AppHeader
        title="Débitos em folha"
        subtitle="Descontos automáticos no salário: fixos ou parcelados"
      />

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
          description={`${payroll.length} lançamento(s)`}
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
