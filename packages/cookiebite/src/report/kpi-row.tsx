import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
  caption?: string;
}

export interface KpiRowProps {
  items: KpiItem[];
  className?: string;
}

const XL_COLS: Record<number, string> = {
  1: 'xl:grid-cols-1',
  2: 'xl:grid-cols-2',
  3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4',
  5: 'xl:grid-cols-5',
  6: 'xl:grid-cols-6',
};

function deltaIsGood(delta: KpiDelta): boolean {
  return delta.good ?? delta.direction === 'up';
}

export function KpiRow({ items, className }: KpiRowProps) {
  const colCount = Math.min(Math.max(items.length, 1), 6);

  return (
    <div
      className={cn(
        'grid auto-rows-fr grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4',
        XL_COLS[colCount],
        className,
      )}
    >
      {items.map((item) => {
        const good = item.delta ? deltaIsGood(item.delta) : false;
        const Icon =
          item.delta?.direction === 'up'
            ? ArrowUpRight
            : item.delta?.direction === 'down'
              ? ArrowDownRight
              : null;

        return (
          <Card key={item.label} className="flex h-full flex-col">
            <CardContent className="flex flex-1 flex-col gap-2">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {item.label}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight tabular-nums">
                  {item.value}
                </span>
                {item.unit ? (
                  <span className="text-base text-muted-foreground">
                    {item.unit}
                  </span>
                ) : null}
              </div>
              {item.delta && Icon ? (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
                    good ? 'text-success' : 'text-destructive',
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {item.delta.value}
                </span>
              ) : null}
              {item.caption ? (
                <p className="mt-auto text-xs text-muted-foreground">
                  {item.caption}
                </p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
