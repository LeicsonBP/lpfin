import Link from 'next/link';

import { Badge, Card, EmptyState, SectionTitle } from '@/components/ui/kit';
import { GhostSubmitButton } from '@/components/ui/submit-button';
import { deleteIncomeAction } from '@/lib/actions/incomes';
import { deletePayrollDeductionAction } from '@/lib/actions/payroll';
import { formatBRL, formatInstallmentLabel } from '@/lib/format';
import type {
  FixedBill,
  FixedBillEntry,
  Income,
  MonthRef,
  PayrollDeduction,
} from '@/lib/types';

import { FixedBillRow } from './fixed-bill-row';

/** Link curto usado no cabeçalho dos cards da visão mensal. */
function SectionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-[11px] font-semibold text-brand-700 hover:underline">
      {label}
    </Link>
  );
}

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
  const activeBills = bills.filter((bill) => {
    const entry = entryByBill.get(bill.id);

    // contas parceladas só aparecem nos meses em que a parcela existe
    if (bill.kind === 'installment') return Boolean(entry);

    return bill.is_active || Boolean(entry);
  });
  const total = activeBills.reduce((sum, bill) => {
    const entry = entryByBill.get(bill.id);
    return sum + (entry ? entry.amount : bill.base_value);
  }, 0);

  return (
    <Card>
      <SectionTitle
        title="Contas"
        description={`Valores reais de ${monthLabel}`}
        action={
          <div className="flex items-center gap-3">
            <span className="money text-sm font-semibold text-ink">{formatBRL(total)}</span>
            <SectionLink href="/contas" label="+ Nova" />
          </div>
        }
      />

      {activeBills.length === 0 ? (
        <EmptyState
          title="Nenhuma conta fixa cadastrada"
          description="Cadastre contas como aluguel, energia e internet."
          action={
            <Link
              href="/contas"
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              Cadastrar conta
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
        action={
          <div className="flex items-center gap-3">
            <span className="money text-sm font-semibold text-ink">{formatBRL(total)}</span>
            <SectionLink href="/debitos" label="+ Novo" />
          </div>
        }
      />

      {payroll.length === 0 ? (
        <EmptyState
          title="Nenhum débito em folha"
          description="Empréstimos e consignados descontados direto no salário."
          action={<SectionLink href="/debitos" label="Cadastrar débito" />}
        />
      ) : (
        <ul>
          {payroll.map((item) => (
            <li key={item.id} className="flex items-center gap-2 border-t border-line py-2 first:border-t-0">
              <span className="w-12 shrink-0 text-[11px] font-semibold text-ink-muted">
                {formatInstallmentLabel(item.installment_number, item.installment_total)}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{item.name}</p>
                <div className="flex items-center gap-1.5">
                  <Badge tone="neutral">automático</Badge>
                </div>
              </div>

              <span className="money text-sm font-medium text-ink">{formatBRL(item.amount)}</span>

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
        action={
          <div className="flex items-center gap-3">
            <span className="money text-sm font-semibold text-positive">{formatBRL(total)}</span>
            <SectionLink href="/ganhos" label="+ Novo" />
          </div>
        }
      />

      {incomes.length === 0 ? (
        <EmptyState
          title="Nenhum ganho lançado"
          description="Cadastre salário, freelas e outras receitas do mês."
          action={<SectionLink href="/ganhos" label="Lançar ganho" />}
        />
      ) : (
        <ul>
          {incomes.map((income) => (
            <li key={income.id} className="flex items-center gap-2 border-t border-line py-2 first:border-t-0">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm text-ink">
                  {income.description}
                  {income.is_recurring ? <Badge tone="brand">recorrente</Badge> : null}
                </p>
                <p className="text-[11px] text-ink-muted">
                  {income.kind === 'salary' ? 'Salário' : income.kind === 'extra' ? 'Extra' : 'Outros'}
                </p>
              </div>

              <span className="money text-sm font-medium text-positive">
                {formatBRL(income.amount)}
              </span>

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
