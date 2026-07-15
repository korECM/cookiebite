import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import { Controls } from './controls.tsx';
import { Section, type SectionProps } from './section.tsx';
import { Standfirst } from './prose.tsx';

export interface ReportProps {
  title: string;
  kicker?: string;
  /** 빌드 파이프라인이 추출. 렌더에서는 무시. */
  theme?: object;
  layout?: 'article' | 'paged';
  controls?: boolean;
  toc?: boolean;
  children?: ReactNode;
  className?: string;
}

function isElementOfType(
  child: ReactNode,
  displayName: string,
): child is ReactElement {
  if (!isValidElement(child)) return false;
  const t = child.type as { displayName?: string };
  return t.displayName === displayName;
}

function collectToc(children: ReactNode): { id: string; title: string }[] {
  const items: { id: string; title: string }[] = [];
  Children.forEach(children, (child) => {
    if (
      isValidElement(child) &&
      (child.type === Section || isElementOfType(child, 'CookiebiteSection'))
    ) {
      const props = child.props as SectionProps;
      if (props.id && props.title) {
        items.push({ id: props.id, title: props.title });
      }
    }
  });
  return items;
}

function splitChildren(children: ReactNode): {
  standfirst: ReactNode;
  body: ReactNode[];
} {
  let standfirst: ReactNode = null;
  const body: ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (
      isValidElement(child) &&
      (child.type === Standfirst ||
        isElementOfType(child, 'CookiebiteStandfirst'))
    ) {
      standfirst = child;
    } else if (child != null && child !== false) {
      body.push(child);
    }
  });
  return { standfirst, body };
}

export function Report({
  title,
  kicker,
  theme: _theme,
  layout: _layout = 'article',
  controls = true,
  toc = true,
  children,
  className,
}: ReportProps) {
  void _theme;
  void _layout;

  const tocItems = collectToc(children);
  const { standfirst, body } = splitChildren(children);

  return (
    <div className={cn('bg-background text-foreground', className)}>
      <header className="mx-auto flex max-w-[1080px] items-start justify-between gap-6 px-6 pt-10 pb-8">
        <div className="min-w-0 flex-1 space-y-3">
          {kicker ? (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {kicker}
            </p>
          ) : null}
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {standfirst}
        </div>
        {controls ? <Controls className="shrink-0" /> : null}
      </header>

      <div
        className={cn(
          'mx-auto grid max-w-[1080px] gap-10 px-6 pb-16',
          toc ? 'lg:grid-cols-[14rem_minmax(0,1fr)]' : '',
        )}
      >
        {toc ? (
          <nav
            aria-label="Table of contents"
            className="hidden lg:block"
          >
            <ul className="sticky top-8 space-y-2">
              {tocItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <main className="min-w-0 space-y-10">{body}</main>
      </div>
    </div>
  );
}
Report.displayName = 'CookiebiteReport';
