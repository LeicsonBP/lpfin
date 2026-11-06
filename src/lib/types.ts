export type UUID = string;
export type ISODate = string;
export type ISODateTime = string;

/** Referência de competência: o "Mês" não é tabela, é esta chave. */
export interface MonthRef {
  year: number;
  /** 1 = janeiro ... 12 = dezembro */
  month: number;
}

export interface Card {
  id: UUID;
  user_id: UUID;
  name: string;
  credit_limit: number;
  closing_day: number;
  due_day: number;
  color: string;
  is_active: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface FixedBill {
  id: UUID;
  user_id: UUID;
  name: string;
  due_day: number | null;
  base_value: number;
  category: string | null;
  /** fixa (todo mês) ou parcelada (financiamento/empréstimo) */
  kind: 'fixed' | 'installment';
  /** total de parcelas, quando kind = 'installment' */
  installments_count: number | null;
  is_active: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface FixedBillEntry {
  id: UUID;
  fixed_bill_id: UUID;
  user_id: UUID;
  reference_year: number;
  reference_month: number;
  amount: number;
  is_paid: boolean;
  paid_at: ISODateTime | null;
  notes: string | null;
  /** número/total da parcela (null em contas fixas comuns) */
  installment_number: number | null;
  installment_total: number | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export type IncomeKind = 'salary' | 'extra' | 'other';

export interface Income {
  id: UUID;
  user_id: UUID;
  description: string;
  amount: number;
  reference_year: number;
  reference_month: number;
  kind: IncomeKind;
  is_received: boolean;
  received_at: ISODateTime | null;
  /** agrupa as ocorrências de um ganho recorrente */
  series_id: UUID | null;
  is_recurring: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

/** Compras: apenas à vista ou à prazo (parceladas). */
export type TransactionCategory = 'avista' | 'aprazo';

export interface Transaction {
  id: UUID;
  user_id: UUID;
  card_id: UUID | null;
  description: string;
  category: TransactionCategory;
  total_amount: number;
  installments_count: number;
  purchase_date: ISODate;
  start_year: number;
  start_month: number;
  is_subscription: boolean;
  notes: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

/** Fatura do cartão em um mês (checkbox "pago"). */
export interface CardPayment {
  id: UUID;
  user_id: UUID;
  card_id: UUID;
  reference_year: number;
  reference_month: number;
  is_paid: boolean;
  paid_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface Installment {
  id: UUID;
  transaction_id: UUID;
  user_id: UUID;
  card_id: UUID | null;
  installment_number: number;
  installment_total: number;
  reference_year: number;
  reference_month: number;
  amount: number;
  is_paid: boolean;
  paid_at: ISODateTime | null;
  is_adjusted: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export type PayrollKind = 'fixed' | 'installment';

export interface PayrollDeduction {
  id: UUID;
  user_id: UUID;
  name: string;
  amount: number;
  kind: PayrollKind;
  installment_number: number | null;
  installment_total: number | null;
  reference_year: number;
  reference_month: number;
  is_paid: boolean;
  paid_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

/** Preferências do usuário (uma linha por usuário). */
export interface UserSettings {
  user_id: UUID;
  accent_color: string;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

/** Resultado padrão das Server Actions (usado com useActionState). */
export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
