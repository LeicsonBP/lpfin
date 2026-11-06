import type { Metadata } from 'next';

import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Entrar — LPFIN',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 p-6">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-700">
          Controle Financeiro Pessoal
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">LPFIN</h1>
        <p className="text-sm text-ink-muted">
          Entre para acompanhar o mês, os parcelamentos e a projeção futura.
        </p>
      </header>

      {params.erro ? (
        <p className="rounded-xl bg-negative-soft px-3 py-2 text-xs font-medium text-negative">
          {params.erro}
        </p>
      ) : null}

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <LoginForm />
      </div>
    </main>
  );
}
