'use client';

import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import { useState, useTransition } from 'react';

import { Badge } from '@/components/ui/kit';
import {
  toggleFixedBillEntryPaidAction,
  upsertFixedBillEntryAction,
} from '@/lib/actions/fixedBills';
import { formatBRLCompact } from '@/lib/format';
import { isOverdue } from '@/lib/finance';
import type { FixedBill, FixedBillEntry, MonthRef } from '@/lib/types';

/**
 * Linha da conta fixa no mês: o valor real é editável e é gravado em
 * `fixed_bills_entries` (uma linha por conta/mês).
 */
export function FixedBillRow({
  bill,
  entry,
  reference,
}: {
  bill: FixedBill;
  entry: FixedBillEntry | null;
  reference: MonthRef;
}) {
  const initial = entry ? formatBRLCompact(entry.amount) : formatBRLCompact(bill.base_value);
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const overdue = entry
    ? isOverdue(entry)
    : isOverdue({
        reference_year: reference.year,
        reference_month: reference.month,
        is_paid: false,
      });

  function save() {
    if (!dirty) return;

    startTransition(async () => {
      const result = await upsertFixedBillEntryAction(
        bill.id,
        reference.year,
        reference.month,
        value,
      );
      if (result.ok) {
        setDirty(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    });
  }

  return (
    <li className="flex items-center gap-2 border-t border-line py-2 first:border-t-0">
      <span className="w-12 shrink-0 text-[11px] font-semibold text-ink-muted">FIX</span>

      <div className="min-w-0 flex-1">
        <p className={clsx('truncate text-sm', entry?.is_paid ? 'text-ink-muted line-through' : 'text-ink')}>
          {bill.name}
        </p>
        <div className="flex items-center gap-1.5">
          {bill.due_day ? (
            <span className="text-[11px] text-ink-muted">vence dia {bill.due_day}</span>
          ) : null}
          {!entry ? <Badge tone="neutral">valor base</Badge> : null}
          {overdue ? <Badge tone="negative">atrasada</Badge> : null}
          {saved ? <Badge tone="positive">salvo</Badge> : null}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <input
          value={value}
          inputMode="decimal"
          onChange={(event) => {
            setValue(event.target.value);
            setDirty(true);
          }}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
          disabled={pending}
          aria-label={`Valor real de ${bill.name} no mês`}
          className={clsx(
            'money w-24 rounded-lg border px-2 py-1 text-right text-sm outline-none transition focus:ring-2 focus:ring-brand-500/20',
            dirty ? 'border-brand-400 bg-brand-50' : 'border-line',
          )}
        />

        {entry ? (
          <form action={toggleFixedBillEntryPaidAction}>
            <input type="hidden" name="id" value={entry.id} />
            <input type="hidden" name="paid" value={entry.is_paid ? 'false' : 'true'} />
            <button
              type="submit"
              title={entry.is_paid ? 'Marcar como pendente' : 'Marcar como pago'}
              className={clsx(
                'inline-flex size-7 items-center justify-center rounded-full border transition',
                entry.is_paid
                  ? 'border-positive bg-positive-soft text-positive'
                  : 'border-line text-ink-muted hover:border-brand-400 hover:text-brand-700',
              )}
            >
              <Check className="size-3.5" />
            </button>
          </form>
        ) : (
          <span className="inline-flex size-7 items-center justify-center rounded-full border border-dashed border-line text-ink-muted">
            <Check className="size-3.5 opacity-40" />
          </span>
        )}
      </div>
    </li>
  );
}
