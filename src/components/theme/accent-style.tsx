import { buildAccentCss } from '@/lib/color';

/**
 * Injeta os tokens da cor de destaque do usuário (tema claro e escuro).
 * Renderizado no topo do <body> para valer em toda a aplicação.
 */
export function AccentStyle({ accent }: { accent: string }) {
  return <style dangerouslySetInnerHTML={{ __html: buildAccentCss(accent) }} />;
}
