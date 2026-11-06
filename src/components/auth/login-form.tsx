'use client';

import { useActionState, useState } from 'react';

import { SubmitButton } from '@/components/ui/submit-button';
import { Field, Input } from '@/components/ui/kit';
import { signInWithGoogleAction, signInWithPasswordAction, signUpWithPasswordAction } from '@/lib/actions/auth';
import type { ActionResult } from '@/lib/types';

export function LoginForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [state, formAction] = useActionState<ActionResult | undefined, FormData>(
    mode === 'signin' ? signInWithPasswordAction : signUpWithPasswordAction,
    undefined,
  );

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-3">
        <Field label="E-mail" htmlFor="email" error={state && !state.ok ? state.fieldErrors?.email?.[0] : undefined}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="voce@email.com"
          />
        </Field>

        <Field
          label="Senha"
          htmlFor="password"
          error={state && !state.ok ? state.fieldErrors?.password?.[0] : undefined}
          hint={mode === 'signup' ? 'Mínimo de 8 caracteres.' : undefined}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            required
            minLength={8}
            placeholder="••••••••"
          />
        </Field>

        {state && !state.ok ? (
          <p className="rounded-xl bg-negative-soft px-3 py-2 text-xs font-medium text-negative">
            {state.error}
          </p>
        ) : null}

        {state && state.ok && state.message ? (
          <p className="rounded-xl bg-positive-soft px-3 py-2 text-xs font-medium text-positive">
            {state.message}
          </p>
        ) : null}

        <SubmitButton className="w-full" pendingLabel="Entrando...">
          {mode === 'signin' ? 'Entrar' : 'Criar conta'}
        </SubmitButton>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        className="w-full text-center text-xs font-medium text-brand-700 hover:underline"
      >
        {mode === 'signin' ? 'Não tenho conta — criar agora' : 'Já tenho conta — entrar'}
      </button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[11px] uppercase tracking-wide text-ink-muted">ou</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form action={signInWithGoogleAction}>
        <SubmitButton
          className="w-full border border-line bg-surface text-ink hover:bg-surface-muted"
          pendingLabel="Abrindo Google..."
        >
          <GoogleIcon />
          Entrar com Google
        </SubmitButton>
      </form>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.6 5.6 0 0 1-2.4 3.58l3.86 3a11.4 11.4 0 0 0 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}
