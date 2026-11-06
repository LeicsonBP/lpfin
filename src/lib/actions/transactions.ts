'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/data/session';
import { buildInstallmentPlan } from '@/lib/finance';
import { transactionSchema } from '@/lib/schemas';
import type { ActionResult } from '@/lib/types';

import { checkbox, dbFail, ok, parseOrFail } from './helpers';

function readForm(formData: FormData) {
  return {
    description: formData.get('description'),
    card_id: formData.get('card_id') ?? '',
    category: formData.get('category') ?? 'outros',
    total_amount: formData.get('total_amount'),
    installments_count: formData.get('installments_count') ?? 1,
    purchase_date: formData.get('purchase_date') ?? new Date(),
    start_year: formData.get('start_year'),
    start_month: formData.get('start_month'),
    is_subscription: checkbox(formData, 'is_subscription'),
  };
}

function refresh() {
  revalidatePath('/compras');
  revalidatePath('/mes');
  revalidatePath('/dashboard');
}

/**
 * Cria a compra e gera automaticamente as parcelas (motor de parcelamento).
 * A soma das parcelas é sempre igual ao valor total, em centavos.
 */
export async function createTransactionAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const parsed = parseOrFail(transactionSchema, readForm(formData));
  if (!parsed.success) return parsed.result;

  const data = parsed.data;
  const start = { year: data.start_year, month: data.start_month };

  const { data: transaction, error: transactionError } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      card_id: data.card_id ?? null,
      description: data.description,
      category: data.category,
      total_amount: data.total_amount,
      installments_count: data.installments_count,
      purchase_date: data.purchase_date.toISOString().slice(0, 10),
      start_year: data.start_year,
      start_month: data.start_month,
      is_subscription: data.is_subscription,
    })
    .select('id')
    .single();

  if (transactionError) return dbFail(transactionError.message);
  if (!transaction) return { ok: false, error: 'Não foi possível salvar a compra.' };

  const plan = buildInstallmentPlan({
    total: data.total_amount,
    count: data.installments_count,
    start,
  });

  const { error: installmentsError } = await supabase.from('installments').insert(
    plan.map((item) => ({
      transaction_id: transaction.id,
      user_id: user.id,
      card_id: data.card_id ?? null,
      installment_number: item.number,
      installment_total: data.installments_count,
      reference_year: item.month.year,
      reference_month: item.month.month,
      amount: item.amount,
    })),
  );

  if (installmentsError) return dbFail(installmentsError.message);

  refresh();
  return ok(`${plan.length}x lançadas.`);
}

export async function updateTransactionAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const id = formData.get('id');
  if (typeof id !== 'string' || id === '') return { ok: false, error: 'Compra inválida.' };

  const { supabase, user } = await requireUser();
  const parsed = parseOrFail(transactionSchema, readForm(formData));
  if (!parsed.success) return parsed.result;

  const data = parsed.data;
  const regenerate = checkbox(formData, 'regenerate');

  const { error } = await supabase
    .from('transactions')
    .update({
      card_id: data.card_id ?? null,
      description: data.description,
      category: data.category,
      total_amount: data.total_amount,
      installments_count: data.installments_count,
      purchase_date: data.purchase_date.toISOString().slice(0, 10),
      start_year: data.start_year,
      start_month: data.start_month,
      is_subscription: data.is_subscription,
    })
    .eq('id', id);

  if (error) return dbFail(error.message);

  if (regenerate) {
    const { error: deleteError } = await supabase
      .from('installments')
      .delete()
      .eq('transaction_id', id);

    if (deleteError) return dbFail(deleteError.message);

    const plan = buildInstallmentPlan({
      total: data.total_amount,
      count: data.installments_count,
      start: { year: data.start_year, month: data.start_month },
    });

    const { error: insertError } = await supabase.from('installments').insert(
      plan.map((item) => ({
        transaction_id: id,
        user_id: user.id,
        card_id: data.card_id ?? null,
        installment_number: item.number,
        installment_total: data.installments_count,
        reference_year: item.month.year,
        reference_month: item.month.month,
        amount: item.amount,
      })),
    );

    if (insertError) return dbFail(insertError.message);
  }

  refresh();
  return ok(regenerate ? 'Compra atualizada e parcelas recalculadas.' : 'Compra atualizada.');
}

export async function deleteTransactionAction(formData: FormData): Promise<void> {
  const id = formData.get('id');
  if (typeof id !== 'string' || id === '') return;

  const { supabase } = await requireUser();
  await supabase.from('transactions').delete().eq('id', id);
  refresh();
}
