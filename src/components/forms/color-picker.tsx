'use client';

import { Palette } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { ACCENT_PALETTE, CARD_PALETTE } from '@/lib/color';

export type ColorPaletteKind = 'card' | 'accent';

/** Seletor de cor: botão abre um card com a paleta (e hexadecimal, no caso de cartão). */
export function ColorPicker({
  name,
  defaultValue = '#0e6855',
  palette = 'card',
}: {
  name: string;
  defaultValue?: string;
  palette?: ColorPaletteKind;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isAccent = palette === 'accent';
  const swatches = isAccent
    ? ACCENT_PALETTE
    : CARD_PALETTE.map((color) => ({ value: color, label: color }));

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

  const selectedLabel = swatches.find((item) => item.value === value.toLowerCase())?.label;

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={value} />

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink transition hover:border-brand-400"
      >
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="size-5 rounded-full border border-line"
            style={{ backgroundColor: value }}
          />
          <span className="text-xs font-medium">{selectedLabel ?? 'Personalizada'}</span>
          <span className="font-mono text-[11px] uppercase text-ink-muted">{value}</span>
        </span>
        <Palette className="size-4 text-ink-muted" />
      </button>

      {open ? (
        <div className="glass-pop absolute left-0 top-12 z-40 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-line bg-surface p-3 shadow-xl">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            {isAccent ? 'Cores do tema' : 'Cores'}
          </p>

          <div
            className={
              isAccent ? 'grid grid-cols-5 gap-2' : 'grid grid-cols-10 gap-1'
            }
          >
            {swatches.map((swatch) => {
              const selected = value.toLowerCase() === swatch.value.toLowerCase();
              return (
                <button
                  key={swatch.value}
                  type="button"
                  onClick={() => setValue(swatch.value)}
                  title={swatch.label}
                  aria-label={`Selecionar ${swatch.label}`}
                  aria-pressed={selected}
                  style={{ backgroundColor: swatch.value }}
                  className={
                    selected
                      ? 'aspect-square rounded-full ring-2 ring-brand-600 ring-offset-2 ring-offset-surface'
                      : 'aspect-square rounded-full border border-line transition hover:scale-110'
                  }
                />
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2">
            {isAccent ? (
              <span className="text-[11px] text-ink-muted">{selectedLabel ?? 'Personalizada'}</span>
            ) : (
              <input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                maxLength={7}
                aria-label="Cor personalizada em hexadecimal"
                className="w-24 rounded-lg border border-line bg-surface px-2 py-1 font-mono text-xs uppercase text-ink outline-none focus:border-brand-400"
              />
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-on-primary"
            >
              Usar esta cor
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

