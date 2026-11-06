import { createClient } from '@/lib/supabase/server';
import type { Installment, Transaction } from '@/lib/types';

export async function listTransactions(): Promise<Transaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('purchase_date', { ascending: false });

  if (error) throw new Error(`Falha ao carregar compras: ${error.message}`);
  return (data ?? []) as Transaction[];
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar compra: ${error.message}`);
  return (data as Transaction | null) ?? null;
}

/**
 * Parcelas entre duas competências (inclusive).
 * Usada pela visão mensal, pelo histórico e pela projeção.
 */
export async function listInstallments(range?: {
  from: { year: number; month: number };
  to: { year: number; month: number };
}): Promise<Installment[]> {
  const supabase = await createClient();
  let query = supabase
    .from('installments')
    .select('*')
    .order('reference_year')
    .order('reference_month')
    .order('installment_number');

  if (range) {
    const from = range.from.year * 12 + range.from.month;
    const to = range.to.year * 12 + range.to.month;
    // filtro grosseiro no banco + refinamento em memória (competência é ano*12+mês)
    query = query
      .gte('reference_year', range.from.year)
      .lte('reference_year', range.to.year);
    const { data, error } = await query;
    if (error) throw new Error(`Falha ao carregar parcelas: ${error.message}`);

    return ((data ?? []) as Installment[]).filter((item) => {
      const value = item.reference_year * 12 + item.reference_month;
      return value >= from && value <= to;
    });
  }

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao carregar parcelas: ${error.message}`);
  return (data ?? []) as Installment[];
}
