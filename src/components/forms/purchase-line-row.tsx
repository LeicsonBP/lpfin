'use client';

import { Trash2 } from 'lucide-react';

import { Field, MoneyInput, Select } from '@/components/ui/kit';
import { addMonths } from '@/lib/finance';
import { formatBRL, formatMonthLabel } from '@/lib/format';
import { parseMoneyInput } from '@/lib/money';
import type { MonthRef } from '@/lib/types';

export type PurchaseKind = 'cash' | 'installment';

export interface PurchaseLineDraft {
  key: number;
  description: string;
  kind: PurchaseKind;
  /** valor da compra (ou de cada parcela, quando parcelada) */
  amount: string;
  /** guardados como texto para permitir campo vazio enquanto digita */
  installments_count: string;
  current_installment: string;
}

/** Lê a quantidade digitada (vazio/inválido vira 1). */
export function countValue(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/** Uma compra do formulário (à vista ou parcelada). */
export function PurchaseLineRow({
  line,
  index,
  reference,
  onChange,
  onRemove,
  canRemove,
}: {
  line: PurchaseLineDraft;
  index: number;
  /** mês de referência (competência da compra / da parcela atual) */
  reference: MonthRef;
  onChange: (key: number, patch: Partial<PurchaseLineDraft>) => void;
  onRemove: (key: number) => void;
  canRemove: boolean;
}) {
  const parsedAmount = parseMoneyInput(line.amount);
  const amount = Number.isFinite(parsedAmount) ? parsedAmount : 0;
  const isInstallment = line.kind === 'installment';
  const total = countValue(line.installments_count);
  const current = Math.min(Math.max(countValue(line.current_installment), 1), total);
  const firstMonth = addMonths(reference, -(current - 1));
  const paidCount = current - 1;
  const lineTotal = amount * (isInstallment ? total : 1);

  return (
    <div className="space-y-2 rounded-xl border border-line p-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
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

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Field label="Tipo" htmlFor={`kind-${line.key}`}>
          <Select
            id={`kind-${line.key}`}
            value={line.kind}
            onChange={(event) =>
              onChange(line.key, {
                kind: event.target.value === 'installment' ? 'installment' : 'cash',
              })
            }
          >
            <option value="cash">À vista</option>
            <option value="installment">Parcelada</option>
          </Select>
        </Field>

        <Field
          label="Valor"
          htmlFor={`amount-${line.key}`}
          hint={isInstallment ? 'Valor de cada parcela' : 'Valor da compra'}
        >
          <MoneyInput
            id={`amount-${line.key}`}
            value={line.amount}
            onChange={(event) => onChange(line.key, { amount: event.target.value })}
          />
        </Field>
      </div>

      {isInstallment ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Field label="Nº de parcelas" htmlFor={`count-${line.key}`}>
            <input
              id={`count-${line.key}`}
              type="text"
              inputMode="numeric"
              value={line.installments_count}
              onChange={(event) =>
                onChange(line.key, { installments_count: event.target.value.replace(/\D/g, '') })
              }
              placeholder="1"
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand-500"
            />
          </Field>

          <Field
            label="Parcela atual"
            htmlFor={`current-${line.key}`}
            hint={`de ${total}`}
          >
            <input
              id={`current-${line.key}`}
              type="text"
              inputMode="numeric"
              value={line.current_installment}
              onChange={(event) =>
                onChange(line.key, {
                  current_installment: event.target.value.replace(/\D/g, ''),
                })
              }
              placeholder="1"
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand-500"
            />
          </Field>
        </div>
      ) : null}

      <p className="money text-[11px] text-ink-muted">
        {isInstallment
          ? `Total: ${formatBRL(lineTotal)} em ${total}x · 1ª em ${formatMonthLabel(firstMonth).toLowerCase()}${
              paidCount > 0 ? ` · ${paidCount} parcela(s) já paga(s)` : ''
            }`
          : `Total: ${formatBRL(lineTotal)} · compra à vista`}
      </p>
    </div>
  );
}
