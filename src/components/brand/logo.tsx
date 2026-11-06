import {
  LP_LOGO_PATHS,
  LP_LOGO_TRANSFORM,
  LP_LOGO_VIEWBOX,
} from './lp-logo-paths';

/**
 * Logotipo LP — usa a arte original (`lp-logo.svg`, extraída por
 * `scripts/build-logo.mjs`). `fill="currentColor"` faz o logo alternar entre
 * preto e branco conforme o tema.
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
      viewBox={LP_LOGO_VIEWBOX}
      role="img"
      aria-label={title}
      className={className}
      fill="currentColor"
    >
      <title>{title}</title>
      <g transform={LP_LOGO_TRANSFORM}>
        {LP_LOGO_PATHS.map((path, index) => (
          <path key={index} d={path} />
        ))}
      </g>
    </svg>
  );
}

/** Logo + nome do app, para navbar/login (sem fundo — a cor segue o tema). */
export function LpWordmark({
  compact = false,
  className = '',
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LpMark className="h-8 w-auto text-ink" />
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


