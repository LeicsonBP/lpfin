import { createClient } from '@/lib/supabase/server';
import type { FixedBill, FixedBillEntry } from '@/lib/types';

export async function listFixedBills(
  options: { onlyActive?: boolean } = {},
): Promise<FixedBill[]> {
  const supabase = await createClient();
  let query = supabase
    .from('fixed_bills')
    .select('*')
    .order('is_active', { ascending: false })
    .order('name');

  if (options.onlyActive) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao carregar contas fixas: ${error.message}`);

  return (data ?? []) as FixedBill[];
}

/** Lançamentos de contas fixas entre duas competências (inclusive). */
export async function listFixedBillEntries(range: {
  from: { year: number; month: number };
  to: { year: number; month: number };
}): Promise<FixedBillEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('fixed_bills_entries')
    .select('*')
    .order('reference_year')
    .order('reference_month');

  if (error) throw new Error(`Falha ao carregar lançamentos de contas fixas: ${error.message}`);

  const entries = (data ?? []) as FixedBillEntry[];
  return entries.filter((entry) => {
    const value = entry.reference_year * 12 + entry.reference_month;
    const min = range.from.year * 12 + range.from.month;
    const max = range.to.year * 12 + range.to.month;
    return value >= min && value <= max;
  });
}
