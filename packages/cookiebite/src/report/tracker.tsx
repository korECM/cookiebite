// ported from tremor (Apache-2.0) onto cookiebite tokens
import { cn } from '@/lib/utils';

export type TrackerStatus = 'success' | 'error' | 'warning' | 'neutral';

export interface TrackerBlock {
  status: TrackerStatus;
  label?: string;
}

export interface TrackerProps {
  data: TrackerBlock[];
  className?: string;
}

const STATUS_CLASS: Record<TrackerStatus, string> = {
  success: 'bg-success/70',
  error: 'bg-destructive/70',
  warning: 'bg-primary/40',
  neutral: 'bg-muted',
};

export function Tracker({ data, className }: TrackerProps) {
  return (
    <div className={cn('flex gap-[3px]', className)}>
      {data.map((block, index) => (
        <div
          key={index}
          className={cn(
            'h-8 min-w-1.5 flex-1 rounded-[4px]',
            STATUS_CLASS[block.status],
          )}
          title={block.label}
        />
      ))}
    </div>
  );
}
