'use client';

import { Pencil } from 'lucide-react';
import { useState, useTransition } from 'react';

import { Badge } from '@/components/ui/kit';
import { updateInstallmentAmountAction } from '@/lib/actions/installments';
import { formatBRLCompact, formatInstallmentLabel } from '@/lib/format';
import { isOverdue } from '@/lib/finance';
import type { Installment } from '@/lib/types';

export function InstallmentRow({
  installment,
  description,
  cardName,
}: {
  installment: Installment;
  description: string;
  cardName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(formatBRLCompact(installment.amount));
  const [pending, startTransition] = useTransition();
  const overdue = isOverdue(installment);

  function save() {
    if (value === formatBRLCompact(installment.amount)) {
      setEditing(false);
      return;
    }

    startTransition(async () => {
      const result = await updateInstallmentAmountAction(installment.id, value);
      if (result.ok) setEditing(false);
    });
  }

  return (
    <li className="flex items-center gap-2 border-t border-line py-2 first:border-t-0">
      <span className="w-12 shrink-0 text-[11px] font-semibold text-ink-muted">
        {formatInstallmentLabel(installment.installment_number, installment.installment_total)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink">{description}</p>
        <div className="flex items-center gap-1.5">
          {cardName ? <span className="text-[11px] text-ink-muted">{cardName}</span> : null}
          {installment.is_adjusted ? <Badge tone="warning">ajustada</Badge> : null}
          {overdue ? <Badge tone="negative">atrasada</Badge> : null}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {editing ? (
          <input
            autoFocus
            value={value}
            inputMode="decimal"
            onChange={(event) => setValue(event.target.value)}
            onBlur={save}
            onKeyDown={(event) => {
              if (event.key === 'Enter') save();
              if (event.key === 'Escape') setEditing(false);
            }}
            className="money w-24 rounded-lg border border-brand-400 px-2 py-1 text-right text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={pending}
            title="Ajustar valor desta parcela"
            className="money group inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-sm font-medium text-ink hover:bg-surface-muted disabled:opacity-60"
          >
            {formatBRLCompact(installment.amount)}
            <Pencil className="size-3 text-ink-muted opacity-0 transition group-hover:opacity-100" />
          </button>
        )}
      </div>
    </li>
  );
}
