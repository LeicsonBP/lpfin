import Link from 'next/link';

import { Badge, Card, EmptyState, SectionTitle } from '@/components/ui/kit';
import { GhostSubmitButton } from '@/components/ui/submit-button';
import {
  deleteIncomeAction,
  toggleIncomeReceivedAction,
} from '@/lib/actions/incomes';
import { deletePayrollDeductionAction, togglePayrollPaidAction } from '@/lib/actions/payroll';
import { formatBRL, formatInstallmentLabel } from '@/lib/format';
import { isOverdue } from '@/lib/finance';
import type {
  FixedBill,
  FixedBillEntry,
  Income,
  MonthRef,
  PayrollDeduction,
} from '@/lib/types';

import { FixedBillRow } from './fixed-bill-row';

export function FixedBillsSection({
  bills,
  entries,
  reference,
  monthLabel,
}: {
  bills: FixedBill[];
  entries: FixedBillEntry[];
  reference: MonthRef;
  monthLabel: string;
}) {
  const entryByBill = new Map(entries.map((entry) => [entry.fixed_bill_id, entry] as const));
  const activeBills = bills.filter((bill) => bill.is_active || entryByBill.has(bill.id));
  const total = activeBills.reduce((sum, bill) => {
    const entry = entryByBill.get(bill.id);
    return sum + (entry ? entry.amount : bill.base_value);
  }, 0);

  return (
    <Card>
      <SectionTitle
        title="Contas fixas"
        description={`Valores reais de ${monthLabel}`}
        action={<span className="money text-sm font-semibold text-ink">{formatBRL(total)}</span>}
      />

      {activeBills.length === 0 ? (
        <EmptyState
          title="Nenhuma conta fixa cadastrada"
          description="Cadastre contas como aluguel, energia e internet."
          action={
            <Link
              href="/contas-fixas"
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              Cadastrar conta fixa
            </Link>
          }
        />
      ) : (
        <ul>
          {activeBills.map((bill) => (
            <FixedBillRow
              key={bill.id}
              bill={bill}
              entry={entryByBill.get(bill.id) ?? null}
              reference={reference}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

export function PayrollSection({ payroll }: { payroll: PayrollDeduction[] }) {
  const total = payroll.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card>
      <SectionTitle
        title="Débitos em folha"
        action={<span className="money text-sm font-semibold text-ink">{formatBRL(total)}</span>}
      />

      {payroll.length === 0 ? (
        <EmptyState
          title="Nenhum débito em folha"
          description="Empréstimos e consignados descontados direto no salário."
        />
      ) : (
        <ul>
          {payroll.map((item) => (
            <li key={item.id} className="flex items-center gap-2 border-t border-line py-2 first:border-t-0">
              <span className="w-12 shrink-0 text-[11px] font-semibold text-ink-muted">
                {formatInstallmentLabel(item.installment_number, item.installment_total)}
              </span>

              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm ${item.is_paid ? 'text-ink-muted line-through' : 'text-ink'}`}>
                  {item.name}
                </p>
                {isOverdue(item) ? <Badge tone="negative">atrasado</Badge> : null}
              </div>

              <span className="money text-sm font-medium text-ink">{formatBRL(item.amount)}</span>

              <form action={togglePayrollPaidAction}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="paid" value={item.is_paid ? 'false' : 'true'} />
                <GhostSubmitButton>{item.is_paid ? 'pago' : 'pagar'}</GhostSubmitButton>
              </form>

              <form action={deletePayrollDeductionAction}>
                <input type="hidden" name="id" value={item.id} />
                <GhostSubmitButton className="text-negative" title="Excluir débito">
                  x
                </GhostSubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function IncomeSection({ incomes }: { incomes: Income[] }) {
  const total = incomes.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card>
      <SectionTitle
        title="Ganhos"
        action={<span className="money text-sm font-semibold text-positive">{formatBRL(total)}</span>}
      />

      {incomes.length === 0 ? (
        <EmptyState
          title="Nenhum ganho lançado"
          description="Cadastre salário, freelas e outras receitas do mês."
        />
      ) : (
        <ul>
          {incomes.map((income) => (
            <li key={income.id} className="flex items-center gap-2 border-t border-line py-2 first:border-t-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{income.description}</p>
                <p className="text-[11px] text-ink-muted">
                  {income.kind === 'salary' ? 'Salário' : income.kind === 'extra' ? 'Extra' : 'Outros'}
                </p>
              </div>

              <span className="money text-sm font-medium text-positive">
                {formatBRL(income.amount)}
              </span>

              <form action={toggleIncomeReceivedAction}>
                <input type="hidden" name="id" value={income.id} />
                <input type="hidden" name="received" value={income.is_received ? 'false' : 'true'} />
                <GhostSubmitButton>{income.is_received ? 'recebido' : 'receber'}</GhostSubmitButton>
              </form>

              <form action={deleteIncomeAction}>
                <input type="hidden" name="id" value={income.id} />
                <GhostSubmitButton className="text-negative" title="Excluir ganho">
                  x
                </GhostSubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
