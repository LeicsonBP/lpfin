import { Card, EmptyState, SectionTitle } from '@/components/ui/kit';
import { GhostSubmitButton } from '@/components/ui/submit-button';
import { toggleCardPaymentAction } from '@/lib/actions/cards';
import { formatBRL } from '@/lib/format';
import { groupByCard } from '@/lib/finance';
import type {
  Card as CardModel,
  CardPayment,
  Installment,
  MonthRef,
  Transaction,
} from '@/lib/types';

import { InstallmentRow } from './installment-row';

/**
 * Bloco "Cartões" da visão mensal: uma coluna por cartão, com as compras
 * ativas no mês (parcelas) e o checkbox de fatura paga.
 */
export function CardsSection({
  cards,
  cardPayments,
  installments,
  transactions,
  reference,
  monthLabel,
}: {
  cards: CardModel[];
  cardPayments: CardPayment[];
  installments: Installment[];
  transactions: Transaction[];
  reference: MonthRef;
  monthLabel: string;
}) {
  const descriptionById = new Map(transactions.map((item) => [item.id, item.description] as const));
  const paymentByCard = new Map(cardPayments.map((item) => [item.card_id, item] as const));

  const byCard = new Map<string, Installment[]>();
  for (const installment of installments) {
    const key = installment.card_id ?? 'none';
    const list = byCard.get(key) ?? [];
    list.push(installment);
    byCard.set(key, list);
  }

  const totals = groupByCard(installments, cards).filter(
    (item) => item.cardId !== null || item.total > 0,
  );

  const activeCards = cards.filter(
    (card) => card.is_active || (byCard.get(card.id)?.length ?? 0) > 0,
  );

  return (
    <Card>
      <SectionTitle
        title="Cartões"
        description={`Compras ativas em ${monthLabel}`}
        action={
          <span className="money text-sm font-semibold text-ink">
            {formatBRL(totals.reduce((total, item) => total + item.total, 0))}
          </span>
        }
      />

      {totals.length === 0 ? (
        <EmptyState
          title="Nenhuma compra neste mês"
          description="Cadastre uma compra em Compras para gerar as parcelas automaticamente."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {activeCards.map((card) => {
            const list = byCard.get(card.id) ?? [];
            const total = list.reduce((sum, item) => sum + item.amount, 0);
            const usedPercent =
              card.credit_limit > 0 ? Math.min(100, (total / card.credit_limit) * 100) : 0;

            return (
              <div key={card.id} className="rounded-xl border border-line p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-ink">{card.name}</p>
                    <p className="text-[11px] text-ink-muted">
                      limite {formatBRL(card.credit_limit)} · fecha dia {card.closing_day} · vence
                      dia {card.due_day}
                    </p>
                  </div>
                  <p className="money text-sm font-semibold text-ink">{formatBRL(total)}</p>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-brand-600"
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-surface-muted px-2 py-1.5">
                  <span className="text-[11px] font-medium text-ink-muted">Fatura paga?</span>
                  <form action={toggleCardPaymentAction} className="flex items-center gap-1">
                    <input type="hidden" name="card_id" value={card.id} />
                    <input type="hidden" name="year" value={reference.year} />
                    <input type="hidden" name="month" value={reference.month} />
                    <input
                      type="hidden"
                      name="paid"
                      value={paymentByCard.get(card.id)?.is_paid ? 'false' : 'true'}
                    />
                    <GhostSubmitButton
                      className={
                        paymentByCard.get(card.id)?.is_paid
                          ? 'border-positive bg-positive-soft text-positive'
                          : ''
                      }
                    >
                      {paymentByCard.get(card.id)?.is_paid ? 'Sim' : 'Não'}
                    </GhostSubmitButton>
                  </form>
                </div>

                {list.length === 0 ? (
                  <p className="mt-3 text-[11px] text-ink-muted">Sem compras neste mês.</p>
                ) : (
                  <ul className="mt-2">
                    {list.map((installment) => (
                      <InstallmentRow
                        key={installment.id}
                        installment={installment}
                        description={descriptionById.get(installment.transaction_id) ?? 'Compra'}
                      />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}

          {(byCard.get('none')?.length ?? 0) > 0 ? (
            <div className="rounded-xl border border-dashed border-line p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-ink">Sem cartão</p>
                <p className="money text-sm font-semibold text-ink">
                  {formatBRL(
                    (byCard.get('none') ?? []).reduce((sum, item) => sum + item.amount, 0),
                  )}
                </p>
              </div>
              <ul className="mt-2">
                {(byCard.get('none') ?? []).map((installment) => (
                  <InstallmentRow
                    key={installment.id}
                    installment={installment}
                    description={descriptionById.get(installment.transaction_id) ?? 'Compra'}
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <p className="mt-3 text-[11px] text-ink-muted">
        Toque no valor de uma parcela para ajustá-la individualmente (sem alterar as demais).
      </p>
    </Card>
  );
}
