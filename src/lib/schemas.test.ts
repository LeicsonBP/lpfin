import { describe, expect, it } from 'vitest';

import { fixedBillCreateSchema } from '@/lib/schemas';

describe('fixedBillCreateSchema', () => {
  const base = {
    name: 'RGE',
    due_day: '10',
    base_value: '150,00',
    is_active: true,
  };

  it('aceita conta fixa sem mês/ano (campos escondidos no formulário)', () => {
    const parsed = fixedBillCreateSchema.safeParse({
      ...base,
      kind: 'fixed',
      installments_count: 1,
      current_installment: 1,
      reference_year: undefined,
      reference_month: undefined,
    });

    expect(parsed.success).toBe(true);
  });

  it('trata mês/ano nulos ou vazios vindos do FormData', () => {
    for (const blank of [undefined, null, '']) {
      const parsed = fixedBillCreateSchema.safeParse({
        ...base,
        kind: 'fixed',
        installments_count: 1,
        current_installment: 1,
        reference_year: blank,
        reference_month: blank,
      });

      expect(parsed.success).toBe(true);
    }
  });

  it('mantém mês/ano e as parcelas quando a conta é parcelada', () => {
    const parsed = fixedBillCreateSchema.parse({
      ...base,
      kind: 'installment',
      installments_count: '36',
      current_installment: '35',
      reference_year: '2026',
      reference_month: '11',
    });

    expect(parsed.reference_year).toBe(2026);
    expect(parsed.reference_month).toBe(11);
    expect(parsed.installments_count).toBe(36);
    expect(parsed.current_installment).toBe(35);
  });

  it('recusa parcela atual maior que o total', () => {
    const parsed = fixedBillCreateSchema.safeParse({
      ...base,
      kind: 'installment',
      installments_count: '10',
      current_installment: '11',
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.path).toEqual(['current_installment']);
    }
  });

  it('exige nome e valor', () => {
    const parsed = fixedBillCreateSchema.safeParse({
      ...base,
      name: '   ',
      base_value: '',
    });

    expect(parsed.success).toBe(false);
  });
});
