import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { koGlue } from '@/lib/ko-text';

export interface PanelProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Data-unit frame — section is narrative; Panel wraps a chart/table/list. */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: PanelProps) {
  return (
    <Card
      className={cn(
        'gap-0 rounded-xl border bg-card py-0 shadow-xs',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 px-6 pt-5">
        <div className="min-w-0">
          <p className="text-base font-semibold text-foreground">{koGlue(title)}</p>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{koGlue(description)}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="px-6 py-5">{children}</div>
    </Card>
  );
}
