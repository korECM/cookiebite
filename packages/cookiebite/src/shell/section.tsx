import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { koGlue } from '@/lib/ko-text';

export interface SectionProps {
  id: string;
  title: string;
  lede?: string;
  children?: ReactNode;
  className?: string;
  /**
   * Set by `Report` when `numbered` — replaces the accent tick with a zero-padded
   * index (`01`, `02`, …). Not meant for hand-authoring.
   */
  number?: string;
}

export function Section({
  id,
  title,
  lede,
  children,
  className,
  number,
}: SectionProps) {
  return (
    <section id={id} className={cn('scroll-mt-8 space-y-4', className)}>
      <div className="flex items-center gap-2.5">
        {number ? (
          <span className="text-primary tabular-nums text-sm font-semibold">
            {number}
          </span>
        ) : (
          <span className="h-4 w-1 rounded-full bg-primary" />
        )}
        <h2 className="text-xl font-semibold tracking-tight">{koGlue(title)}</h2>
      </div>
      {lede ? (
        <p className="text-muted-foreground text-pretty">{koGlue(lede)}</p>
      ) : null}
      <div className="space-y-4">{children}</div>
    </section>
  );
}
Section.displayName = 'CookiebiteSection';
