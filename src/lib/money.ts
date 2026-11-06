/**
 * Aritmética monetária segura.
 * Todo cálculo financeiro é feito em centavos (inteiros) para evitar
 * erros de ponto flutuante (ex.: 0.1 + 0.2 !== 0.3).
 */

/** Converte um valor em reais para centavos, arredondando corretamente. */
export function toCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

/** Converte centavos para reais. */
export function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

/** Arredonda um valor em reais para 2 casas decimais. */
export function roundMoney(value: number): number {
  return fromCents(toCents(value));
}

/** Soma valores em reais com precisão de centavos. */
export function sumMoney(values: readonly number[]): number {
  return fromCents(values.reduce((total, value) => total + toCents(value), 0));
}
