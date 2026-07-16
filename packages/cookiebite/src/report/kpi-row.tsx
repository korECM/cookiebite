import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface KpiDelta {
  value: string;
  direction: 'up' | 'down';
  /** Defaults to true when direction is `up`, false when `down`. */
  good?: boolean;
}

export interface KpiItem {
  label: string;
  value: string | number;
  unit?: string;
  delta?: KpiDelta;
  /** Comparison line under the value row (e.g. prior-period baseline). */
  compare?: string;
  /** Mini sparkline as a zero-height bottom backdrop (Stripe-dashboard pattern). */
  spark?: number[];
  caption?: string;
}

export interface KpiRowProps {
  items: KpiItem[];
  className?: string;
}

function deltaIsGood(delta: KpiDelta): boolean {
  return delta.good ?? delta.direction === 'up';
}

/**
 * Mini sparkline as fixed-viewBox SVG.
 * Recharts 3.x leaves AreaChart empty under SSR (wrapper only, no <svg>),
 * so a hand path keeps the series visible in the initial HTML and hydrates cleanly.
 */
function sparkPaths(series: number[], width = 160, height = 40, pad = 2) {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const n = series.length;
  const points = series.map((v, i) => {
    const x = n === 1 ? width / 2 : (i / (n - 1)) * width;
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return { x, y };
  });
  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
  const last = points[points.length - 1]!;
  const first = points[0]!;
  const area = `${line} L ${last.x.toFixed(2)} ${height} L ${first.x.toFixed(2)} ${height} Z`;
  return { line, area };
}

function KpiSpark({ series, gradientId }: { series: number[]; gradientId: string }) {
  const { line, area } = sparkPaths(series);

  return (
    <div className="h-10 w-full">
      <svg
        viewBox="0 0 160 40"
        width={160}
        height={40}
        className="!h-10 !w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.15} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="var(--chart-1)"
          strokeOpacity={0.8}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function KpiRow({ items, className }: KpiRowProps) {
  return (
    <Card
      className={cn(
        'gap-0 overflow-hidden rounded-xl border bg-card py-0 shadow-xs',
        className,
      )}
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        {items.map((item, index) => {
          const good = item.delta ? deltaIsGood(item.delta) : false;
          const Icon =
            item.delta?.direction === 'up'
              ? ArrowUpRight
              : item.delta?.direction === 'down'
                ? ArrowDownRight
                : null;
          const hasSpark = Boolean(item.spark && item.spark.length > 0);

          return (
            <div
              key={item.label}
              className={cn(
                'relative -ml-px -mt-px border-l border-t border-border p-5 sm:p-6',
                hasSpark && 'pb-8',
              )}
            >
              <div className="text-sm text-muted-foreground">{item.label}</div>
              <div className="mt-1 flex min-w-0 items-baseline gap-1">
                <span className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                  {item.value}
                </span>
                {item.unit ? (
                  <span className="text-sm font-normal text-muted-foreground">
                    {item.unit}
                  </span>
                ) : null}
              </div>
              {(item.delta && Icon) || item.compare ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {item.delta && Icon ? (
                    <span
                      className={cn(
                        'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums whitespace-nowrap',
                        good
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive',
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden />
                      {item.delta.value}
                    </span>
                  ) : null}
                  {item.compare ? (
                    <span className="text-xs text-muted-foreground">
                      {item.compare}
                    </span>
                  ) : null}
                </div>
              ) : null}
              {item.caption ? (
                <p className="mt-1 text-xs text-muted-foreground text-pretty">
                  {item.caption}
                </p>
              ) : null}
              {hasSpark ? (
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-10"
                  aria-hidden="true"
                >
                  <KpiSpark
                    series={item.spark!}
                    gradientId={`kpi-spark-${index}`}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
