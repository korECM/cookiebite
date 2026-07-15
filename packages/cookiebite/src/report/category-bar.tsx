// ported from tremor (Apache-2.0) onto cookiebite tokens
import { cn } from '@/lib/utils';

export interface CategoryBarSegment {
  label: string;
  value: number;
}

export interface CategoryBarProps {
  segments: CategoryBarSegment[];
  className?: string;
}

const SWATCH = [
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-4',
  'bg-chart-5',
] as const;

export function CategoryBar({ segments, className }: CategoryBarProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex h-2.5 overflow-hidden rounded-full">
        {segments.map((segment, i) => {
          const pct = total > 0 ? (segment.value / total) * 100 : 0;
          return (
            <div
              key={segment.label}
              className={SWATCH[i % SWATCH.length]}
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {segments.map((segment, i) => (
          <span key={segment.label} className="inline-flex items-center gap-1.5">
            <span
              className={cn('size-2 rounded-full', SWATCH[i % SWATCH.length])}
            />
            <span>{segment.label}</span>
            <span className="tabular-nums">{segment.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
