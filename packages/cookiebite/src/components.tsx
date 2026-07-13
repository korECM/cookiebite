import { useId, type ReactNode } from 'react';
import type { ThemeDocument } from './themes.ts';

export interface ReportProps {
  theme: ThemeDocument;
  title: string;
  lang?: string;
  children: ReactNode;
}

/** 문서 루트. 빌더가 theme, title, lang prop을 읽어 <head>를 조립한다. */
export function Report({ children }: ReportProps) {
  return <main>{children}</main>;
}
Report.displayName = 'CookiebiteReport';

export interface StandfirstProps {
  kicker?: string;
  headline: string;
  children?: ReactNode;
}

export function Standfirst({ kicker, headline, children }: StandfirstProps) {
  return (
    <header>
      {kicker === undefined ? null : <p className="cb-muted">{kicker}</p>}
      <h1>{headline}</h1>
      {children === undefined ? null : <p>{children}</p>}
    </header>
  );
}

export interface SectionProps {
  title: string;
  children: ReactNode;
}

export function Section({ title, children }: SectionProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      {children}
    </section>
  );
}

export interface SourcesProps {
  children: ReactNode;
}

export function Sources({ children }: SourcesProps) {
  return (
    <footer>
      <hr />
      <p className="cb-muted">{children}</p>
    </footer>
  );
}
