import type { NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/proxy';

/**
 * Proxy (antigo middleware) — convenção do Next.js 16.
 * Renova a sessão do Supabase e bloqueia rotas privadas para visitantes.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Roda em todas as rotas, exceto:
     * - _next/static, _next/image (build/assets)
     * - favicon, imagens e manifest (precisam ser públicos)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)',
  ],
};
