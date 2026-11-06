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
import { currentMonth } from '@/lib/finance';
import { formatBRL, monthSelectOptions, yearSelectOptions } from '@/lib/format';
import type { FixedBill } from '@/lib/types';

const NOW = currentMonth();

/** Cadastro: fixa (todo mês) ou parcelada (financiamento/empréstimo). */
function createFields(): EntityField[] {
  return [
    { name: 'name', label: 'Nome da conta', required: true, placeholder: 'RGE, financiamento...' },
    {
      name: 'kind',
      label: 'Tipo',
      type: 'select',
      defaultValue: 'fixed',
      options: [
        { value: 'fixed', label: 'Fixa (todo mês)' },
        { value: 'installment', label: 'Parcelada (financiamento)' },
      ],
    },
    {
      name: 'base_value',
      label: 'Valor',
      type: 'money',
      required: true,
      hint: 'Valor estimado (fixa) ou valor da parcela (parcelada)',
    },
    {
      name: 'installments_count',
      label: 'Nº de parcelas',
      type: 'number',
      min: 1,
      max: 480,
      defaultValue: 1,
      hint: 'Só para contas parceladas',
    },
    {
      name: 'current_installment',
      label: 'Parcela atual',
      type: 'number',
      min: 1,
      max: 480,
      defaultValue: 1,
      hint: 'Ex.: 35 de 36 — as anteriores entram como pagas',
    },
    {
      name: 'reference_month',
      label: 'Mês da parcela',
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
    {
      name: 'due_day',
      label: 'Dia de vencimento',
      type: 'number',
      min: 1,
      max: 31,
      required: true,
      defaultValue: 10,
    },
    { name: 'is_active', label: 'Conta ativa', type: 'checkbox', defaultValue: true },
  ];
}

/** Edição: só os dados do "molde" (as parcelas são ajustadas no mês). */
function updateFields(bill: FixedBill): EntityField[] {
  return [
    { name: 'name', label: 'Nome da conta', required: true, defaultValue: bill.name },
    {
      name: 'base_value',
      label: 'Valor estimado',
      type: 'money',
      required: true,
      defaultValue: bill.base_value,
      hint: 'Referência para a projeção — o valor real é informado mês a mês',
    },
    {
      name: 'due_day',
      label: 'Dia de vencimento',
      type: 'number',
      min: 1,
      max: 31,
      required: true,
      defaultValue: bill.due_day ?? 10,
    },
    { name: 'is_active', label: 'Conta ativa', type: 'checkbox', defaultValue: bill.is_active },
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
        <SectionTitle
          title="Nova conta"
          description="Conta fixa (todo mês) ou parcelada (financiamento/empréstimo)"
        />
        <EntityForm action={createFixedBillAction} fields={createFields()} submitLabel="Criar conta" />
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
                      {bill.kind === 'installment' ? (
                        <Badge tone="brand">{bill.installments_count ?? '?'}x parcelada</Badge>
                      ) : (
                        <Badge tone="neutral">fixa</Badge>
                      )}
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
                      fields={updateFields(bill)}
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
