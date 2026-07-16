import { Info, OctagonAlert, TriangleAlert } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { koGlue } from '@/lib/ko-text';

export type FindingSeverity = 'critical' | 'warning' | 'info';

export interface FindingItem {
  severity: FindingSeverity;
  title: string;
  detail?: string;
}

export interface FindingsProps {
  items: FindingItem[];
  className?: string;
}

const SEVERITY = {
  critical: {
    Icon: OctagonAlert,
    variant: 'destructive' as const,
    iconClass: undefined,
  },
  warning: {
    Icon: TriangleAlert,
    variant: 'default' as const,
    iconClass: 'text-muted-foreground',
  },
  info: {
    Icon: Info,
    variant: 'default' as const,
    iconClass: 'text-muted-foreground/70',
  },
};

export function Findings({ items, className }: FindingsProps) {
  return (
    <div className={cn('flex min-w-0 max-w-full flex-col gap-3', className)}>
      {items.map((item) => {
        const { Icon, variant, iconClass } = SEVERITY[item.severity];
        return (
          <Alert
            key={item.title}
            variant={variant}
            className="box-border min-w-0 max-w-full"
          >
            <Icon className={iconClass} aria-hidden />
            <AlertTitle>{koGlue(item.title)}</AlertTitle>
            {item.detail ? (
              <AlertDescription>{koGlue(item.detail)}</AlertDescription>
            ) : null}
          </Alert>
        );
      })}
    </div>
  );
}
