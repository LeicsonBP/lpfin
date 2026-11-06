import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

export const inputClass =
  'w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink shadow-xs outline-none transition placeholder:text-ink-muted/60 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60';

export function Card({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={clsx(
        'glass-card rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5',
        className,
      )}
      {...props}
    />
  );
}

export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-ink-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

const badgeTones = {
  neutral: 'bg-surface-muted text-ink-muted',
  positive: 'bg-positive-soft text-positive',
  negative: 'bg-negative-soft text-negative',
  warning: 'bg-warning-soft text-warning',
  brand: 'bg-brand-50 text-brand-700',
} as const;

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: keyof typeof badgeTones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line px-4 py-6 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {description ? <p className="mt-1 text-xs text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = 'neutral',
  flat = false,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'positive' | 'negative';
  /** dentro de um card que já é de vidro: evita desfoque empilhado */
  flat?: boolean;
}) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-line px-3 py-2.5',
        flat ? 'bg-surface/70' : 'glass-card bg-surface',
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p
        className={clsx(
          'money mt-1 text-lg font-semibold',
          tone === 'positive' && 'text-positive',
          tone === 'negative' && 'text-negative',
          tone === 'neutral' && 'text-ink',
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('space-y-1', className)}>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-ink-muted">
        {label}
      </label>
      {children}
      {error ? <p className="text-[11px] font-medium text-negative">{error}</p> : null}
      {!error && hint ? <p className="text-[11px] text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={clsx(inputClass, className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative w-full">
      <select
        className={clsx(inputClass, 'appearance-none pr-9', className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
      />
    </div>
  );
}

/** Campo de valor em reais (aceita 1.234,56). */
export function MoneyInput({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type="text"
      inputMode="decimal"
      placeholder="0,00"
      autoComplete="off"
      className={clsx(inputClass, 'money text-right', className)}
      {...props}
    />
  );
}
