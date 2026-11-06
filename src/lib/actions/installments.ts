'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/data/session';
import { parseMoneyInput } from '@/lib/money';
import type { ActionResult } from '@/lib/types';

import { dbFail, ok } from './helpers';

function refresh() {
  revalidatePath('/mes');
  revalidatePath('/compras');
  revalidatePath('/dashboard');
}

/**
 * Ajuste de valor individual de uma parcela (regra de negócio do briefing):
 * altera apenas a parcela escolhida, sem tocar nas demais nem no total da compra.
 */
export async function updateInstallmentAmountAction(
  installmentId: string,
  amount: string,
): Promise<ActionResult> {
  const value = parseMoneyInput(amount);
  if (!Number.isFinite(value) || value < 0) {
    return { ok: false, error: 'Informe um valor válido.' };
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from('installments')
    .update({ amount: value, is_adjusted: true })
    .eq('id', installmentId);

  if (error) return dbFail(error.message);

  refresh();
  return ok('Parcela ajustada.');
}

export async function toggleInstallmentPaidAction(formData: FormData): Promise<void> {
  const id = formData.get('id');
  const paid = formData.get('paid') === 'true';
  if (typeof id !== 'string' || id === '') return;

  const { supabase } = await requireUser();
  await supabase
    .from('installments')
    .update({ is_paid: paid, paid_at: paid ? new Date().toISOString() : null })
    .eq('id', id);

  refresh();
}
