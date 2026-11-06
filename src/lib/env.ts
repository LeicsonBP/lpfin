import { z } from 'zod';

/**
 * Variáveis públicas — seguras para o bundle do cliente.
 * Falham no boot (build/dev) caso estejam ausentes ou inválidas.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL inválida'),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(20, 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY inválida'),
});

const parsedPublic = publicSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

if (!parsedPublic.success) {
  const issues = parsedPublic.error.issues.map((issue) => issue.path.join('.')).join(', ');
  throw new Error(`Variáveis de ambiente públicas ausentes/inválidas: ${issues}`);
}

export const publicEnv = parsedPublic.data;
