'use client';

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatBRL } from '@/lib/format';

export interface ForecastDatum {
  label: string;
  cards: number;
  fixed: number;
  payroll: number;
  total: number;
}

/** Gráfico 2 — projeção dos próximos meses. */
export function ForecastChart({ data }: { data: ForecastDatum[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e3e8ee" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#5b6472' }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#5b6472' }}
            tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
          />
          <Tooltip
            formatter={(value) => formatBRL(Number(value))}
            contentStyle={{ borderRadius: 12, border: '1px solid #e3e8ee', fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="cards" name="Cartões (parcelas + média)" stackId="p" fill="#118268" />
          <Bar dataKey="fixed" name="Contas fixas (média)" stackId="p" fill="#45bd99" />
          <Bar dataKey="payroll" name="Folha" stackId="p" fill="#79d6b8" radius={[4, 4, 0, 0]} />
          <Line
            type="monotone"
            dataKey="total"
            name="Total projetado"
            stroke="#b42318"
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
