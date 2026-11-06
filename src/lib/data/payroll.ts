import { createClient } from '@/lib/supabase/server';
import type { PayrollDeduction } from '@/lib/types';

/** Débitos em folha (opcionalmente filtrados por competência). */
export async function listPayroll(range?: { year: number; month: number }): Promise<
  PayrollDeduction[]
> {
  const supabase = await createClient();
  let query = supabase
    .from('payroll_deductions')
    .select('*')
    .order('reference_year', { ascending: false })
    .order('reference_month', { ascending: false })
    .order('name');

  if (range) {
    query = query.eq('reference_year', range.year).eq('reference_month', range.month);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao carregar débitos em folha: ${error.message}`);

  return (data ?? []) as PayrollDeduction[];
}
