const steps = [
  'Setup do projeto (Next.js 16 + Tailwind) — concluído',
  'Banco de dados (Supabase: schema + RLS)',
  'Autenticação (Google + e-mail/senha)',
  'Cadastros e motor de parcelamento',
  'Visão mensal com balanço',
  'Dashboard e previsão futura',
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center gap-6 p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">
          Controle Financeiro Pessoal
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">LPFIN</h1>
        <p className="text-sm text-ink-muted">
          Estrutura inicial criada. A visão mensal será publicada em{' '}
          <code className="rounded bg-surface px-1 py-0.5 text-ink">/mes</code> na
          etapa de autenticação.
        </p>
      </header>

      <ul className="space-y-2 rounded-2xl border border-line bg-surface p-4 text-sm shadow-sm">
        {steps.map((step) => (
          <li key={step} className="flex items-start gap-2">
            <span aria-hidden className="mt-1 size-1.5 shrink-0 rounded-full bg-brand-600" />
            <span>{step}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
