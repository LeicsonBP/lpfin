import { z } from 'zod';

import { parseMoneyInput } from '@/lib/money';

const monthSchema = z.coerce
  .number()
  .int('Mês inválido')
  .min(1, 'Mês deve estar entre 1 e 12')
  .max(12, 'Mês deve estar entre 1 e 12');

const yearSchema = z.coerce
  .number()
  .int('Ano inválido')
  .min(2000, 'Ano inválido')
  .max(2100, 'Ano inválido');

/** Aceita "1.234,56", "1234,56" ou número. */
const moneySchema = z.preprocess(
  (value) => (typeof value === 'string' ? parseMoneyInput(value) : value),
  z
    .number('Informe um valor válido')
    .min(0, 'O valor não pode ser negativo')
    .max(99_999_999.99, 'Valor muito alto'),
);


const daySchema = z.coerce
  .number()
  .int('Dia inválido')
  .min(1, 'Dia deve estar entre 1 e 31')
  .max(31, 'Dia deve estar entre 1 e 31');

const nameSchema = z
  .string()
  .trim()
  .min(1, 'Informe um nome')
  .max(80, 'Use no máximo 80 caracteres');

export const monthRefSchema = z.object({
  year: yearSchema,
  month: monthSchema,
});

export const cardSchema = z.object({
  name: nameSchema,
  credit_limit: moneySchema,
  closing_day: daySchema,
  due_day: daySchema,
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Use uma cor no formato #RRGGBB')
    .default('#0e6855'),
  is_active: z.boolean().default(true),
});

export const fixedBillSchema = z.object({
  name: nameSchema,
  due_day: daySchema,
  base_value: moneySchema,
  is_active: z.boolean().default(true),
});

/** Cadastro de conta: fixa (todo mês) ou parcelada (financiamento/empréstimo). */
export const fixedBillCreateSchema = fixedBillSchema
  .extend({
    kind: z.enum(['fixed', 'installment']).default('fixed'),
    installments_count: z.coerce.number().int().min(1).max(480).default(1),
    /** parcela em que a conta está hoje (ex.: 35 de 36) */
    current_installment: z.coerce.number().int().min(1).max(480).default(1),
    reference_year: yearSchema.optional(),
    reference_month: monthSchema.optional(),
  })
  .refine((data) => data.kind === 'fixed' || data.installments_count >= 1, {
    message: 'Informe o número de parcelas',
    path: ['installments_count'],
  })
  .refine((data) => data.current_installment <= data.installments_count, {
    message: 'A parcela atual não pode ser maior que o total',
    path: ['current_installment'],
  });

export const fixedBillEntrySchema = z.object({
  fixed_bill_id: z.string().uuid('Conta fixa inválida'),
  reference_year: yearSchema,
  reference_month: monthSchema,
  amount: moneySchema,
});

export const incomeSchema = z.object({
  description: nameSchema,
  amount: moneySchema,
  reference_year: yearSchema,
  reference_month: monthSchema,
  kind: z.enum(['salary', 'extra', 'other']).default('salary'),
  /** ganho recorrente (ex.: salário): gera até o mês do último compromisso cadastrado */
  is_recurring: z.boolean().default(false),
});

export const payrollDeductionSchema = z
  .object({
    name: nameSchema,
    amount: moneySchema,
    kind: z.enum(['fixed', 'installment']).default('fixed'),
    installments_count: z.coerce.number().int().min(1).max(120).default(1),
    /** parcela em que o débito está hoje (ex.: 11 de 12) */
    current_installment: z.coerce.number().int().min(1).max(120).default(1),
    reference_year: yearSchema,
    reference_month: monthSchema,
  })
  .refine((data) => data.kind === 'fixed' || data.installments_count >= 1, {
    message: 'Informe o número de parcelas',
    path: ['installments_count'],
  })
  .refine((data) => data.current_installment <= data.installments_count, {
    message: 'A parcela atual não pode ser maior que o total',
    path: ['current_installment'],
  });

export const transactionSchema = z.object({
  description: nameSchema,
  card_id: z
    .string()
    .uuid('Cartão inválido')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  /** apenas à vista ou à prazo */
  category: z.enum(['avista', 'aprazo']).default('avista'),
  total_amount: moneySchema,
  installments_count: z.coerce
    .number()
    .int('Número de parcelas inválido')
    .min(1, 'Mínimo de 1 parcela')
    .max(120, 'Máximo de 120 parcelas'),
  /** Mês da primeira parcela (respeita o fechamento do cartão) */
  start_year: yearSchema,
  start_month: monthSchema,
  is_subscription: z.boolean().default(false),
});

/** Uma linha do cadastro em lote: valor da parcela × quantidade. */
export const purchaseLineSchema = z
  .object({
    description: nameSchema,
    installment_amount: moneySchema,
    installments_count: z.coerce
      .number()
      .int('Número de parcelas inválido')
      .min(1, 'Mínimo de 1 parcela')
      .max(120, 'Máximo de 120 parcelas'),
    /** parcela que o usuário está cadastrando agora (ex.: 2 de 3) */
    current_installment: z.coerce.number().int().min(1).max(120).default(1),
  })
  .refine((line) => line.current_installment <= line.installments_count, {
    message: 'A parcela atual não pode ser maior que o total',
    path: ['current_installment'],
  });

/** Cadastro de várias compras no mesmo cartão, de uma só vez. */
export const purchaseBatchSchema = z.object({
  card_id: z
    .string()
    .uuid('Cartão inválido')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  start_year: yearSchema,
  start_month: monthSchema,
  lines: z.array(purchaseLineSchema).min(1, 'Informe ao menos uma compra').max(25),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido'),
  password: z.string().min(8, 'A senha precisa de ao menos 8 caracteres'),
});

export type CardInput = z.infer<typeof cardSchema>;
export type FixedBillInput = z.infer<typeof fixedBillSchema>;
export type FixedBillCreateInput = z.infer<typeof fixedBillCreateSchema>;
export type FixedBillEntryInput = z.infer<typeof fixedBillEntrySchema>;
export type IncomeInput = z.infer<typeof incomeSchema>;
export type PayrollDeductionInput = z.infer<typeof payrollDeductionSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
