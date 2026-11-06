import { createClient } from '@/lib/supabase/server';
import { DEFAULT_ACCENT, safeHex } from '@/lib/color';

/** Cor de destaque do usuário atual (fallback: verde padrão). */
export async function getAccentColor(): Promise<string> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return DEFAULT_ACCENT;

    const { data } = await supabase
      .from('user_settings')
      .select('accent_color')
      .eq('user_id', user.id)
      .maybeSingle();

    return safeHex((data as { accent_color?: string } | null)?.accent_color);
  } catch {
    return DEFAULT_ACCENT;
  }
}
