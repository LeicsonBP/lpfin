import { AppHeader } from '@/components/layout/nav';
import { EntityForm } from '@/components/forms/entity-form';
import { Badge, Card, EmptyState, SectionTitle } from '@/components/ui/kit';
import { GhostSubmitButton } from '@/components/ui/submit-button';
import {
  createTransactionAction,
  deleteTransactionAction,
  updateTransactionAction,
} from '@/lib/actions/transactions';
import { listCards } from '@/lib/data/cards';
import { listInstallments, listTransactions } from '@/lib/data/transactions';
import { formatBRL, formatDateBR } from '@/lib/format';
import type { Installment } from '@/lib/types';

import { installmentRange, transactionFields } from './transaction-fields';

export default async function ComprasPage() {
  const [transactions, cards, installments] = await Promise.all([
    listTransactions(),
    listCards(),
    listInstallments(),
  ]);

  const byTransaction = new Map<string, Installment[]>();
  for (const installment of installments) {
    const list = byTransaction.get(installment.transaction_id) ?? [];
    list.push(installment);
    byTransaction.set(installment.transaction_id, list);
  }
  for (const list of byTransaction.values()) {
    list.sort((a, b) => a.installment_number - b.installment_number);
  }

  const cardName = new Map(cards.map((card) => [card.id, card.name] as const));

  return (
    <div className="space-y-4">
      <AppHeader
        title="Compras"
        subtitle="Cada compra gera as parcelas automaticamente, mês a mês"
      />

      <Card>
        <SectionTitle
          title="Nova compra"
          description="O motor de parcelamento distribui o total em centavos e cria as parcelas"
        />
        <EntityForm
          action={createTransactionAction}
          fields={transactionFields(cards)}
          submitLabel="Salvar compra"
        />
      </Card>

      <Card>
        <SectionTitle title="Compras cadastradas" description={`${transactions.length} compra(s)`} />

        {transactions.length === 0 ? (
          <EmptyState
            title="Nenhuma compra cadastrada"
            description="Cadastre a primeira compra acima para ver as parcelas na visão mensal."
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
                        <Badge tone="brand">{transaction.category}</Badge>
                        {transaction.is_subscription ? (
                          <Badge tone="warning">assinatura</Badge>
                        ) : null}
                      </p>
                      <p className="text-[11px] text-ink-muted">
                        {transaction.card_id
                          ? (cardName.get(transaction.card_id) ?? 'Cartão')
                          : 'Sem cartão'}{' '}
                        · {formatDateBR(transaction.purchase_date)} · {transaction.installments_count}x
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
