import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 p-6">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-700">404</p>
      <h1 className="text-xl font-semibold tracking-tight text-ink">Página não encontrada</h1>
      <p className="text-sm text-ink-muted">
        O endereço acessado não existe ou foi movido.
      </p>
      <Link
        href="/mes"
        className="w-fit rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-hover"
      >
        Voltar para o mês
      </Link>
    </div>
  );
}
