import { AppHeader } from '@/components/layout/nav';
import { EntityForm, type EntityField } from '@/components/forms/entity-form';
import { Badge, Card, EmptyState, SectionTitle } from '@/components/ui/kit';
import { GhostSubmitButton } from '@/components/ui/submit-button';
import {
  createFixedBillAction,
  deleteFixedBillAction,
  updateFixedBillAction,
} from '@/lib/actions/fixedBills';
import { listFixedBills } from '@/lib/data/fixedBills';
import { formatBRL } from '@/lib/format';
import type { FixedBill } from '@/lib/types';

function fields(bill?: FixedBill): EntityField[] {
  return [
    { name: 'name', label: 'Nome da conta', required: true, defaultValue: bill?.name },
    {
      name: 'base_value',
      label: 'Valor estimado',
      type: 'money',
      required: true,
      defaultValue: bill?.base_value ?? 0,
      hint: 'Referência para a projeção — o valor real é informado mês a mês',
    },
    {
      name: 'due_day',
      label: 'Dia de vencimento',
      type: 'number',
      min: 1,
      max: 31,
      required: true,
      defaultValue: bill?.due_day ?? 10,
    },
    { name: 'is_active', label: 'Conta ativa', type: 'checkbox', defaultValue: bill?.is_active ?? true },
  ];
}

export default async function ContasFixasPage() {
  const bills = await listFixedBills();

  return (
    <div className="space-y-4">
      <AppHeader
        title="Contas fixas"
        subtitle="O cadastro é apenas o molde: o valor real é lançado mês a mês na visão mensal"
      />

      <Card>
        <SectionTitle title="Nova conta fixa" description="Aluguel, energia, internet, condomínio..." />
        <EntityForm action={createFixedBillAction} fields={fields()} submitLabel="Criar conta fixa" />
      </Card>

      <Card>
        <SectionTitle title="Contas cadastradas" description={`${bills.length} conta(s)`} />

        {bills.length === 0 ? (
          <EmptyState title="Nenhuma conta fixa" description="Cadastre a primeira acima." />
        ) : (
          <ul className="space-y-2">
            {bills.map((bill) => (
              <li key={bill.id} className="rounded-xl border border-line p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                      {bill.name}
                      {!bill.is_active ? <Badge>inativa</Badge> : null}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      valor estimado {formatBRL(bill.base_value)}
                      {bill.due_day ? ` · vence dia ${bill.due_day}` : ''}
                    </p>
                  </div>

                  <form action={deleteFixedBillAction}>
                    <input type="hidden" name="id" value={bill.id} />
                    <GhostSubmitButton className="text-negative" title="Excluir conta">
                      excluir
                    </GhostSubmitButton>
                  </form>
                </div>

                <details className="mt-2">
                  <summary className="cursor-pointer text-[11px] font-semibold text-brand-700">
                    Editar
                  </summary>
                  <div className="mt-3">
                    <EntityForm
                      action={updateFixedBillAction}
                      fields={fields(bill)}
                      id={bill.id}
                      submitLabel="Salvar alterações"
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
