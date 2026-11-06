'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { DEFAULT_ACCENT, safeHex } from '@/lib/color';
import { SURFACE_COOKIE } from '@/lib/cookies';
import { requireUser } from '@/lib/data/session';
import { safeSurfaceStyle } from '@/lib/surface';
import type { ActionResult } from '@/lib/types';

import { dbFail, ok } from './helpers';

/**
 * Salva a cor de destaque do tema para o usuário (vale em qualquer dispositivo).
 */
export async function updateAccentColorAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const value = formData.get('accent_color');
  const accent = safeHex(typeof value === 'string' ? value : null);

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from('user_settings').upsert(
    { user_id: user.id, accent_color: accent },
    { onConflict: 'user_id' },
  );

  if (error) return dbFail(error.message);

  revalidatePath('/', 'layout');
  return ok('Cor de destaque atualizada.');
}

/** Volta a cor de destaque para o verde padrão do app. */
export async function resetAccentColorAction(): Promise<void> {
  const { supabase, user } = await requireUser();

  await supabase.from('user_settings').upsert(
    { user_id: user.id, accent_color: DEFAULT_ACCENT },
    { onConflict: 'user_id' },
  );

  revalidatePath('/', 'layout');
}

/**
 * Salva o estilo dos cards: 'solid' (padrão) ou 'glass' (liquid glass).
 * Grava um cookie (vale na hora, neste dispositivo — como o tema) e tenta
 * sincronizar com a conta. Se a coluna `surface_style` ainda não existir no
 * banco (migration pendente), o cookie mantém a preferência funcionando.
 */
export async function setSurfaceStyleAction(style: string): Promise<ActionResult> {
  const surface = safeSurfaceStyle(style);

  (await cookies()).set(SURFACE_COOKIE, surface, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from('user_settings').upsert(
    { user_id: user.id, surface_style: surface },
    { onConflict: 'user_id' },
  );

  revalidatePath('/', 'layout');

  const label = surface === 'glass' ? 'Cards em vidro.' : 'Cards sólidos.';

  if (error) {
    // Coluna ausente (schema cache/migration pendente): segue valendo o cookie.
    return ok(`${label} Preferência salva neste dispositivo.`);
  }

  return ok(label);
}
