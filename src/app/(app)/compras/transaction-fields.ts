import type { EntityField } from '@/components/forms/entity-form';
import { currentMonth } from '@/lib/finance';
import {
  TRANSACTION_CATEGORIES,
  formatMonthLabel,
  monthSelectOptions,
  yearSelectOptions,
} from '@/lib/format';
import type { Card as CardModel, Installment, Transaction } from '@/lib/types';

const now = currentMonth();

/** Campos do formulário de compra (cadastro e edição). */
export function transactionFields(
  cards: CardModel[],
  transaction?: Transaction,
): EntityField[] {
  return [
    {
      name: 'description',
      label: 'Descrição',
      required: true,
      full: true,
      defaultValue: transaction?.description,
      placeholder: 'Celular, Mercado Livre, dentista...',
    },
    {
      name: 'card_id',
      label: 'Cartão',
      type: 'select',
      defaultValue: transaction?.card_id ?? '',
      placeholder: 'Sem cartão',
      options: cards.map((card) => ({ value: card.id, label: card.name })),
    },
    {
      name: 'category',
      label: 'Categoria',
      type: 'select',
      defaultValue: transaction?.category ?? 'outros',
      options: TRANSACTION_CATEGORIES.map((category) => ({ value: category, label: category })),
    },
    {
      name: 'total_amount',
      label: 'Valor total',
      type: 'money',
      required: true,
      defaultValue: transaction?.total_amount ?? 0,
    },
    {
      name: 'installments_count',
      label: 'Parcelas',
      type: 'number',
      min: 1,
      max: 120,
      required: true,
      defaultValue: transaction?.installments_count ?? 1,
      hint: 'As parcelas são geradas automaticamente',
    },
    {
      name: 'purchase_date',
      label: 'Data da compra',
      type: 'date',
      required: true,
      defaultValue: transaction?.purchase_date ?? new Date().toISOString().slice(0, 10),
    },
    {
      name: 'start_month',
      label: 'Mês da 1ª parcela',
      type: 'select',
      defaultValue: transaction?.start_month ?? now.month,
      options: monthSelectOptions(),
      required: true,
    },
    {
      name: 'start_year',
      label: 'Ano da 1ª parcela',
      type: 'select',
      defaultValue: transaction?.start_year ?? now.year,
      options: yearSelectOptions(),
      required: true,
    },
    {
      name: 'is_subscription',
      label: 'Assinatura recorrente',
      type: 'checkbox',
      defaultValue: transaction?.is_subscription ?? false,
    },
  ];
}

/** "Nov/2026 → Jan/2027" */
export function installmentRange(list: Installment[]): string {
  const first = list[0];
  const last = list[list.length - 1];
  if (!first || !last) return 'sem parcelas geradas';

  const start = formatMonthLabel({ year: first.reference_year, month: first.reference_month });
  const end = formatMonthLabel({ year: last.reference_year, month: last.reference_month });
  return `${start} → ${end}`;
}
