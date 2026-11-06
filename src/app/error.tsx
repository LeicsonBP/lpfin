'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registra no console do navegador para facilitar o diagnóstico
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-xl font-semibold tracking-tight text-ink">Algo deu errado</h1>
      <p className="text-sm text-ink-muted">
        Não foi possível carregar esta tela. Você pode tentar novamente ou voltar para o início.
      </p>
      {error.digest ? (
        <p className="rounded-xl bg-surface px-3 py-2 font-mono text-[11px] text-ink-muted">
          código: {error.digest}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-hover"
        >
          Tentar novamente
        </button>
        <Link
          href="/mes"
          className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface"
        >
          Ir para o mês
        </Link>
      </div>
    </div>
  );
}
