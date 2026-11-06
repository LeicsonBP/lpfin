import type { z } from 'zod';

import type { ActionResult } from '@/lib/types';

type Flattenable = { flatten(): { fieldErrors: Record<string, string[] | undefined> } };

/** Converte o erro do zod no formato consumido pelos formulários. */
export function zodFail(error: Flattenable): ActionResult<never> {
  const fieldErrors: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(error.flatten().fieldErrors)) {
    if (value && value.length > 0) fieldErrors[key] = value;
  }

  return {
    ok: false,
    error: 'Verifique os campos destacados.',
    fieldErrors,
  };
}

/** Traduz mensagens comuns do Postgres/Supabase. */
export function dbFail(message: string): ActionResult<never> {
  if (message.includes('duplicate key')) {
    return { ok: false, error: 'Já existe um registro com esses dados.' };
  }
  if (message.includes('row-level security')) {
    return { ok: false, error: 'Sem permissão para alterar este registro.' };
  }
  return { ok: false, error: message };
}

export function ok(message?: string): ActionResult {
  return { ok: true, data: undefined, message };
}

/** Lê um checkbox do formulário (ausente = false). */
export function checkbox(formData: FormData, name: string): boolean {
  const value = formData.get(name);
  return value === 'on' || value === 'true' || value === '1';
}

/** Lê um texto opcional (string vazia = undefined). */
export function optionalText(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

/** Extrai e valida o formulário com o schema informado. */
export function parseOrFail<T extends z.ZodType>(
  schema: T,
  data: unknown,
): { success: true; data: z.infer<T> } | { success: false; result: ActionResult<never> } {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return { success: false, result: zodFail(parsed.error) };
  }
  return { success: true, data: parsed.data };
}
