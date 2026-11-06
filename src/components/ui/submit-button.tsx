'use client';

import { useFormStatus } from 'react-dom';

import { clsx } from 'clsx';

type ButtonVariant = 'primary' | 'outline' | 'ghost';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  outline: 'border border-line bg-surface text-ink hover:bg-surface-muted',
  ghost: 'border border-line text-ink-muted hover:border-brand-400 hover:text-brand-700',
};

export function SubmitButton({
  children,
  className,
  pendingLabel = 'Salvando...',
  variant = 'primary',
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
  variant?: ButtonVariant;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70',
        VARIANTS[variant],
        className,
      )}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}


export function GhostSubmitButton({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      title={title}
      disabled={pending}
      className={clsx(
        'inline-flex items-center justify-center rounded-lg border border-line px-2 py-1 text-[11px] font-semibold text-ink-muted transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-50',
        className,
      )}
    >
      {pending ? '...' : children}
    </button>
  );
}
