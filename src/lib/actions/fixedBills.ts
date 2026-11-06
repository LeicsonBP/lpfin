'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/data/session';
import { addMonths } from '@/lib/finance';
import { parseMoneyInput } from '@/lib/money';
import { fixedBillCreateSchema, fixedBillEntrySchema, fixedBillSchema } from '@/lib/schemas';
import type { ActionResult } from '@/lib/types';

import { checkbox, dbFail, ok, parseOrFail } from './helpers';

function readUpdateForm(formData: FormData) {
  return {
    name: formData.get('name'),
    due_day: formData.get('due_day'),
    base_value: formData.get('base_value'),
    is_active: checkbox(formData, 'is_active'),
  };
}

function readCreateForm(formData: FormData) {
  return {
    name: formData.get('name'),
    due_day: formData.get('due_day'),
    base_value: formData.get('base_value'),
    kind: formData.get('kind') ?? 'fixed',
    installments_count: formData.get('installments_count') ?? 1,
    current_installment: formData.get('current_installment') ?? 1,
    reference_year: formData.get('reference_year'),
    reference_month: formData.get('reference_month'),
    is_active: checkbox(formData, 'is_active'),
  };
}

function refresh() {
  revalidatePath('/contas-fixas');
  revalidatePath('/mes');
  revalidatePath('/dashboard');
}

/**
 * Cria a conta. Quando é parcelada (financiamento/empréstimo), gera um
 * lançamento por mês com o número da parcela — as anteriores entram como pagas.
 */
export async function createFixedBillAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const parsed = parseOrFail(fixedBillCreateSchema, readCreateForm(formData));
  if (!parsed.success) return parsed.result;

  const data = parsed.data;
  const isInstallment = data.kind === 'installment' && data.installments_count > 1;

  const { data: created, error } = await supabase
    .from('fixed_bills')
    .insert({
      user_id: user.id,
      name: data.name,
      due_day: data.due_day,
      base_value: data.base_value,
      kind: isInstallment ? 'installment' : 'fixed',
      installments_count: isInstallment ? data.installments_count : null,
      is_active: data.is_active,
    })
    .select('id')
    .single();

  if (error) return dbFail(error.message);
  if (!created) return { ok: false, error: 'Não foi possível criar a conta.' };

  if (isInstallment) {
    const total = data.installments_count;
    const current = Math.min(data.current_installment, total);
    const start = addMonths(
      { year: data.reference_year, month: data.reference_month },
      -(current - 1),
    );
    const now = new Date().toISOString();

    const entries = Array.from({ length: total }, (_, index) => {
      const month = addMonths(start, index);
      const number = index + 1;
      const alreadyPaid = number < current;

      return {
        user_id: user.id,
        fixed_bill_id: created.id,
        reference_year: month.year,
        reference_month: month.month,
        amount: data.base_value,
        installment_number: number,
        installment_total: total,
        is_paid: alreadyPaid,
        paid_at: alreadyPaid ? now : null,
      };
    });

    const { error: entriesError } = await supabase
      .from('fixed_bills_entries')
      .upsert(entries, { onConflict: 'fixed_bill_id,reference_year,reference_month' });

    if (entriesError) return dbFail(entriesError.message);

    refresh();
    return ok(`Conta parcelada criada com ${total} parcelas.`);
  }

  refresh();
  return ok('Conta fixa criada.');
}

export async function updateFixedBillAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const id = formData.get('id');
  if (typeof id !== 'string' || id === '') return { ok: false, error: 'Conta inválida.' };

  const { supabase } = await requireUser();
  const parsed = parseOrFail(fixedBillSchema, readUpdateForm(formData));
  if (!parsed.success) return parsed.result;

  const { error } = await supabase.from('fixed_bills').update(parsed.data).eq('id', id);
  if (error) return dbFail(error.message);

  refresh();
  return ok('Conta atualizada.');
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
