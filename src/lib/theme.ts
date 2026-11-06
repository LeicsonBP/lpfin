import { cookies } from 'next/headers';

import { THEME_COOKIE } from '@/lib/cookies';

export type Theme = 'light' | 'dark';

export { THEME_COOKIE };

/** Lê o tema escolhido pelo usuário (cookie gravado pelo seletor). */
export async function getTheme(): Promise<Theme> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return value === 'dark' ? 'dark' : 'light';
}

