/**
 * Estilo visual dos cards: sólido (padrão, contraste máximo) ou vidro
 * ("liquid glass": fundo translúcido com desfoque e brilho especular).
 */
export type SurfaceStyle = 'solid' | 'glass';

export const DEFAULT_SURFACE_STYLE: SurfaceStyle = 'solid';

export const SURFACE_OPTIONS: {
  value: SurfaceStyle;
  label: string;
  description: string;
}[] = [
  {
    value: 'solid',
    label: 'Sólido',
    description: 'Cards opacos, contraste máximo para leitura dos valores',
  },
  {
    value: 'glass',
    label: 'Vidro',
    description: 'Liquid glass com desfoque, brilho nas bordas e fundo suave',
  },
];

/** Normaliza o valor vindo do banco (qualquer coisa diferente de glass = sólido). */
export function safeSurfaceStyle(value: unknown): SurfaceStyle {
  return value === 'glass' ? 'glass' : 'solid';
}
