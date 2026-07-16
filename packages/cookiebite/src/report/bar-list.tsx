// ported from tremor (Apache-2.0) onto cookiebite tokens
import { cn } from '@/lib/utils';
import { koGlue } from '@/lib/ko-text';

export interface BarListItem {
  name: string;
  value: number;
  unit?: string;
}

export interface BarListProps {
  items: BarListItem[];
  /** Default `desc`. Pass `none` to keep author order. */
  sort?: 'desc' | 'none';
  className?: string;
}

export function BarList({ items, sort = 'desc', className }: BarListProps) {
  const rows =
    sort === 'none'
      ? items
      : [...items].sort((a, b) => b.value - a.value);
  const max = Math.max(0, ...rows.map((r) => r.value));

  return (
    <div className={cn('flex flex-col', className)}>
      {rows.map((item) => {
        const pct = max > 0 ? (item.value / max) * 100 : 0;
        const display =
          item.unit != null ? `${item.value}${item.unit}` : String(item.value);

        return (
          <div
            key={item.name}
            className="grid grid-cols-[1fr_auto] items-center gap-3 py-1"
          >
            <div className="relative flex h-8 items-center">
              <div
                className="absolute inset-y-0 left-0 rounded-r-md bg-primary/15"
                style={{ width: `${pct}%` }}
              />
              <span className="z-10 truncate pl-2.5 text-sm text-foreground">
                {koGlue(item.name)}
              </span>
            </div>
            <span className="text-sm tabular-nums text-muted-foreground">
              {display}
            </span>
          </div>
        );
      })}
    </div>
  );
}
