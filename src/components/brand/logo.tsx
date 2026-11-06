/**
 * Monograma LP — traço caligráfico inspirado na arte de referência
 * (fundo preto, letras brancas). Usa `currentColor` para se adaptar ao tema.
 */
export function LpMark({
  className = 'size-9',
  title = 'LPFIN',
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={3.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>{title}</title>
      {/* L caligráfico: laço no topo e curva na base */}
      <path d="M27.5 13.5c5.2-2.6 8.6.3 7.1 4.9-1.9 5.8-7.6 10.4-9.9 16.4-1.9 4.9-.6 9.1 3.7 10.4 4.3 1.3 8-1.1 8.8-5.1" />
      {/* haste do P com descendente longo */}
      <path d="M31.5 12.5c-2.2 14.6-1.2 30.6 3.2 45.5" />
      {/* bojo do P */}
      <path d="M32.5 27.5c7.6-5.6 18.6-6.8 21.7.6 2.7 6.6-3.9 11.9-13.4 11.9" />
    </svg>
  );
}

/** Logo + nome do app, para navbar/login. */
export function LpWordmark({
  compact = false,
  className = '',
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="inline-flex size-9 items-center justify-center rounded-xl bg-ink text-surface">
        <LpMark className="size-7" />
      </span>
      {compact ? null : (
        <span className="leading-tight">
          <span className="block text-[10px] font-semibold uppercase tracking-widest text-brand-700">
            Controle financeiro
          </span>
          <span className="block text-lg font-semibold tracking-tight text-ink">LPFIN</span>
        </span>
      )}
    </div>
  );
}
