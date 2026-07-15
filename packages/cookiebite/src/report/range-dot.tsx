import { cn } from '@/lib/utils';

export interface RangeDotItem {
  label: string;
  min: number;
  max: number;
  value: number;
  unit?: string;
}

export interface RangeDotProps {
  items: RangeDotItem[];
  domain?: { min: number; max: number };
  className?: string;
}

function pct(n: number, domainMin: number, domainMax: number): number {
  const span = domainMax - domainMin;
  if (span <= 0) return 0;
  return Math.min(100, Math.max(0, ((n - domainMin) / span) * 100));
}

function resolveDomain(
  items: RangeDotItem[],
  domain?: { min: number; max: number },
): { min: number; max: number } {
  if (domain) return domain;
  let min = Infinity;
  let max = -Infinity;
  for (const item of items) {
    min = Math.min(min, item.min, item.value);
    max = Math.max(max, item.max, item.value);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 1 };
  }
  return { min, max };
}

export function RangeDot({ items, domain, className }: RangeDotProps) {
  const d = resolveDomain(items, domain);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {items.map((item) => {
        const left = pct(item.min, d.min, d.max);
        const right = pct(item.max, d.min, d.max);
        const valuePos = pct(item.value, d.min, d.max);
        const unit = item.unit ?? '';
        return (
          <div
            key={item.label}
            className="grid grid-cols-[8rem_1fr_auto] items-center gap-3"
          >
            <div className="truncate text-sm font-medium text-foreground">
              {item.label}
            </div>
            <div className="relative h-1.5 rounded-full bg-muted">
              <span
                className="absolute inset-y-0 rounded-full bg-muted-foreground/30"
                style={{
                  left: `${left}%`,
                  width: `${Math.max(0, right - left)}%`,
                }}
              />
              <span
                className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
                style={{ left: `${valuePos}%` }}
                aria-hidden
              />
            </div>
            <div className="min-w-[4rem] text-right text-xs tabular-nums text-muted-foreground">
              {`${item.value}${unit}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
