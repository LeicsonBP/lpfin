'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/data/session';
import { cardSchema } from '@/lib/schemas';
import type { ActionResult } from '@/lib/types';

import { checkbox, dbFail, ok, parseOrFail } from './helpers';

function readForm(formData: FormData) {
  return {
    name: formData.get('name'),
    credit_limit: formData.get('credit_limit'),
    closing_day: formData.get('closing_day'),
    due_day: formData.get('due_day'),
    color: formData.get('color') || '#0e6855',
    is_active: checkbox(formData, 'is_active'),
  };
}

function refresh() {
  revalidatePath('/cartoes');
  revalidatePath('/mes');
  revalidatePath('/dashboard');
}

export async function createCardAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const parsed = parseOrFail(cardSchema, readForm(formData));
  if (!parsed.success) return parsed.result;

  const { error } = await supabase
    .from('cards')
    .insert({ ...parsed.data, user_id: user.id });

  if (error) return dbFail(error.message);

  refresh();
  return ok('Cartão criado.');
}

export async function updateCardAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const id = formData.get('id');
  if (typeof id !== 'string' || id === '') {
    return { ok: false, error: 'Cartão inválido.' };
  }

  const { supabase } = await requireUser();
  const parsed = parseOrFail(cardSchema, readForm(formData));
  if (!parsed.success) return parsed.result;

  const { error } = await supabase.from('cards').update(parsed.data).eq('id', id);
  if (error) return dbFail(error.message);

  refresh();
  return ok('Cartão atualizado.');
}

export async function deleteCardAction(formData: FormData): Promise<void> {
  const id = formData.get('id');
  if (typeof id !== 'string' || id === '') return;

  const { supabase } = await requireUser();
  await supabase.from('cards').delete().eq('id', id);
  refresh();
}
