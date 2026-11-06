'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { loginSchema } from '@/lib/schemas';
import { getOrigin } from '@/lib/server-url';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/types';

/** Login com Google (OAuth via Supabase). */
export async function signInWithGoogleAction(): Promise<void> {
  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });

  if (error || !data.url) {
    redirect(`/login?erro=${encodeURIComponent(error?.message ?? 'Falha ao iniciar login com Google')}`);
  }

  redirect(data.url);
}

/** Login com e-mail e senha. */
export async function signInWithPasswordAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: 'Verifique os dados informados.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false, error: traduzErroAuth(error.message) };
  }

  revalidatePath('/', 'layout');
  redirect('/mes');
}

/** Cadastro com e-mail e senha. */
export async function signUpWithPasswordAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: 'Verifique os dados informados.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    return { ok: false, error: traduzErroAuth(error.message) };
  }

  if (data.session) {
    revalidatePath('/', 'layout');
    redirect('/mes');
  }

  return {
    ok: true,
    data: undefined,
    message: 'Cadastro criado. Confirme o e-mail enviado pelo Supabase para entrar.',
  };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

function traduzErroAuth(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'E-mail ou senha inválidos.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar.';
  }
  if (normalized.includes('user already registered')) {
    return 'Este e-mail já está cadastrado.';
  }
  if (normalized.includes('password should be at least')) {
    return 'A senha precisa ter pelo menos 8 caracteres.';
  }

  return message;
}
