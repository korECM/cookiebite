import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ColumnsProps {
  /** Column count from `md` up. Below `md` always stacks to 1. Default `2`. */
  n?: 2 | 3;
  children?: ReactNode;
  className?: string;
}

/** Side-by-side Panel grid — 1 col mobile, `n` cols from `md`. */
export function Columns({ n = 2, children, className }: ColumnsProps) {
  return (
    <div
      className={cn(
        // *:min-w-0 — 그리드 아이템 기본 min-width:auto가 넓은 차트에서 셀을 밀어내는 것 방지
        'grid gap-6 *:min-w-0',
        n === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2',
        className,
      )}
    >
      {children}
    </div>
  );
}
Columns.displayName = 'CookiebiteColumns';
