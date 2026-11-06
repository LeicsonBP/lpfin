'use client';

import { Moon, Sun } from 'lucide-react';

import { ChevronDown } from 'lucide-react';

import { THEME_COOKIE } from '@/lib/cookies';
import type { Theme } from '@/lib/theme';

const OPTIONS: { value: Theme | 'system'; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
];

/**
 * Caixa de seleção de tema (Claro / Escuro / Sistema).
 * Grava a escolha em cookie para o servidor já renderizar o tema correto.
 */
export function ThemeSelect({
  initialTheme,
  className = '',
}: {
  initialTheme: Theme;
  className?: string;
}) {
  function apply(value: string) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = value === 'dark' || (value === 'system' && prefersDark);

    document.documentElement.classList.toggle('dark', dark);

    document.cookie = `${THEME_COOKIE}=${
      value === 'system' ? (dark ? 'dark' : 'light') : value
    }; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-ink-muted">
        <Sun className="size-3.5 dark:hidden" />
        <Moon className="hidden size-3.5 dark:block" />
      </span>
      <select
        aria-label="Tema da interface"
        defaultValue={initialTheme}
        onChange={(event) => apply(event.target.value)}
        className="w-full appearance-none rounded-xl border border-line bg-surface py-1.5 pl-7 pr-7 text-xs font-medium text-ink-muted outline-none transition hover:border-brand-400 focus:border-brand-500"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted"
      />
    </div>
  );
}
