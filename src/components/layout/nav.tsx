import {
  CalendarRange,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Receipt,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';

import { LpMark, LpWordmark } from '@/components/brand/logo';
import { ThemeSelect } from '@/components/ui/theme-select';
import { signOutAction } from '@/lib/actions/auth';
import type { Theme } from '@/lib/theme';

const NAV_ITEMS = [
  { href: '/mes', label: 'Mês', icon: CalendarRange },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/compras', label: 'Compras', icon: Receipt },
  { href: '/cartoes', label: 'Cartões', icon: CreditCard },
  { href: '/contas-fixas', label: 'Contas fixas', icon: Wallet },
  { href: '/ganhos', label: 'Ganhos', icon: TrendingUp },
  { href: '/debitos', label: 'Folha', icon: Receipt },
] as const;

export function SideNav({ theme }: { theme: Theme }) {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-line bg-surface px-3 py-4 md:block">
      <div className="mb-6 px-2">
        <LpWordmark />
      </div>

      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-brand-50 hover:text-brand-800"
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 space-y-2 px-1">
        <div className="space-y-1">
          <span className="px-1 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
            Tema
          </span>
          <ThemeSelect initialTheme={theme} />
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-negative-soft hover:text-negative"
          >
            <LogOut className="size-4" />
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}

/** Barra superior exibida apenas no mobile (logo + tema). */
export function MobileTopBar({ theme }: { theme: Theme }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 md:hidden">
      <div className="flex items-center gap-2">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-ink text-surface">
          <LpMark className="size-5" />
        </span>
        <span className="text-base font-semibold tracking-tight text-ink">LPFIN</span>
      </div>
      <ThemeSelect initialTheme={theme} className="w-28" />
    </div>
  );
}

export function MobileNav() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex flex-col items-center gap-1 px-1 py-2 text-[10px] font-medium text-ink-muted transition hover:text-brand-700"
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AppHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-xs text-ink-muted sm:text-sm">{subtitle}</p> : null}
      </div>
      {children}
    </header>
  );
}
