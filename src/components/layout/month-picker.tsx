'use client';

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { addMonths, currentMonth, isSameMonth } from '@/lib/finance';
import { formatMonthLabel } from '@/lib/format';
import type { MonthRef } from '@/lib/types';

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * Seletor de competência: setas para navegar mês a mês e um popover para
 * escolher diretamente mês/ano.
 */
export function MonthPicker({
  reference,
  basePath = '/mes',
}: {
  reference: MonthRef;
  basePath?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  /** ano exibido no popover (null = segue o mês de referência) */
  const [yearOverride, setYearOverride] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const year = yearOverride ?? reference.year;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  function goTo(target: MonthRef) {
    setOpen(false);
    setYearOverride(null);
    router.push(`${basePath}?ano=${target.year}&mes=${target.month}`);
  }

  const isCurrent = isSameMonth(reference, currentMonth());

  return (
    <div
      ref={containerRef}
      className="relative flex items-center gap-1 rounded-xl border border-line bg-surface p-1"
    >
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
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        title="Escolher mês e ano"
        className="flex min-w-36 items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold capitalize text-ink transition hover:bg-surface-muted"
      >
        <CalendarDays className="size-3.5 text-brand-700" />
        {formatMonthLabel(reference).toLowerCase()}
        {isCurrent ? <span className="text-[10px] text-brand-700">• hoje</span> : null}
      </button>

      <button
        type="button"
        aria-label="Próximo mês"
        onClick={() => goTo(addMonths(reference, 1))}
        className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-muted hover:text-ink"
      >
        <ChevronRight className="size-4" />
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-40 w-72 rounded-2xl border border-line bg-surface p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Ano anterior"
              onClick={() => setYearOverride(year - 1)}
              className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-muted hover:text-ink"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-semibold text-ink">{year}</span>
            <button
              type="button"
              aria-label="Próximo ano"
              onClick={() => setYearOverride(year + 1)}
              className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-muted hover:text-ink"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {MONTHS_SHORT.map((label, index) => {
              const month = index + 1;
              const selected = reference.year === year && reference.month === month;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => goTo({ year, month })}
                  className={
                    selected
                      ? 'rounded-lg bg-primary px-2 py-1.5 text-xs font-semibold text-on-primary'
                      : 'rounded-lg px-2 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-surface-muted hover:text-ink'
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setYearOverride(null);
              goTo(currentMonth());
            }}
            className="mt-3 w-full rounded-lg border border-line px-2 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-primary-soft"
          >
            Ir para o mês atual
          </button>
        </div>
      ) : null}
    </div>
  );
}
