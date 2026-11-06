import { AppHeader } from '@/components/layout/nav';
import { ForecastChart } from '@/components/charts/forecast-chart';
import { HistoryChart } from '@/components/charts/history-chart';
import { Badge, Card, EmptyState, SectionTitle, StatTile } from '@/components/ui/kit';
import { getDashboardData } from '@/lib/data/monthly';
import {
  currentMonth,
  forecastNextMonths,
  historicalSeries,
  lastCommitmentMonth,
  parseMonthParam,
} from '@/lib/finance';
import { formatBRL, formatMonthLabel } from '@/lib/format';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ meses?: string; ano?: string; mes?: string }>;
}) {
  const params = await searchParams;
  const anchor = parseMonthParam(params.ano, params.mes);
  const monthsAhead = params.meses === '12' ? 12 : 6;

  const data = await getDashboardData(anchor);

  const history = historicalSeries({
    reference: anchor,
    months: 6,
    installments: data.installments,
    fixedEntries: data.fixedEntries,
    payroll: data.payroll,
  });

  const forecast = forecastNextMonths({
    anchor,
    monthsAhead,
    fixedBills: data.fixedBills,
    fixedHistory: data.fixedEntries,
    installments: data.installments,
    transactions: data.transactions,
    payroll: data.payroll,
  });

  const nextMonth = forecast[0];
  const endOfCommitments = lastCommitmentMonth(data.installments);
  const averageHistory =
    history.length > 0 ? history.reduce((sum, point) => sum + point.total, 0) / history.length : 0;

  return (
    <div className="space-y-4">
      <AppHeader
        title="Dashboard"
        subtitle="Histórico recente e projeção de cenários futuros"
      >
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface p-1 text-xs">
          <a
            href="/dashboard?meses=6"
            className={`rounded-lg px-3 py-1.5 font-semibold ${monthsAhead === 6 ? 'bg-primary text-on-primary' : 'text-ink-muted'}`}
          >
            6 meses
          </a>
          <a
            href="/dashboard?meses=12"
            className={`rounded-lg px-3 py-1.5 font-semibold ${monthsAhead === 12 ? 'bg-primary text-on-primary' : 'text-ink-muted'}`}
          >
            12 meses
          </a>
        </div>
      </AppHeader>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Média mensal (6m)"
          value={formatBRL(averageHistory)}
          hint="Média de gastos realizados"
        />
        <StatTile
          label="Projeção próximo mês"
          value={formatBRL(nextMonth?.total ?? 0)}
          hint={nextMonth ? formatMonthLabel(nextMonth.month) : '—'}
          tone="negative"
        />
        <StatTile
          label="Fim dos parcelamentos"
          value={endOfCommitments ? formatMonthLabel(endOfCommitments) : '—'}
          hint="Última parcela agendada"
        />
        <StatTile
          label="Contas fixas projetadas"
          value={formatBRL((nextMonth?.fixedDetails ?? []).reduce((sum, item) => sum + item.amount, 0))}
          hint="Média histórica / valor base"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle
            title="Gastos mensais"
            description="Últimos 6 meses (cartões + contas fixas + folha)"
          />
          <HistoryChart
            data={history.map((point) => ({
              label: formatMonthLabel(point.month).slice(0, 3),
              cards: point.cards,
              fixed: point.fixed,
              payroll: point.payroll,
            }))}
          />
        </Card>

        <Card>
          <SectionTitle
            title="Previsão futura"
            description={`Projeção de ${monthsAhead} meses a partir de ${formatMonthLabel(currentMonth()).toLowerCase()}`}
          />
          <ForecastChart
            data={forecast.map((point) => ({
              label: formatMonthLabel(point.month).slice(0, 3),
              cards: point.cards,
              fixed: point.fixed,
              payroll: point.payroll,
              total: point.total,
            }))}
          />
        </Card>
      </div>

      <Card>
        <SectionTitle
          title="Como a projeção é calculada"
          description="Regras de negócio do motor de previsão"
          action={<Badge tone="brand">automático</Badge>}
        />

        <ul className="grid gap-2 text-xs text-ink-muted sm:grid-cols-3">
          <li className="rounded-xl border border-line p-3">
            <p className="text-sm font-semibold text-ink">Contas fixas</p>
            <p className="mt-1">
              Média dos valores reais lançados nos últimos meses. Sem histórico, usa o valor base.
            </p>
          </li>
          <li className="rounded-xl border border-line p-3">
            <p className="text-sm font-semibold text-ink">Parcelas</p>
            <p className="mt-1">
              Soma exata das parcelas já geradas, respeitando ajustes individuais.
            </p>
          </li>
          <li className="rounded-xl border border-line p-3">
            <p className="text-sm font-semibold text-ink">Compras à vista</p>
            <p className="mt-1">
              Média histórica de novas compras à vista, descontando o que já está agendado no mês.
            </p>
          </li>
        </ul>
      </Card>

      {forecast.length === 0 ? (
        <EmptyState
          title="Sem dados para projetar"
          description="Cadastre contas fixas, compras ou débitos para ver a previsão."
        />
      ) : null}
    </div>
  );
}
