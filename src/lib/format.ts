import type { ISODate, MonthRef } from '@/lib/types';

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

/** R$ 1.234,56 */
export function formatBRL(value: number): string {
  return BRL.format(Number.isFinite(value) ? value : 0);
}

/** R$ 1.234,56 — sem o símbolo, útil em gráficos e tabelas densas. */
export function formatBRLCompact(value: number): string {
  return BRL.format(Number.isFinite(value) ? value : 0).replace(/\s?R\$\s?/, '');
}

/** Outubro/2026 */
export function formatMonthLabel({ year, month }: MonthRef): string {
  const name = MONTH_NAMES[month - 1] ?? '';
  return `${name}/${year}`;
}

/** Outubro (curto) */
export function formatMonthShort({ month }: MonthRef): string {
  return (MONTH_NAMES[month - 1] ?? '').slice(0, 3);
}

/** 06/11/2026 */
export function formatDateBR(value: ISODate | Date | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

/** 06/11 */
export function formatDayMonth(value: ISODate | null | undefined): string {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

/** 1/3, 4/18, FIX... */
export function formatInstallmentLabel(
  number: number | null | undefined,
  total: number | null | undefined,
): string {
  if (!number) return 'FIX';
  if (!total) return String(number);
  return `${number}/${total}`;
}

/** 12,5% */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0);
}
