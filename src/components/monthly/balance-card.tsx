import { Card, StatTile } from '@/components/ui/kit';
import { formatBRL } from '@/lib/format';
import type { MonthlySummary } from '@/lib/finance';
import { toCents } from '@/lib/money';

/** Balanço do mês: Ganhos - (Cartões + Contas + Débitos em Folha). */
export function BalanceCard({ summary }: { summary: MonthlySummary }) {
  const cents = toCents(summary.balance);
  const tone = cents > 0 ? 'positive' : cents < 0 ? 'negative' : 'neutral';

  const message =
    tone === 'positive'
      ? 'Sobrou dinheiro neste mês.'
      : tone === 'negative'
        ? 'Atenção: as saídas passaram das entradas.'
        : 'Entradas e saídas empatadas neste mês.';

  return (
    <Card
      className={
        tone === 'neutral'
          ? 'bg-gradient-to-br from-surface to-surface-muted/70'
          : 'glass-tint bg-gradient-to-br from-surface to-brand-50/60'
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-700">
            Balanço do mês
          </p>
          <p
            className={`money mt-1 text-3xl font-semibold ${
              tone === 'positive'
                ? 'text-positive'
                : tone === 'negative'
                  ? 'text-negative'
                  : 'text-ink'
            }`}
          >
            {formatBRL(summary.balance)}
          </p>
          <p className="mt-1 text-xs text-ink-muted">{message}</p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-4">
          <StatTile label="Ganhos" value={formatBRL(summary.incomeTotal)} tone="positive" flat />
          <StatTile label="Cartões" value={formatBRL(summary.cardsTotal)} flat />
          <StatTile label="Contas" value={formatBRL(summary.fixedTotal)} flat />
          <StatTile label="Folha" value={formatBRL(summary.payrollTotal)} flat />
        </div>
      </div>
    </Card>
  );
}

