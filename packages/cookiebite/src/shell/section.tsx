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
      <h2 className="border-b border-border pb-2 text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {lede ? (
        <p className="max-w-prose text-muted-foreground text-pretty">{lede}</p>
      ) : null}
      <div className="space-y-4">{children}</div>
    </section>
  );
}
Section.displayName = 'CookiebiteSection';
