/**
 * Utilidades de cor para os cartões (as cores são escolhidas na paleta,
 * sempre no formato #RRGGBB) e para a cor de destaque do tema.
 */

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

export const DEFAULT_ACCENT = '#0e6855';

export function isHexColor(value: string): boolean {
  return HEX_PATTERN.test(value);
}

/** Paleta curada de cores de destaque (todas com bom contraste para UI). */
export const ACCENT_PALETTE: { value: string; label: string }[] = [
  { value: '#0e6855', label: 'Esmeralda (padrão)' },
  { value: '#0f766e', label: 'Verde-azulado' },
  { value: '#0369a1', label: 'Azul oceano' },
  { value: '#1e40af', label: 'Azul índigo' },
  { value: '#6d28d9', label: 'Violeta' },
  { value: '#9d174d', label: 'Framboesa' },
  { value: '#b45309', label: 'Âmbar' },
  { value: '#3f6212', label: 'Oliva' },
  { value: '#7c2d12', label: 'Terracota' },
  { value: '#334155', label: 'Grafite' },
];

/** Paleta de cores dos cartões (grade completa). */
export const CARD_PALETTE = [
  // cinzas
  '#000000', '#1f1f1f', '#3d3d3d', '#5c5c5c', '#787878', '#9a9a9a', '#bbbbbb', '#d7d7d7', '#e9e9e9', '#ffffff',
  // vivas
  '#7a0d12', '#d32f2f', '#f57c00', '#fbc02d', '#4caf50', '#00bcd4', '#2962ff', '#304ffe', '#8e24aa', '#d500f9',
  // pastéis
  '#f8d7da', '#ffcdd2', '#ffe0b2', '#fff9c4', '#d7f5d3', '#c8f0ef', '#cfe4fb', '#d6dcfb', '#e2d4f5', '#f6d5f0',
  // suaves
  '#e8a2a5', '#ef9a9a', '#ffc080', '#fff176', '#a5d6a7', '#80deea', '#90caf9', '#9fa8da', '#ce93d8', '#f48fb1',
  // médias
  '#c76a6d', '#e57373', '#ffb74d', '#ffd54f', '#81c784', '#4dd0e1', '#64b5f6', '#7986cb', '#ba68c8', '#f06292',
  // profundas
  '#a63d40', '#c62828', '#e65100', '#f9a825', '#2e7d32', '#00838f', '#1565c0', '#283593', '#6a1b9a', '#ad1457',
  // escuras
  '#5d1a1c', '#7b1d1d', '#8a2c00', '#7a5a00', '#1b5e20', '#004d52', '#0d3c78', '#1a237e', '#4a148c', '#880e4f',
];

/** Qualquer cor válida, ou o destaque padrão. */
export function safeHex(value: string | null | undefined): string {
  return value && isHexColor(value) ? value.toLowerCase() : DEFAULT_ACCENT;
}

/**
 * Adiciona transparência a uma cor hex (`alpha` de 0 a 1).
 * Se a cor for inválida, devolve um tom neutro da paleta.
 */
export function hexWithAlpha(color: string, alpha: number): string {
  const safe = isHexColor(color) ? color : DEFAULT_ACCENT;
  const clamped = Math.min(1, Math.max(0, alpha));
  const suffix = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');

  return `${safe}${suffix}`;
}

function parseHex(color: string): { r: number; g: number; b: number } | null {
  if (!isHexColor(color)) return null;
  return {
    r: Number.parseInt(color.slice(1, 3), 16),
    g: Number.parseInt(color.slice(3, 5), 16),
    b: Number.parseInt(color.slice(5, 7), 16),
  };
}

function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const part = (value: number) =>
    Math.min(255, Math.max(0, Math.round(value)))
      .toString(16)
      .padStart(2, '0');

  return `#${part(r)}${part(g)}${part(b)}`;
}

/** Mistura `color` com `target` (weight = quanto do target, 0 a 1). */
export function mixHex(color: string, target: string, weight: number): string {
  const from = parseHex(color) ?? parseHex(DEFAULT_ACCENT)!;
  const to = parseHex(target) ?? { r: 255, g: 255, b: 255 };
  const w = Math.min(1, Math.max(0, weight));

  return toHex({
    r: from.r * (1 - w) + to.r * w,
    g: from.g * (1 - w) + to.g * w,
    b: from.b * (1 - w) + to.b * w,
  });
}

export function isLightColor(color: string): boolean {
  const rgb = parseHex(color);
  if (!rgb) return false;

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.62;
}

export interface AccentPalette {
  light: Record<string, string>;
  dark: Record<string, string>;
}

/**
 * Deriva a escala de destaque (tokens `--brand-*` e `--primary*`) a partir de
 * uma única cor, com variantes para os temas claro e escuro.
 */
export function buildAccentPalette(accent: string): AccentPalette {
  const base = safeHex(accent);
  const lighter = (weight: number) => mixHex(base, '#ffffff', weight);
  const darker = (weight: number) => mixHex(base, '#000000', weight);

  const darkPrimary = lighter(0.62);
  const onPrimaryLight = isLightColor(base) ? '#0f1f19' : '#ffffff';
  const onPrimaryDark = isLightColor(darkPrimary) ? darker(0.86) : '#06231b';

  return {
    light: {
      '--brand-50': lighter(0.94),
      '--brand-100': lighter(0.86),
      '--brand-200': lighter(0.7),
      '--brand-300': lighter(0.5),
      '--brand-400': lighter(0.32),
      '--brand-500': lighter(0.16),
      '--brand-600': lighter(0.06),
      '--brand-700': base,
      '--brand-800': darker(0.18),
      '--brand-900': darker(0.32),
      '--primary': base,
      '--primary-hover': darker(0.18),
      '--primary-soft': lighter(0.9),
      '--on-primary': onPrimaryLight,
    },
    dark: {
      '--brand-50': darker(0.66),
      '--brand-100': darker(0.6),
      '--brand-200': darker(0.5),
      '--brand-300': darker(0.4),
      '--brand-400': darker(0.26),
      '--brand-500': darker(0.12),
      '--brand-600': lighter(0.24),
      '--brand-700': lighter(0.44),
      '--brand-800': lighter(0.62),
      '--brand-900': lighter(0.76),
      '--primary': darkPrimary,
      '--primary-hover': lighter(0.76),
      '--primary-soft': darker(0.66),
      '--on-primary': onPrimaryDark,
    },
  };
}

/** Folha de estilo (CSS) com os tokens da cor de destaque. */
export function buildAccentCss(accent: string): string {
  const palette = buildAccentPalette(accent);
  const toBlock = (selector: string, tokens: Record<string, string>) =>
    `${selector}{${Object.entries(tokens)
      .map(([token, value]) => `${token}:${value}`)
      .join(';')}}`;

  return `${toBlock(':root', palette.light)}${toBlock('.dark', palette.dark)}`;
}

