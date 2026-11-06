'use client';

import { Moon, Sun } from 'lucide-react';

const COOKIE_NAME = 'lpfin-theme';

/**
 * Alterna entre tema claro e escuro.
 * O tema é gravado em cookie (lido no servidor) para não haver "flash" de tema
 * ao navegar; o ícone exibido é decidido pela classe `.dark` no <html>.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const isDark = root.classList.toggle('dark');
    document.cookie = `${COOKIE_NAME}=${isDark ? 'dark' : 'light'}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Alternar entre tema claro e escuro"
      title="Alternar tema"
      className={`inline-flex size-9 items-center justify-center rounded-xl border border-line bg-surface text-ink-muted transition hover:border-brand-400 hover:text-brand-700 ${className}`}
    >
      <Moon className="size-4 dark:hidden" />
      <Sun className="hidden size-4 dark:block" />
    </button>
  );
}
