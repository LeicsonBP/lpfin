import 'server-only';

import { z } from 'zod';

import { publicEnv } from '@/lib/env';

/**
 * Variáveis exclusivas do servidor. `SUPABASE_SECRET_KEY` só deve ser usada
 * em rotinas administrativas (nunca no frontend).
 */
const serverSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(20).optional(),
  SUPABASE_JWKS_URL: z.string().url().optional(),
});

const parsed = serverSchema.safeParse({
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  SUPABASE_JWKS_URL: process.env.SUPABASE_JWKS_URL,
});

export const serverEnv = parsed.success ? parsed.data : {};

export { publicEnv };
