import { createClient } from '@/lib/supabase/server';
import type { CardPayment } from '@/lib/types';

/** Faturas pagas/pendentes dos cartões na competência informada. */
export async function listCardPayments(reference: {
  year: number;
  month: number;
}): Promise<CardPayment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('card_payments')
    .select('*')
    .eq('reference_year', reference.year)
    .eq('reference_month', reference.month);

  if (error) throw new Error(`Falha ao carregar faturas pagas: ${error.message}`);
  return (data ?? []) as CardPayment[];
}
