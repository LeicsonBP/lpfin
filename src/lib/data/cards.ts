import { createClient } from '@/lib/supabase/server';
import type { Card } from '@/lib/types';

export async function listCards(options: { onlyActive?: boolean } = {}): Promise<Card[]> {
  const supabase = await createClient();
  let query = supabase.from('cards').select('*').order('is_active', { ascending: false }).order('name');

  if (options.onlyActive) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao carregar cartões: ${error.message}`);

  return (data ?? []) as Card[];
}

export async function getCard(id: string): Promise<Card | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('cards').select('*').eq('id', id).maybeSingle();

  if (error) throw new Error(`Falha ao carregar cartão: ${error.message}`);
  return (data as Card | null) ?? null;
}
