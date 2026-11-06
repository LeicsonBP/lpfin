'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/data/session';
import { buildInstallmentPlan } from '@/lib/finance';
import { formatBRL } from '@/lib/format';
import { fromCents, toCents } from '@/lib/money';
import { purchaseBatchSchema, transactionSchema } from '@/lib/schemas';
import type { ActionResult } from '@/lib/types';

import { checkbox, dbFail, ok, parseOrFail, zodFail } from './helpers';

function readForm(formData: FormData) {
  return {
    description: formData.get('description'),
    card_id: formData.get('card_id') ?? '',
    category: formData.get('category') ?? 'avista',
    total_amount: formData.get('total_amount'),
    installments_count: formData.get('installments_count') ?? 1,
    start_year: formData.get('start_year'),
    start_month: formData.get('start_month'),
    is_subscription: checkbox(formData, 'is_subscription'),
  };
}

/** O formulário não pede data: usamos o primeiro dia do mês da 1ª parcela. */
function purchaseDateOf(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
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
      purchase_date: purchaseDateOf(data.start_year, data.start_month),
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
      purchase_date: purchaseDateOf(data.start_year, data.start_month),
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

/**
 * Cadastro em lote: um cartão e várias compras de uma vez.
 * Cada linha informa o valor da parcela e a quantidade de parcelas;
 * o total é calculado (valor × parcelas) e as parcelas são geradas.
 */
export async function createPurchasesBatchAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const payload = formData.get('payload');
  if (typeof payload !== 'string' || payload.trim() === '') {
    return { ok: false, error: 'Informe ao menos uma compra.' };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(payload);
  } catch {
    return { ok: false, error: 'Não foi possível ler os dados do formulário.' };
  }

  const parsed = purchaseBatchSchema.safeParse(raw);
  if (!parsed.success) return zodFail(parsed.error);

  const { supabase, user } = await requireUser();
  const { card_id, start_year, start_month, lines } = parsed.data;
  const start = { year: start_year, month: start_month };

  let created = 0;
  let totalCents = 0;

  for (const line of lines) {
    const total = fromCents(toCents(line.installment_amount) * line.installments_count);
    const category = line.installments_count > 1 ? 'aprazo' : 'avista';

    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        card_id: card_id ?? null,
        description: line.description,
        category,
        total_amount: total,
        installments_count: line.installments_count,
        purchase_date: purchaseDateOf(start_year, start_month),
        start_year,
        start_month,
        is_subscription: false,
      })
      .select('id')
      .single();

    if (transactionError) return dbFail(transactionError.message);
    if (!transaction) continue;

    const plan = buildInstallmentPlan({
      total,
      count: line.installments_count,
      start,
    });

    const { error: installmentsError } = await supabase.from('installments').insert(
      plan.map((item) => ({
        transaction_id: transaction.id,
        user_id: user.id,
        card_id: card_id ?? null,
        installment_number: item.number,
        installment_total: line.installments_count,
        reference_year: item.month.year,
        reference_month: item.month.month,
        amount: item.amount,
      })),
    );

    if (installmentsError) return dbFail(installmentsError.message);

    created += 1;
    totalCents += toCents(total);
  }

  refresh();
  return ok(`${created} compra(s) lançada(s) — total ${formatBRL(fromCents(totalCents))}.`);
}
