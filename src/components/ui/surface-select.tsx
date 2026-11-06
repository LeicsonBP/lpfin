'use client';

import { clsx } from 'clsx';
import { Check, Layers, Sparkles } from 'lucide-react';
import { useState, useTransition } from 'react';

import { setSurfaceStyleAction } from '@/lib/actions/settings';
import { SURFACE_OPTIONS, type SurfaceStyle } from '@/lib/surface';

const ICONS: Record<SurfaceStyle, typeof Layers> = {
  solid: Layers,
  glass: Sparkles,
};

/**
 * Seletor do estilo dos cards (Sólido / Vidro).
 * Aplica na hora em <html data-surface> e salva na conta do usuário.
 */
export function SurfaceSelect({ initial }: { initial: SurfaceStyle }) {
  const [current, setCurrent] = useState<SurfaceStyle>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(value: SurfaceStyle) {
    if (value === current) return;

    const previous = current;
    const root = document.documentElement;

    setCurrent(value);
    setError(null);
    root.setAttribute('data-surface', value);

    startTransition(async () => {
      const result = await setSurfaceStyleAction(value);

      if (!result.ok) {
        setCurrent(previous);
        setError(result.error);
        root.setAttribute('data-surface', previous);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        {SURFACE_OPTIONS.map((option) => {
          const Icon = ICONS[option.value];
          const active = option.value === current;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => choose(option.value)}
              aria-pressed={active}
              disabled={pending}
              className={clsx(
                'flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition disabled:opacity-70',
                active
                  ? 'border-brand-500 bg-brand-50/70 shadow-xs'
                  : 'border-line hover:border-brand-400',
              )}
            >
              <span
                className={clsx(
                  'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg',
                  active ? 'bg-brand-100 text-brand-800' : 'bg-surface-muted text-ink-muted',
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  {option.label}
                  {active ? <Check className="size-3.5 text-brand-700" /> : null}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-ink-muted">
                  {option.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {error ? (
        <p className="text-[11px] font-medium text-negative">{error}</p>
      ) : (
        <p className="text-[11px] text-ink-muted">
          {current === 'glass'
            ? 'Vidro ativo: cards translúcidos com desfoque suave. Se o sistema pedir menos transparência, os cards voltam a ser sólidos.'
            : 'Sólido ativo: máxima legibilidade dos valores.'}
        </p>
      )}
    </div>
  );
}
