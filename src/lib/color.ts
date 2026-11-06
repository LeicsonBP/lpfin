/**
 * Utilidades de cor para os cartões (as cores são escolhidas na paleta,
 * sempre no formato #RRGGBB).
 */

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: string): boolean {
  return HEX_PATTERN.test(value);
}

/**
 * Adiciona transparência a uma cor hex (`alpha` de 0 a 1).
 * Se a cor for inválida, devolve um tom neutro da paleta.
 */
export function hexWithAlpha(color: string, alpha: number): string {
  const safe = isHexColor(color) ? color : '#0e6855';
  const clamped = Math.min(1, Math.max(0, alpha));
  const suffix = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');

  return `${safe}${suffix}`;
}
