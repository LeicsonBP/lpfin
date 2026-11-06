import { cookies } from 'next/headers';

export type Theme = 'light' | 'dark';

export const THEME_COOKIE = 'lpfin-theme';

/** Lê o tema escolhido pelo usuário (cookie gravado pelo seletor). */
export async function getTheme(): Promise<Theme> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return value === 'dark' ? 'dark' : 'light';
}
