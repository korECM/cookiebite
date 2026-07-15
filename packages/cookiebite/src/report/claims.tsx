import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface ClaimItem {
  text: string;
  evidence?: string;
  badge?: string;
}

export interface ClaimsProps {
  items: ClaimItem[];
  className?: string;
}

export function Claims({ items, className }: ClaimsProps) {
  return (
    <Card className={cn('gap-0 py-0', className)}>
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li
            key={item.text}
            className="grid grid-cols-[1fr_auto] items-start gap-4 px-6 py-4"
          >
            <div className="min-w-0 space-y-1">
              <p className="font-medium text-card-foreground">{item.text}</p>
              {item.evidence ? (
                <p className="text-sm text-muted-foreground">{item.evidence}</p>
              ) : null}
            </div>
            {item.badge ? (
              <Badge
                variant="outline"
                className="self-center whitespace-nowrap"
              >
                {item.badge}
              </Badge>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
