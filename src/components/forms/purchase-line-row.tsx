'use client';

import { Trash2 } from 'lucide-react';

import { Field, MoneyInput } from '@/components/ui/kit';
import { formatBRL } from '@/lib/format';
import { parseMoneyInput } from '@/lib/money';

export interface PurchaseLineDraft {
  key: number;
  description: string;
  installment_amount: string;
  installments_count: number;
}

/** Uma linha do cadastro em lote (valor da parcela × quantidade). */
export function PurchaseLineRow({
  line,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  line: PurchaseLineDraft;
  index: number;
  onChange: (key: number, patch: Partial<PurchaseLineDraft>) => void;
  onRemove: (key: number) => void;
  canRemove: boolean;
}) {
  const parsed = parseMoneyInput(line.installment_amount);
  const total = (Number.isFinite(parsed) ? parsed : 0) * (line.installments_count || 1);

  return (
    <div className="grid grid-cols-1 gap-2 rounded-xl border border-line p-3 sm:grid-cols-12 sm:items-end">
      <div className="sm:col-span-6">
        <Field label={`Compra ${index + 1}`} htmlFor={`desc-${line.key}`}>
          <input
            id={`desc-${line.key}`}
            value={line.description}
            onChange={(event) => onChange(line.key, { description: event.target.value })}
            placeholder="Ex.: Celular, mercado, dentista"
            className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand-500"
          />
        </Field>
      </div>

      <div className="sm:col-span-3">
        <Field label="Valor da parcela" htmlFor={`amount-${line.key}`}>
          <MoneyInput
            id={`amount-${line.key}`}
            value={line.installment_amount}
            onChange={(event) => onChange(line.key, { installment_amount: event.target.value })}
          />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="Parcelas" htmlFor={`count-${line.key}`}>
          <input
            id={`count-${line.key}`}
            type="number"
            min={1}
            max={120}
            value={line.installments_count}
            onChange={(event) =>
              onChange(line.key, { installments_count: Number(event.target.value) })
            }
            className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand-500"
          />
        </Field>
      </div>

      <div className="flex justify-end sm:col-span-1">
        <button
          type="button"
          onClick={() => onRemove(line.key)}
          disabled={!canRemove}
          aria-label="Remover compra"
          className="rounded-lg p-2 text-ink-muted transition hover:bg-negative-soft hover:text-negative disabled:opacity-40"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <p className="money text-[11px] text-ink-muted sm:col-span-12">
        Total desta compra: {formatBRL(total)} ·{' '}
        {line.installments_count > 1 ? 'à prazo' : 'à vista'}
      </p>
    </div>
  );
}
