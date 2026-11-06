'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/data/session';
import { parseMoneyInput } from '@/lib/money';
import { fixedBillEntrySchema, fixedBillSchema } from '@/lib/schemas';
import type { ActionResult } from '@/lib/types';

import { checkbox, dbFail, ok, optionalText, parseOrFail } from './helpers';

function readForm(formData: FormData) {
  return {
    name: formData.get('name'),
    due_day: formData.get('due_day'),
    base_value: formData.get('base_value'),
    category: optionalText(formData, 'category'),
    is_active: checkbox(formData, 'is_active'),
  };
}

function refresh() {
  revalidatePath('/contas-fixas');
  revalidatePath('/mes');
  revalidatePath('/dashboard');
}

export async function createFixedBillAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const parsed = parseOrFail(fixedBillSchema, readForm(formData));
  if (!parsed.success) return parsed.result;

  const { error } = await supabase
    .from('fixed_bills')
    .insert({ ...parsed.data, category: parsed.data.category ?? null, user_id: user.id });

  if (error) return dbFail(error.message);

  refresh();
  return ok('Conta fixa criada.');
}

export async function updateFixedBillAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const id = formData.get('id');
  if (typeof id !== 'string' || id === '') return { ok: false, error: 'Conta fixa inválida.' };

  const { supabase } = await requireUser();
  const parsed = parseOrFail(fixedBillSchema, readForm(formData));
  if (!parsed.success) return parsed.result;

  const { error } = await supabase
    .from('fixed_bills')
    .update({ ...parsed.data, category: parsed.data.category ?? null })
    .eq('id', id);

  if (error) return dbFail(error.message);

  refresh();
  return ok('Conta fixa atualizada.');
}

export async function deleteFixedBillAction(formData: FormData): Promise<void> {
  const id = formData.get('id');
  if (typeof id !== 'string' || id === '') return;

  const { supabase } = await requireUser();
  await supabase.from('fixed_bills').delete().eq('id', id);
  refresh();
}

/**
 * Cria ou atualiza o valor real da conta fixa no mês (upsert por competência).
 * É o que a Visão Mensal usa no campo editável.
 */
export async function upsertFixedBillEntryAction(
  fixedBillId: string,
  referenceYear: number,
  referenceMonth: number,
  amount: string,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const parsed = parseOrFail(fixedBillEntrySchema, {
    fixed_bill_id: fixedBillId,
    reference_year: referenceYear,
    reference_month: referenceMonth,
    amount,
  });

  if (!parsed.success) return parsed.result;

  const { error } = await supabase.from('fixed_bills_entries').upsert(
    {
      ...parsed.data,
      user_id: user.id,
    },
    { onConflict: 'fixed_bill_id,reference_year,reference_month' },
  );

  if (error) return dbFail(error.message);

  refresh();
  return ok('Valor atualizado.');
}

/**
 * Marca a conta fixa como paga/pendente no mês.
 * Se ainda não existir lançamento do mês, cria um com o valor informado
 * (valor base da conta por padrão).
 */
export async function toggleFixedBillEntryPaidAction(formData: FormData): Promise<void> {
  const entryId = formData.get('id');
  const paid = formData.get('paid') === 'true';
  const billId = formData.get('fixed_bill_id');
  const year = Number(formData.get('year'));
  const month = Number(formData.get('month'));
  const amountRaw = formData.get('amount');

  const { supabase, user } = await requireUser();
  const patch = { is_paid: paid, paid_at: paid ? new Date().toISOString() : null };

  if (typeof entryId === 'string' && entryId !== '') {
    await supabase.from('fixed_bills_entries').update(patch).eq('id', entryId);
  } else if (
    typeof billId === 'string' &&
    billId !== '' &&
    Number.isInteger(year) &&
    Number.isInteger(month)
  ) {
    const parsedAmount = parseMoneyInput(amountRaw);
    await supabase.from('fixed_bills_entries').upsert(
      {
        user_id: user.id,
        fixed_bill_id: billId,
        reference_year: year,
        reference_month: month,
        amount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
        ...patch,
      },
      { onConflict: 'fixed_bill_id,reference_year,reference_month' },
    );
  }

  refresh();
}
