'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/data/session';
import { addMonths } from '@/lib/finance';
import { payrollDeductionSchema } from '@/lib/schemas';
import type { ActionResult } from '@/lib/types';

import { dbFail, ok, parseOrFail } from './helpers';

function readForm(formData: FormData) {
  return {
    name: formData.get('name'),
    amount: formData.get('amount'),
    kind: formData.get('kind') ?? 'fixed',
    installments_count: formData.get('installments_count') ?? 1,
    reference_year: formData.get('reference_year'),
    reference_month: formData.get('reference_month'),
  };
}

function refresh() {
  revalidatePath('/debitos');
  revalidatePath('/mes');
  revalidatePath('/dashboard');
}

/**
 * Cria débito em folha. Quando `kind = installment`, gera uma linha por mês
 * (o valor informado é o valor de cada parcela — igual à planilha de referência).
 */
export async function createPayrollDeductionAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const parsed = parseOrFail(payrollDeductionSchema, readForm(formData));
  if (!parsed.success) return parsed.result;

  const { name, amount, kind, installments_count, reference_year, reference_month } = parsed.data;
  const total = kind === 'fixed' ? 1 : Math.max(1, installments_count);

  const rows = Array.from({ length: total }, (_, index) => {
    const month = addMonths({ year: reference_year, month: reference_month }, index);
    return {
      user_id: user.id,
      name,
      amount,
      kind,
      installment_number: kind === 'fixed' ? null : index + 1,
      installment_total: kind === 'fixed' ? null : total,
      reference_year: month.year,
      reference_month: month.month,
    };
  });

  const { error } = await supabase.from('payroll_deductions').insert(rows);
  if (error) return dbFail(error.message);

  refresh();
  return ok(total > 1 ? `${total} parcelas lançadas.` : 'Débito lançado.');
}

export async function updatePayrollDeductionAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const id = formData.get('id');
  if (typeof id !== 'string' || id === '') return { ok: false, error: 'Débito inválido.' };

  const { supabase } = await requireUser();
  const parsed = parseOrFail(payrollDeductionSchema, readForm(formData));
  if (!parsed.success) return parsed.result;

  const { error } = await supabase
    .from('payroll_deductions')
    .update({
      name: parsed.data.name,
      amount: parsed.data.amount,
      reference_year: parsed.data.reference_year,
      reference_month: parsed.data.reference_month,
    })
    .eq('id', id);

  if (error) return dbFail(error.message);

  refresh();
  return ok('Débito atualizado.');
}

export async function deletePayrollDeductionAction(formData: FormData): Promise<void> {
  const id = formData.get('id');
  if (typeof id !== 'string' || id === '') return;

  const { supabase } = await requireUser();
  await supabase.from('payroll_deductions').delete().eq('id', id);
  refresh();
}

export async function togglePayrollPaidAction(formData: FormData): Promise<void> {
  const id = formData.get('id');
  const paid = formData.get('paid') === 'true';
  if (typeof id !== 'string' || id === '') return;

  const { supabase } = await requireUser();
  await supabase
    .from('payroll_deductions')
    .update({ is_paid: paid, paid_at: paid ? new Date().toISOString() : null })
    .eq('id', id);

  refresh();
}
