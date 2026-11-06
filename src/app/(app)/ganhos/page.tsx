import { AppHeader } from '@/components/layout/nav';
import { EntityForm, type EntityField } from '@/components/forms/entity-form';
import { Badge, Card, EmptyState, SectionTitle } from '@/components/ui/kit';
import { GhostSubmitButton } from '@/components/ui/submit-button';
import { deleteIncomeAction, toggleIncomeReceivedAction } from '@/lib/actions/incomes';
import { createIncomeAction } from '@/lib/actions/incomes';
import { listIncomes } from '@/lib/data/incomes';
import { currentMonth } from '@/lib/finance';
import { formatBRL, formatMonthLabel, monthSelectOptions, yearSelectOptions } from '@/lib/format';

const now = currentMonth();

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
    defaultValue: now.month,
    options: monthSelectOptions(),
    required: true,
  },
  {
    name: 'reference_year',
    label: 'Ano de referência',
    type: 'select',
    defaultValue: now.year,
    options: yearSelectOptions(),
    required: true,
  },
  { name: 'is_received', label: 'Já recebido', type: 'checkbox', defaultValue: false },
];

export default async function GanhosPage() {
  const incomes = await listIncomes();
  const total = incomes.reduce((sum, income) => sum + income.amount, 0);

  return (
    <div className="space-y-4">
      <AppHeader title="Ganhos" subtitle="Receitas por mês de referência" />

      <Card>
        <SectionTitle title="Novo ganho" description="Entra no cálculo do balanço mensal" />
        <EntityForm action={createIncomeAction} fields={FIELDS} submitLabel="Lançar ganho" />
      </Card>

      <Card>
        <SectionTitle
          title="Ganhos lançados"
          description={`${incomes.length} lançamento(s)`}
          action={<span className="money text-sm font-semibold text-positive">{formatBRL(total)}</span>}
        />

        {incomes.length === 0 ? (
          <EmptyState title="Nenhum ganho lançado" description="Lance o salário do mês acima." />
        ) : (
          <ul className="space-y-2">
            {incomes.map((income) => (
              <li
                key={income.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line p-3"
              >
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    {income.description}
                    {income.is_received ? <Badge tone="positive">recebido</Badge> : null}
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    {formatMonthLabel({ year: income.reference_year, month: income.reference_month })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="money text-sm font-medium text-positive">
                    {formatBRL(income.amount)}
                  </span>

                  <form action={toggleIncomeReceivedAction}>
                    <input type="hidden" name="id" value={income.id} />
                    <input type="hidden" name="received" value={income.is_received ? 'false' : 'true'} />
                    <GhostSubmitButton>
                      {income.is_received ? 'desmarcar' : 'receber'}
                    </GhostSubmitButton>
                  </form>

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
    </div>
  );
}
