import { createClient } from '@/lib/supabase/server';
import { DEFAULT_ACCENT, safeHex } from '@/lib/color';
import {
  DEFAULT_SURFACE_STYLE,
  safeSurfaceStyle,
  type SurfaceStyle,
} from '@/lib/surface';

/** Preferências visuais do usuário. */
export interface VisualSettings {
  /** cor de destaque aplicada ao tema */
  accent: string;
  /** estilo dos cards: sólido ou vidro */
  surface: SurfaceStyle;
}

const FALLBACK: VisualSettings = {
  accent: DEFAULT_ACCENT,
  surface: DEFAULT_SURFACE_STYLE,
};

/**
 * Cor de destaque + estilo dos cards do usuário atual.
 * Uma única consulta por requisição (fallback: padrões do app).
 */
export async function getUserSettings(): Promise<VisualSettings> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return FALLBACK;

    const { error, data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) return FALLBACK;

    // select('*') mantém a leitura funcionando mesmo antes da migration
    // que adiciona surface_style ser aplicada (fallback: sólido).
    const row = data as { accent_color?: string; surface_style?: string } | null;

    return {
      accent: safeHex(row?.accent_color),
      surface: safeSurfaceStyle(row?.surface_style),
    };
  } catch {
    return FALLBACK;
  }
}

/** Cor de destaque do usuário atual (fallback: verde padrão). */
export async function getAccentColor(): Promise<string> {
  return (await getUserSettings()).accent;
}

/** Estilo dos cards do usuário atual (fallback: sólido). */
export async function getSurfaceStyle(): Promise<SurfaceStyle> {
  return (await getUserSettings()).surface;
}

