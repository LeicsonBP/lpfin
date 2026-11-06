'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/data/session';
import { incomeSchema } from '@/lib/schemas';
import type { ActionResult } from '@/lib/types';

import { checkbox, dbFail, ok, parseOrFail } from './helpers';

function readForm(formData: FormData) {
  return {
    description: formData.get('description'),
    amount: formData.get('amount'),
    reference_year: formData.get('reference_year'),
    reference_month: formData.get('reference_month'),
    kind: formData.get('kind') ?? 'salary',
    is_received: checkbox(formData, 'is_received'),
  };
}

function refresh() {
  revalidatePath('/ganhos');
  revalidatePath('/mes');
  revalidatePath('/dashboard');
}

export async function createIncomeAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const parsed = parseOrFail(incomeSchema, readForm(formData));
  if (!parsed.success) return parsed.result;

  const { error } = await supabase
    .from('incomes')
    .insert({ ...parsed.data, user_id: user.id });

  if (error) return dbFail(error.message);

  refresh();
  return ok('Ganho lançado.');
}

export async function updateIncomeAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const id = formData.get('id');
  if (typeof id !== 'string' || id === '') return { ok: false, error: 'Ganho inválido.' };

  const { supabase } = await requireUser();
  const parsed = parseOrFail(incomeSchema, readForm(formData));
  if (!parsed.success) return parsed.result;

  const { error } = await supabase.from('incomes').update(parsed.data).eq('id', id);
  if (error) return dbFail(error.message);

  refresh();
  return ok('Ganho atualizado.');
}

export async function deleteIncomeAction(formData: FormData): Promise<void> {
  const id = formData.get('id');
  if (typeof id !== 'string' || id === '') return;

  const { supabase } = await requireUser();
  await supabase.from('incomes').delete().eq('id', id);
  refresh();
}

export async function toggleIncomeReceivedAction(formData: FormData): Promise<void> {
  const id = formData.get('id');
  const received = formData.get('received') === 'true';
  if (typeof id !== 'string' || id === '') return;

  const { supabase } = await requireUser();
  await supabase
    .from('incomes')
    .update({ is_received: received, received_at: received ? new Date().toISOString() : null })
    .eq('id', id);

  refresh();
}
