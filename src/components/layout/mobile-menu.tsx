'use client';

import { LogOut, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { ThemeSelect } from '@/components/ui/theme-select';
import { signOutAction } from '@/lib/actions/auth';
import type { Theme } from '@/lib/theme';

import { MOBILE_MENU_ITEMS } from './nav-items';

/**
 * Menu do canto superior direito (apenas mobile): tema, telas que não cabem na
 * barra inferior e a opção de sair.
 */
export function MobileMenu({ theme }: { theme: Theme }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        className="inline-flex size-9 items-center justify-center rounded-xl border border-line bg-surface text-ink-muted transition hover:border-brand-400 hover:text-brand-700"
      >
        {open ? <X className="size-4" /> : <Menu className="size-4" />}
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-40 w-60 rounded-2xl border border-line bg-surface p-3 shadow-xl">
          <div className="space-y-1">
            <span className="block px-1 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
              Tema
            </span>
            <ThemeSelect initialTheme={theme} />
          </div>

          {MOBILE_MENU_ITEMS.length > 0 ? (
            <nav className="mt-3 space-y-1 border-t border-line pt-2">
              {MOBILE_MENU_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-ink-muted transition hover:bg-brand-50 hover:text-brand-800"
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}

          <form action={signOutAction} className="mt-2 border-t border-line pt-2">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-ink-muted transition hover:bg-negative-soft hover:text-negative"
            >
              <LogOut className="size-4" />
              Sair
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
