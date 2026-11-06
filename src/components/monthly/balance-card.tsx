import { Card, StatTile } from '@/components/ui/kit';
import { formatBRL } from '@/lib/format';
import type { MonthlySummary } from '@/lib/finance';

/** Balanço do mês: Ganhos - (Cartões + Contas Fixas + Débitos em Folha). */
export function BalanceCard({ summary }: { summary: MonthlySummary }) {
  const positive = summary.balance >= 0;

  return (
    <Card className="bg-gradient-to-br from-surface to-brand-50/60">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-700">
            Balanço do mês
          </p>
          <p
            className={`money mt-1 text-3xl font-semibold ${positive ? 'text-positive' : 'text-negative'}`}
          >
            {formatBRL(summary.balance)}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            {positive
              ? 'Sobrou dinheiro neste mês.'
              : 'Atenção: as saídas passaram das entradas.'}
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-4">
          <StatTile label="Ganhos" value={formatBRL(summary.incomeTotal)} tone="positive" />
          <StatTile label="Cartões" value={formatBRL(summary.cardsTotal)} />
          <StatTile label="Contas fixas" value={formatBRL(summary.fixedTotal)} />
          <StatTile label="Folha" value={formatBRL(summary.payrollTotal)} />
        </div>
      </div>
    </Card>
  );
}
