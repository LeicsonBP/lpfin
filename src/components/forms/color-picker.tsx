'use client';

import { useState } from 'react';

/** Paleta de cores inspirada no seletor de referência (cinzas + tons por matiz). */
const PALETTE = [
  // cinzas
  '#000000', '#1f1f1f', '#3d3d3d', '#5c5c5c', '#787878', '#9a9a9a', '#bbbbbb', '#d7d7d7', '#e9e9e9', '#ffffff',
  // vivas
  '#7a0d12', '#d32f2f', '#f57c00', '#fbc02d', '#4caf50', '#00bcd4', '#2962ff', '#304ffe', '#8e24aa', '#d500f9',
  // pastéis
  '#f8d7da', '#ffcdd2', '#ffe0b2', '#fff9c4', '#d7f5d3', '#c8f0ef', '#cfe4fb', '#d6dcfb', '#e2d4f5', '#f6d5f0',
  // suaves
  '#e8a2a5', '#ef9a9a', '#ffc080', '#fff176', '#a5d6a7', '#80deea', '#90caf9', '#9fa8da', '#ce93d8', '#f48fb1',
  // médias
  '#c76a6d', '#e57373', '#ffb74d', '#ffd54f', '#81c784', '#4dd0e1', '#64b5f6', '#7986cb', '#ba68c8', '#f06292',
  // profundas
  '#a63d40', '#c62828', '#e65100', '#f9a825', '#2e7d32', '#00838f', '#1565c0', '#283593', '#6a1b9a', '#ad1457',
  // escuras
  '#5d1a1c', '#7b1d1d', '#8a2c00', '#7a5a00', '#1b5e20', '#004d52', '#0d3c78', '#1a237e', '#4a148c', '#880e4f',
];

/** Seletor de cor em grade de amostras + campo para cor personalizada. */
export function ColorPicker({
  name,
  defaultValue = '#0e6855',
}: {
  name: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={value} />

      <div className="grid grid-cols-10 gap-1">
        {PALETTE.map((color) => {
          const selected = value.toLowerCase() === color.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              onClick={() => setValue(color)}
              title={color}
              aria-label={`Selecionar cor ${color}`}
              aria-pressed={selected}
              style={{ backgroundColor: color }}
              className={
                selected
                  ? 'size-6 rounded-full ring-2 ring-brand-600 ring-offset-2 ring-offset-surface'
                  : 'size-6 rounded-full border border-line transition hover:scale-110'
              }
            />
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="size-7 shrink-0 rounded-full border border-line"
          style={{ backgroundColor: value }}
        />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={7}
          aria-label="Cor personalizada em hexadecimal"
          className="w-28 rounded-lg border border-line bg-surface px-2 py-1 text-xs uppercase text-ink outline-none focus:border-brand-400"
        />
        <span className="text-[11px] text-ink-muted">ou escolha na grade</span>
      </div>
    </div>
  );
}
