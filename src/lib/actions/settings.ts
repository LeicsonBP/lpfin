'use server';

import { revalidatePath } from 'next/cache';

import { DEFAULT_ACCENT, safeHex } from '@/lib/color';
import { requireUser } from '@/lib/data/session';
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
