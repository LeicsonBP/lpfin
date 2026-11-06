/**
 * Marca LPFIN — monograma geométrico "LP" desenhado do zero:
 * o "L" aberto embaixo e o "P" com haste longa e bojo circular.
 * Usa `currentColor`, então funciona nos temas claro e escuro.
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
      strokeWidth={5.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>{title}</title>
      {/* L */}
      <path d="M21 15v30.5h14" />
      {/* P — haste com descendente */}
      <path d="M42 15v40" />
      {/* P — bojo */}
      <path d="M42 15.5h6.8a8.6 8.6 0 0 1 0 17.2H42" />
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
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="inline-flex size-9 items-center justify-center rounded-xl bg-ink text-surface">
        <LpMark className="size-6" />
      </span>
      {compact ? null : (
        <span className="leading-tight">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-700">
            Controle financeiro
          </span>
          <span className="block text-lg font-semibold tracking-tight text-ink">LPFIN</span>
        </span>
      )}
    </div>
  );
}

