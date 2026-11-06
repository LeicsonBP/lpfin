import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

/**
 * Garante que existe um usuário autenticado.
 * Usado por Server Components, Server Actions e Route Handlers.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return { supabase, user };
}
