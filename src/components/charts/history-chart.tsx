'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatBRL } from '@/lib/format';

export interface HistoryDatum {
  label: string;
  cards: number;
  fixed: number;
  payroll: number;
}

/** Gráfico 1 — gastos mensais dos últimos 6 meses. */
export function HistoryChart({ data }: { data: HistoryDatum[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
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
          <Bar dataKey="cards" name="Cartões" stackId="a" fill="#118268" radius={[0, 0, 0, 0]} />
          <Bar dataKey="fixed" name="Contas fixas" stackId="a" fill="#45bd99" />
          <Bar dataKey="payroll" name="Folha" stackId="a" fill="#79d6b8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
