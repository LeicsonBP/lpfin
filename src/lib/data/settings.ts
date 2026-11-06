import { cookies } from 'next/headers';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_ACCENT, safeHex } from '@/lib/color';
import { SURFACE_COOKIE } from '@/lib/cookies';
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

/** Estilo escolhido neste dispositivo (cookie gravado nos Ajustes). */
async function getDeviceSurface(): Promise<SurfaceStyle | null> {
  const value = (await cookies()).get(SURFACE_COOKIE)?.value;
  return value === 'glass' || value === 'solid' ? value : null;
}

/**
 * Cor de destaque + estilo dos cards do usuário atual.
 * O estilo dos cards usa o cookie do dispositivo (resposta imediata, como o
 * tema) e, na falta dele, o valor salvo na conta.
 */
export async function getUserSettings(): Promise<VisualSettings> {
  const deviceSurface = await getDeviceSurface();
  const fallback: VisualSettings = {
    accent: DEFAULT_ACCENT,
    surface: deviceSurface ?? DEFAULT_SURFACE_STYLE,
  };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return fallback;

    const { error, data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) return fallback;

    // select('*') mantém a leitura funcionando mesmo antes da migration
    // que adiciona surface_style ser aplicada (fallback: cookie ou sólido).
    const row = data as { accent_color?: string; surface_style?: string } | null;

    return {
      accent: safeHex(row?.accent_color),
      surface: deviceSurface ?? safeSurfaceStyle(row?.surface_style),
    };
  } catch {
    return fallback;
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

