import { AppHeader } from '@/components/layout/nav';
import { EntityForm, type EntityField } from '@/components/forms/entity-form';
import { Badge, Card, EmptyState, SectionTitle } from '@/components/ui/kit';
import { GhostSubmitButton } from '@/components/ui/submit-button';
import {
  createFixedBillAction,
  deleteFixedBillAction,
  stopFixedBillEntriesAction,
  updateFixedBillAction,
} from '@/lib/actions/fixedBills';
import { listFixedBills } from '@/lib/data/fixedBills';
import { currentMonth } from '@/lib/finance';
import { formatBRL, monthSelectOptions, yearSelectOptions } from '@/lib/format';
import type { FixedBill } from '@/lib/types';

const NOW = currentMonth();

/** Cadastro: conta fixa (todo mês) ou parcelada (crediário, financiamento...). */
function createFields(): EntityField[] {
  return [
    { name: 'name', label: 'Nome da conta', required: true, placeholder: 'RGE, crediário...' },
    {
      name: 'kind',
      label: 'Tipo',
      type: 'select',
      defaultValue: 'fixed',
      options: [
        { value: 'fixed', label: 'Fixa' },
        { value: 'installment', label: 'Parcelada' },
      ],
      hint: 'Parcelada vale para crediário, financiamento, empréstimo...',
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
      showWhen: { field: 'kind', equals: ['installment'] },
    },
    {
      name: 'current_installment',
      label: 'Parcela atual',
      type: 'number',
      min: 1,
      max: 480,
      defaultValue: 1,
      hint: 'Ex.: 35 de 36 — as anteriores entram como pagas',
      showWhen: { field: 'kind', equals: ['installment'] },
    },
    {
      name: 'reference_month',
      label: 'Mês da parcela',
      type: 'select',
      defaultValue: NOW.month,
      options: monthSelectOptions(),
      required: true,
      showWhen: { field: 'kind', equals: ['installment'] },
    },
    {
      name: 'reference_year',
      label: 'Ano da parcela',
      type: 'select',
      defaultValue: NOW.year,
      options: yearSelectOptions(),
      required: true,
      showWhen: { field: 'kind', equals: ['installment'] },
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

export default async function ContasPage() {
  const bills = await listFixedBills();

  return (
    <div className="space-y-4">
      <AppHeader
        title="Contas"
        subtitle="Contas fixas e parceladas — o valor real é lançado mês a mês na visão mensal"
      />

      <Card>
        <SectionTitle
          title="Nova conta"
          description="Fixa (todo mês) ou parcelada (crediário, financiamento, empréstimo...)"
        />
        <EntityForm action={createFixedBillAction} fields={createFields()} submitLabel="Criar conta" />
      </Card>

      <Card>
        <SectionTitle title="Contas cadastradas" description={`${bills.length} conta(s)`} />

        {bills.length === 0 ? (
          <EmptyState title="Nenhuma conta cadastrada" description="Cadastre a primeira acima." />
        ) : (
          <ul className="space-y-2">
            {bills.map((bill) => (
              <li key={bill.id} className="rounded-xl border border-line p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
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

                {bill.kind === 'installment' ? (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] font-semibold text-negative">
                      Encerrar parcelas
                    </summary>
                    <div className="mt-3 space-y-2 rounded-xl border border-line p-3">
                      <p className="text-[11px] text-ink-muted">
                        Remove as parcelas do mês escolhido em diante (o histórico anterior é
                        preservado). Use quando não for dar prosseguimento ao pagamento.
                      </p>
                      <form
                        action={stopFixedBillEntriesAction}
                        className="flex flex-wrap items-end gap-2"
                      >
                        <input type="hidden" name="id" value={bill.id} />
                        <label className="space-y-1 text-[11px] text-ink-muted">
                          <span className="block">A partir de</span>
                          <select
                            name="reference_month"
                            defaultValue={NOW.month}
                            className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink"
                          >
                            {monthSelectOptions().map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="space-y-1 text-[11px] text-ink-muted">
                          <span className="block">Ano</span>
                          <select
                            name="reference_year"
                            defaultValue={NOW.year}
                            className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink"
                          >
                            {yearSelectOptions().map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <GhostSubmitButton className="text-negative">
                          Encerrar parcelas
                        </GhostSubmitButton>
                      </form>
                    </div>
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

