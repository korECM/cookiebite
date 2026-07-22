'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { findColumn, type ResultColumn, type ResultRow } from '@/lib/tabular';

export type ResultChartType = 'bar' | 'line' | 'area';

export interface ResultChartProps {
  id: string;
  columns: ResultColumn[];
  rows: ResultRow[];
  x: string;
  y: string[];
  type: ResultChartType;
  /** Plot height in px. Fixed rather than aspect-driven — see below. */
  height: number;
  locale?: string;
}

/** Axis ticks stay short so a 59,540,329 does not shove the plot area sideways. */
function compactTick(locale?: string) {
  const format = new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  });
  return (value: number) => (typeof value === 'number' ? format.format(value) : '');
}

export function ResultChart({
  id,
  columns,
  rows,
  x,
  y,
  type,
  height,
  locale,
}: ResultChartProps) {
  const config = Object.fromEntries(
    y.map((key, index) => [
      key,
      {
        label: findColumn(columns, key)?.label ?? key,
        color: `var(--chart-${(index % 5) + 1})`,
      },
    ]),
  ) satisfies ChartConfig;

  const axes = (
    <>
      <CartesianGrid vertical={false} />
      <XAxis dataKey={x} tickLine={false} axisLine={false} tickMargin={8} />
      <YAxis
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        width={52}
        tickFormatter={compactTick(locale)}
      />
      <ChartTooltip content={<ChartTooltipContent />} />
      {y.length > 1 ? <ChartLegend content={<ChartLegendContent />} /> : null}
    </>
  );

  return (
    // `aspect-auto` drops ChartContainer's default 16:9 — on a full-width report
    // column that works out to a ~650px plot, which swamps the table under it.
    <ChartContainer
      id={id}
      config={config}
      className="aspect-auto w-full"
      style={{ height }}
    >
      {type === 'line' ? (
        <LineChart accessibilityLayer data={rows}>
          {axes}
          {y.map((key) => (
            <Line
              key={key}
              dataKey={key}
              type="monotone"
              stroke={`var(--color-${key})`}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      ) : type === 'area' ? (
        <AreaChart accessibilityLayer data={rows}>
          {axes}
          {y.map((key) => (
            <Area
              key={key}
              dataKey={key}
              type="monotone"
              stroke={`var(--color-${key})`}
              fill={`var(--color-${key})`}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      ) : (
        <BarChart accessibilityLayer data={rows}>
          {axes}
          {y.map((key) => (
            <Bar key={key} dataKey={key} fill={`var(--color-${key})`} radius={4} />
          ))}
        </BarChart>
      )}
    </ChartContainer>
  );
}
