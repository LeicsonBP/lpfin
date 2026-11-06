import type { Metadata } from 'next';

import { LoginForm } from '@/components/auth/login-form';
import { LpWordmark } from '@/components/brand/logo';
import { ThemeSelect } from '@/components/ui/theme-select';
import { getTheme } from '@/lib/theme';

export const metadata: Metadata = {
  title: 'Entrar — LPFIN',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const params = await searchParams;
  const theme = await getTheme();

  return (
    <main className="app-shell mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 p-6">
      <header className="flex items-start justify-between gap-3">
        <LpWordmark />
        <ThemeSelect initialTheme={theme} className="w-28" />
      </header>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Bem-vindo de volta</h1>
        <p className="text-sm text-ink-muted">
          Entre para acompanhar o mês, os parcelamentos e a projeção futura.
        </p>
      </div>

      {params.erro ? (
        <p className="rounded-xl bg-negative-soft px-3 py-2 text-xs font-medium text-negative">
          {params.erro}
        </p>
      ) : null}

      <div className="glass-card rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <LoginForm />
      </div>
    </main>
  );
}

