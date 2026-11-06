import { cookies } from 'next/headers';

import { MONTH_COOKIE } from '@/lib/cookies';
import { currentMonth, monthKey } from '@/lib/finance';
import type { MonthRef } from '@/lib/types';

function fromQueryParams(
  ano: string | string[] | undefined,
  mes: string | string[] | undefined,
): MonthRef | null {
  const yearRaw = Array.isArray(ano) ? ano[0] : ano;
  const monthRaw = Array.isArray(mes) ? mes[0] : mes;
  if (!yearRaw || !monthRaw) return null;

  const year = Number.parseInt(yearRaw, 10);
  const month = Number.parseInt(monthRaw, 10);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;

  return { year, month };
}

function fromCookieValue(value: string | undefined): MonthRef | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = Number.parseInt(match[1] ?? '', 10);
  const month = Number.parseInt(match[2] ?? '', 10);
  if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
  if (month < 1 || month > 12) return null;

  return { year, month };
}

/**
 * Competência selecionada no app (contexto compartilhado entre as telas).
 * Precedência: `?ano=&mes=` na URL → cookie `lpfin-month` → mês atual.
 */
export async function resolveMonth(
  searchParams?: { ano?: string | string[]; mes?: string | string[] },
): Promise<MonthRef> {
  const fromQuery = fromQueryParams(searchParams?.ano, searchParams?.mes);
  if (fromQuery) return fromQuery;

  const cookieStore = await cookies();
  const fromCookie = fromCookieValue(cookieStore.get(MONTH_COOKIE)?.value);
  if (fromCookie) return fromCookie;

  return currentMonth();
}

/** Valor do cookie para uma competência (ex.: '2026-11'). */
export function monthCookieValue(reference: MonthRef): string {
  return monthKey(reference);
}
