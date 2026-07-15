import { ArrowDown, ArrowUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
            ? ArrowUp
            : item.delta?.direction === 'down'
              ? ArrowDown
              : null;

        return (
          <Card key={item.label} className="flex h-full flex-col">
            <CardContent className="flex flex-1 flex-col gap-2">
              <div className="text-sm text-muted-foreground">{item.label}</div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight tabular-nums text-card-foreground">
                  {item.value}
                </span>
                {item.unit ? (
                  <span className="text-base text-muted-foreground">
                    {item.unit}
                  </span>
                ) : null}
              </div>
              {item.delta && Icon ? (
                <Badge
                  variant={good ? 'secondary' : 'outline'}
                  className={cn(
                    'gap-1',
                    good
                      ? 'text-foreground'
                      : 'border-destructive text-destructive',
                  )}
                >
                  <Icon className="size-3" aria-hidden />
                  {item.delta.value}
                </Badge>
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
