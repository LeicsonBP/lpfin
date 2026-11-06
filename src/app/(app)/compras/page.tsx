import { AppHeader } from '@/components/layout/nav';
import { MonthPicker } from '@/components/layout/month-picker';
import { BatchPurchaseForm } from '@/components/forms/batch-purchase-form';
import { EntityForm } from '@/components/forms/entity-form';
import { Badge, Card, EmptyState, SectionTitle } from '@/components/ui/kit';
import { GhostSubmitButton } from '@/components/ui/submit-button';
import {
  deleteTransactionAction,
  updateTransactionAction,
} from '@/lib/actions/transactions';
import { listCards } from '@/lib/data/cards';
import { listInstallments, listTransactions } from '@/lib/data/transactions';
import { formatBRL, formatMonthLabel } from '@/lib/format';
import { resolveMonth } from '@/lib/month-context';
import type { Installment } from '@/lib/types';

import { installmentRange, transactionFields } from './transaction-fields';

const CATEGORY_LABEL: Record<string, string> = {
  avista: 'À vista',
  aprazo: 'À prazo',
};

export default async function ComprasPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
  const params = await searchParams;
  const reference = await resolveMonth(params);

  const [allTransactions, cards, allInstallments] = await Promise.all([
    listTransactions(),
    listCards(),
    listInstallments(),
  ]);

  const byTransaction = new Map<string, Installment[]>();
  const monthTransactionIds = new Set<string>();

  for (const installment of allInstallments) {
    const list = byTransaction.get(installment.transaction_id) ?? [];
    list.push(installment);
    byTransaction.set(installment.transaction_id, list);

    if (
      installment.reference_year === reference.year &&
      installment.reference_month === reference.month
    ) {
      monthTransactionIds.add(installment.transaction_id);
    }
  }

  for (const list of byTransaction.values()) {
    list.sort((a, b) => a.installment_number - b.installment_number);
  }

  const cardName = new Map(cards.map((card) => [card.id, card.name] as const));
  const transactions = allTransactions.filter((item) => monthTransactionIds.has(item.id));
  const monthLabel = formatMonthLabel(reference).toLowerCase();

  return (
    <div className="space-y-4">
      <AppHeader
        title="Compras"
        subtitle={`Compras lançadas em ${monthLabel} — à vista ou parceladas`}
      >
        <MonthPicker reference={reference} basePath="/compras" />
      </AppHeader>

      <Card>
        <SectionTitle
          title="Nova compra"
          description="Escolha o cartão, informe o valor da parcela e a quantidade — dá para lançar várias compras de uma vez"
        />
        <BatchPurchaseForm cards={cards} initialMonth={reference} />
      </Card>

      <Card>
        <SectionTitle
          title={`Compras de ${monthLabel}`}
          description={`${transactions.length} compra(s) lançada(s) neste mês`}
        />

        {transactions.length === 0 ? (
          <EmptyState
            title={`Nenhuma compra em ${monthLabel}`}
            description="Use o seletor de mês para ver outros meses ou cadastre uma compra acima."
          />
        ) : (
          <ul className="space-y-2">
            {transactions.map((transaction) => {
              const list = byTransaction.get(transaction.id) ?? [];
              const paid = list.filter((item) => item.is_paid).length;

              return (
                <li key={transaction.id} className="rounded-xl border border-line p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                        {transaction.description}
                        <Badge tone="brand">
                          {CATEGORY_LABEL[transaction.category] ?? transaction.category}
                        </Badge>
                        {transaction.is_subscription ? (
                          <Badge tone="warning">assinatura</Badge>
                        ) : null}
                      </p>
                      <p className="text-[11px] text-ink-muted">
                        {transaction.card_id
                          ? (cardName.get(transaction.card_id) ?? 'Cartão')
                          : 'Sem cartão'}{' '}
                        ·{' '}
                        {transaction.installments_count > 1
                          ? `${transaction.installments_count}x`
                          : 'à vista'}{' '}
                        · {installmentRange(list)} · {paid}/{list.length} pagas
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="money text-sm font-semibold text-ink">
                        {formatBRL(transaction.total_amount)}
                      </span>
                      <form action={deleteTransactionAction}>
                        <input type="hidden" name="id" value={transaction.id} />
                        <GhostSubmitButton className="text-negative">excluir</GhostSubmitButton>
                      </form>
                    </div>
                  </div>

                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] font-semibold text-brand-700">
                      Editar / recalcular parcelas
                    </summary>
                    <div className="mt-3">
                      <EntityForm
                        action={updateTransactionAction}
                        fields={transactionFields(cards, transaction)}
                        id={transaction.id}
                        submitLabel="Salvar compra"
                        extra={
                          <label className="flex items-start gap-2 text-xs text-ink-muted">
                            <input
                              type="checkbox"
                              name="regenerate"
                              className="mt-0.5 size-4 rounded border-line text-brand-700"
                            />
                            Recalcular as parcelas com os novos valores (apaga ajustes individuais)
                          </label>
                        }
                      />
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
