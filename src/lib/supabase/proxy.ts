import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { publicEnv } from '@/lib/env';

const PUBLIC_PATHS = ['/login', '/auth'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Renova a sessão do Supabase a cada requisição e protege as rotas privadas.
 * Chamado por `src/proxy.ts` (convenção do Next 16 que substitui o middleware).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  if (user && pathname === '/login') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/mes';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
