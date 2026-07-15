import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SectionProps {
  id: string;
  title: string;
  lede?: string;
  children?: ReactNode;
  className?: string;
}

export function Section({ id, title, lede, children, className }: SectionProps) {
  return (
    <section id={id} className={cn('scroll-mt-8 space-y-4', className)}>
      <div className="flex items-center gap-2.5">
        <span className="h-4 w-1 rounded-full bg-primary" />
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      {lede ? (
        <p className="max-w-prose text-muted-foreground text-pretty">{lede}</p>
      ) : null}
      <div className="space-y-4">{children}</div>
    </section>
  );
}
Section.displayName = 'CookiebiteSection';
