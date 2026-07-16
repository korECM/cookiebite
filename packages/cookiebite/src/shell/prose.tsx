import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { koGlue } from '@/lib/ko-text';

export interface StandfirstProps {
  children: ReactNode;
  className?: string;
}

/** 리드 문단 — 헤더 Standfirst 슬롯에 배치. */
export function Standfirst({ children, className }: StandfirstProps) {
  return (
    <p className={cn('max-w-prose text-lg text-muted-foreground text-pretty', className)}>
      {children}
    </p>
  );
}
Standfirst.displayName = 'CookiebiteStandfirst';

export interface SourceItem {
  label: string;
  href?: string;
  note?: string;
}

export interface SourcesProps {
  items: SourceItem[];
  className?: string;
}

export function Sources({ items, className }: SourcesProps) {
  return (
    <ol className={cn('list-decimal space-y-1 pl-5 text-sm text-foreground', className)}>
      {items.map((item, i) => (
        <li key={`${item.label}-${i}`} className="max-w-prose">
          {item.href ? (
            <a
              href={item.href}
              className="underline-offset-4 hover:underline"
            >
              {koGlue(item.label)}
            </a>
          ) : (
            <span>{koGlue(item.label)}</span>
          )}
          {item.note ? (
            <span className="text-muted-foreground">{` — ${koGlue(item.note)}`}</span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
Sources.displayName = 'CookiebiteSources';

export interface GlossaryTerm {
  term: string;
  def: string;
}

export interface GlossaryProps {
  terms: GlossaryTerm[];
  className?: string;
}

export function Glossary({ terms, className }: GlossaryProps) {
  return (
    <dl className={cn('grid gap-3 sm:grid-cols-[minmax(8rem,auto)_1fr]', className)}>
      {terms.map((t, i) => (
        <div key={`${t.term}-${i}`} className="contents">
          <dt className="font-medium text-foreground">{koGlue(t.term)}</dt>
          <dd className="text-muted-foreground">{koGlue(t.def)}</dd>
        </div>
      ))}
    </dl>
  );
}
Glossary.displayName = 'CookiebiteGlossary';

/** 산문 measure 제한 래퍼 — Section 본문 등에서 사용. */
export function Prose({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('max-w-prose space-y-4', className)}>{children}</div>;
}
