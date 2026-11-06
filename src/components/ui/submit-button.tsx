'use client';

import { useFormStatus } from 'react-dom';

import { clsx } from 'clsx';

export function SubmitButton({
  children,
  className,
  pendingLabel = 'Salvando...',
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70',
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
