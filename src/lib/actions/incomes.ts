'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/data/session';
import { addMonths, compareMonths, monthsBetween } from '@/lib/finance';
import { parseMoneyInput } from '@/lib/money';
import { incomeSchema } from '@/lib/schemas';
import type { ActionResult, MonthRef } from '@/lib/types';

import { checkbox, dbFail, ok, parseOrFail } from './helpers';

/** teto de segurança para não gerar uma série infinita */
const MAX_RECURRENCE_MONTHS = 120;

function readForm(formData: FormData) {
  return {
    description: formData.get('description'),
    amount: formData.get('amount'),
    reference_year: formData.get('reference_year'),
    reference_month: formData.get('reference_month'),
    kind: formData.get('kind') ?? 'salary',
    is_recurring: checkbox(formData, 'is_recurring'),
  };
}

function refresh() {
  revalidatePath('/ganhos');
  revalidatePath('/mes');
  revalidatePath('/dashboard');
}

/**
 * Cria um ganho. Quando é recorrente (ex.: salário), gera uma ocorrência por mês
 * a partir do mês informado — todas agrupadas pelo mesmo `series_id`.
 */
export async function createIncomeAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const parsed = parseOrFail(incomeSchema, readForm(formData));
  if (!parsed.success) return parsed.result;

  const data = parsed.data;
  const start = { year: data.reference_year, month: data.reference_month };

  if (!data.is_recurring) {
    const { error } = await supabase.from('incomes').insert({
      user_id: user.id,
      description: data.description,
      amount: data.amount,
      reference_year: data.reference_year,
      reference_month: data.reference_month,
      kind: data.kind,
      series_id: null,
      is_recurring: false,
    });

    if (error) return dbFail(error.message);

    refresh();
    return ok('Ganho lançado.');
  }

  // A recorrência acompanha o compromisso mais longo já cadastrado
  // (última parcela de compras ou de débitos em folha), com mínimo de 12 meses.
  const [{ data: lastInstallments }, { data: lastPayroll }] = await Promise.all([
    supabase
      .from('installments')
      .select('reference_year, reference_month')
      .order('reference_year', { ascending: false })
      .order('reference_month', { ascending: false })
      .limit(1),
    supabase
      .from('payroll_deductions')
      .select('reference_year, reference_month')
      .order('reference_year', { ascending: false })
      .order('reference_month', { ascending: false })
      .limit(1),
  ]);

  let horizon: MonthRef = addMonths(start, 11);
  const candidates = [lastInstallments?.[0], lastPayroll?.[0]];

  for (const row of candidates) {
    if (!row) continue;
    const candidate: MonthRef = {
      year: Number(row.reference_year),
      month: Number(row.reference_month),
    };
    if (compareMonths(candidate, horizon) > 0) horizon = candidate;
  }

  const months = Math.min(MAX_RECURRENCE_MONTHS, monthsBetween(start, horizon) + 1);
  const seriesId = crypto.randomUUID();

  const rows = Array.from({ length: months }, (_, index) => {
    const month = addMonths(start, index);
    return {
      user_id: user.id,
      description: data.description,
      amount: data.amount,
      reference_year: month.year,
      reference_month: month.month,
      kind: data.kind,
      series_id: seriesId,
      is_recurring: true,
    };
  });

  const { error } = await supabase.from('incomes').insert(rows);
  if (error) return dbFail(error.message);

  refresh();
  return ok(
    `Ganho recorrente criado de ${data.reference_month}/${data.reference_year} até ${horizon.month}/${horizon.year} (${months} meses).`,
  );
}

/**
 * Ajusta o valor de um ganho recorrente do mês escolhido em diante,
 * preservando o histórico anterior (ex.: aumento anual do salário).
 */
export async function adjustRecurringIncomeAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const seriesId = formData.get('series_id');
  const year = Number(formData.get('reference_year'));
  const month = Number(formData.get('reference_month'));
  const amount = parseMoneyInput(formData.get('amount'));

  if (typeof seriesId !== 'string' || seriesId === '') {
    return { ok: false, error: 'Recorrência inválida.' };
  }
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return { ok: false, error: 'Mês inválido.' };
  }
  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: 'Informe um valor válido.' };
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from('incomes')
    .update({ amount })
    .eq('series_id', seriesId)
    .or(`reference_year.gt.${year},and(reference_year.eq.${year},reference_month.gte.${month})`);

  if (error) return dbFail(error.message);

  refresh();
  return ok('Recorrência ajustada a partir deste mês.');
}

/**
 * Encerra a recorrência a partir do mês escolhido: os meses anteriores são
 * preservados e os futuros (incluindo o mês informado) são removidos.
 */
export async function endRecurringIncomeAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const seriesId = formData.get('series_id');
  const year = Number(formData.get('reference_year'));
  const month = Number(formData.get('reference_month'));

  if (typeof seriesId !== 'string' || seriesId === '') {
    return { ok: false, error: 'Recorrência inválida.' };
  }
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return { ok: false, error: 'Mês inválido.' };
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from('incomes')
    .delete()
    .eq('series_id', seriesId)
    .or(`reference_year.gt.${year},and(reference_year.eq.${year},reference_month.gte.${month})`);

  if (error) return dbFail(error.message);

  refresh();
  return ok('Recorrência encerrada — o histórico anterior foi mantido.');
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
