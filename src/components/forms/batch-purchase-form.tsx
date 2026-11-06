'use client';

import { Plus } from 'lucide-react';
import { useActionState, useState } from 'react';

import { SubmitButton } from '@/components/ui/submit-button';
import { Field, Select } from '@/components/ui/kit';
import { createPurchasesBatchAction } from '@/lib/actions/transactions';
import { currentMonth } from '@/lib/finance';
import { formatBRL, monthSelectOptions, yearSelectOptions } from '@/lib/format';
import { parseMoneyInput } from '@/lib/money';
import type { ActionResult, Card as CardModel } from '@/lib/types';

import { PurchaseLineRow, type PurchaseLineDraft } from './purchase-line-row';

const NOW = currentMonth();

/**
 * Cadastro em lote: escolhe UM cartão e lança várias compras de uma vez.
 * Cada compra é informada pelo valor da parcela e pela quantidade de parcelas.
 */
export function BatchPurchaseForm({ cards }: { cards: CardModel[] }) {
  const [cardId, setCardId] = useState<string>(cards[0]?.id ?? '');
  const [startMonth, setStartMonth] = useState(String(NOW.month));
  const [startYear, setStartYear] = useState(String(NOW.year));
  const [lines, setLines] = useState<PurchaseLineDraft[]>([
    { key: 1, description: '', installment_amount: '', installments_count: 1, current_installment: 1 },
  ]);
  const [state, formAction] = useActionState<ActionResult | undefined, FormData>(
    createPurchasesBatchAction,
    undefined,
  );

  function updateLine(key: number, patch: Partial<PurchaseLineDraft>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function addLine() {
    setLines((current) => [
      ...current,
      {
        key: Math.max(0, ...current.map((line) => line.key)) + 1,
        description: '',
        installment_amount: '',
        installments_count: 1,
        current_installment: 1,
      },
    ]);
  }

  function removeLine(key: number) {
    setLines((current) => (current.length === 1 ? current : current.filter((l) => l.key !== key)));
  }

  const payload = JSON.stringify({
    card_id: cardId,
    start_year: Number(startYear),
    start_month: Number(startMonth),
    lines: lines.map((line) => ({
      description: line.description,
      installment_amount: line.installment_amount,
      installments_count: Number(line.installments_count) || 1,
      current_installment: Number(line.current_installment) || 1,
    })),
  });

  const batchCents = lines.reduce((total, line) => {
    const value = parseMoneyInput(line.installment_amount);
    const amount = Number.isFinite(value) ? value : 0;
    return total + Math.round(amount * 100) * (Number(line.installments_count) || 1);
  }, 0);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="payload" value={payload} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Cartão" htmlFor="batch-card" hint="Um cartão por lote">
          <Select id="batch-card" value={cardId} onChange={(event) => setCardId(event.target.value)}>
            <option value="">Sem cartão</option>
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Mês da parcela" htmlFor="batch-month" hint="competência da parcela atual">
          <Select
            id="batch-month"
            value={startMonth}
            onChange={(event) => setStartMonth(event.target.value)}
          >
            {monthSelectOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Ano" htmlFor="batch-year">
          <Select
            id="batch-year"
            value={startYear}
            onChange={(event) => setStartYear(event.target.value)}
          >
            {yearSelectOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="space-y-2">
        {lines.map((line, index) => (
          <PurchaseLineRow
            key={line.key}
            line={line}
            index={index}
            reference={{ year: Number(startYear), month: Number(startMonth) }}
            onChange={updateLine}
            onRemove={removeLine}
            canRemove={lines.length > 1}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={addLine}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-primary-soft"
        >
          <Plus className="size-3.5" />
          Adicionar compra
        </button>

        <p className="money text-xs font-medium text-ink-muted">
          Total do lote: <span className="text-ink">{formatBRL(batchCents / 100)}</span>
        </p>
      </div>

      {state && !state.ok ? (
        <p className="rounded-xl bg-negative-soft px-3 py-2 text-xs font-medium text-negative">
          {state.error}
        </p>
      ) : null}

      {state && state.ok && state.message ? (
        <p className="rounded-xl bg-positive-soft px-3 py-2 text-xs font-medium text-positive">
          {state.message}
        </p>
      ) : null}

      <SubmitButton pendingLabel="Lançando...">Lançar compras</SubmitButton>
    </form>
  );
}
