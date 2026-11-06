import { createClient } from '@/lib/supabase/server';
import type { Income } from '@/lib/types';

/** Receitas (opcionalmente filtradas por competência). */
export async function listIncomes(range?: {
  year: number;
  month: number;
}): Promise<Income[]> {
  const supabase = await createClient();
  let query = supabase
    .from('incomes')
    .select('*')
    .order('reference_year', { ascending: false })
    .order('reference_month', { ascending: false });

  if (range) {
    query = query
      .eq('reference_year', range.year)
      .eq('reference_month', range.month);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao carregar ganhos: ${error.message}`);

  return (data ?? []) as Income[];
}
