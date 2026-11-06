'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { addMonths, currentMonth, isSameMonth } from '@/lib/finance';
import { formatMonthLabel } from '@/lib/format';
import type { MonthRef } from '@/lib/types';

export function MonthSelector({
  reference,
  basePath = '/mes',
}: {
  reference: MonthRef;
  basePath?: string;
}) {
  const router = useRouter();

  function goTo(target: MonthRef) {
    router.push(`${basePath}?ano=${target.year}&mes=${target.month}`);
  }

  const isCurrent = isSameMonth(reference, currentMonth());

  return (
    <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
      <button
        type="button"
        aria-label="Mês anterior"
        onClick={() => goTo(addMonths(reference, -1))}
        className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" />
      </button>

      <button
        type="button"
        onClick={() => goTo(currentMonth())}
        title="Ir para o mês atual"
        className="min-w-36 px-2 text-center text-sm font-semibold capitalize text-ink"
      >
        {formatMonthLabel(reference).toLowerCase()}
        {isCurrent ? <span className="ml-1 text-[10px] text-brand-700">• hoje</span> : null}
      </button>

      <button
        type="button"
        aria-label="Próximo mês"
        onClick={() => goTo(addMonths(reference, 1))}
        className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-muted hover:text-ink"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
