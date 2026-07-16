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
import { Page, type PageProps } from './page.tsx';
import {
  ArticleToc,
  PageNavDesktop,
  PageNavMobile,
  PagedController,
  type PageNavItem,
} from './nav.tsx';

export interface ReportProps {
  title: string;
  kicker?: string;
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

/**
 * React.Children 순회는 직접 자식과 배열만 펼친다.
 * Fragment(`<>...</>`) 안의 Section/Page는 수집되지 않는다(문서화된 제한).
 */
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

function splitPagedChildren(children: ReactNode): {
  standfirst: ReactNode;
  pages: {
    id: string;
    title: string;
    icon?: ReactNode;
    element: ReactElement;
  }[];
  rest: ReactNode[];
} {
  let standfirst: ReactNode = null;
  const pages: {
    id: string;
    title: string;
    icon?: ReactNode;
    element: ReactElement;
  }[] = [];
  const rest: ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (
      isValidElement(child) &&
      (child.type === Standfirst ||
        isElementOfType(child, 'CookiebiteStandfirst'))
    ) {
      standfirst = child;
    } else if (
      isValidElement(child) &&
      (child.type === Page || isElementOfType(child, 'CookiebitePage'))
    ) {
      const props = child.props as PageProps;
      if (props.id && props.title) {
        pages.push({
          id: props.id,
          title: props.title,
          icon: props.icon,
          element: child as ReactElement,
        });
      }
    } else if (child != null && child !== false) {
      rest.push(child);
    }
  });
  return { standfirst, pages, rest };
}

const SHELL_WIDTH =
  'w-full max-w-[1400px] mx-auto px-6 lg:px-10';

function ReportHeader({
  title,
  kicker,
  standfirst,
  controls,
}: {
  title: string;
  kicker?: string;
  standfirst: ReactNode;
  controls: boolean;
}) {
  return (
    <header
      className={cn(
        SHELL_WIDTH,
        'flex items-start justify-between gap-6 pt-10 pb-8',
      )}
    >
      <div className="min-w-0 flex-1 space-y-3">
        {kicker ? (
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-1 rounded-full bg-primary" />
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {kicker}
            </span>
          </div>
        ) : null}
        <h1 className="text-4xl font-bold tracking-tight text-balance leading-[1.15]">
          {title}
        </h1>
        {standfirst}
      </div>
      {controls ? <Controls className="shrink-0" /> : null}
    </header>
  );
}

function ArticleLayout({
  title,
  kicker,
  controls = true,
  toc = true,
  children,
  className,
}: ReportProps) {
  const tocItems = collectToc(children);
  const { standfirst, body } = splitChildren(children);

  return (
    <div className={cn('break-keep bg-background text-foreground', className)}>
      <ReportHeader
        title={title}
        kicker={kicker}
        standfirst={standfirst}
        controls={controls}
      />

      <div
        className={cn(
          SHELL_WIDTH,
          'flex gap-10 pb-16',
          toc ? 'items-start' : '',
        )}
      >
        <main className="min-w-0 flex-1 space-y-10">{body}</main>
        {toc ? (
          <aside className="hidden min-[1400px]:block w-52 shrink-0">
            <div className="sticky top-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                목차
              </p>
              <ArticleToc items={tocItems} />
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function PagedLayout({
  title,
  kicker,
  controls = true,
  children,
  className,
}: ReportProps) {
  const { standfirst, pages, rest } = splitPagedChildren(children);
  const pageIds = pages.map((p) => p.id);
  const navItems: PageNavItem[] = pages.map((p) => ({
    id: p.id,
    title: p.title,
    icon: p.icon,
  }));

  return (
    <div className={cn('break-keep bg-background text-foreground', className)}>
      <ReportHeader
        title={title}
        kicker={kicker}
        standfirst={standfirst}
        controls={controls}
      />

      <PagedController pageIds={pageIds}>
        {({ activeId, navigate }) => {
          const current = activeId || pageIds[0] || '';
          return (
            <div className={cn(SHELL_WIDTH, 'space-y-6 pb-16')}>
              <PageNavMobile
                items={navItems}
                activeId={current}
                onNavigate={navigate}
              />

              <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
                <PageNavDesktop
                  items={navItems}
                  activeId={current}
                  onNavigate={navigate}
                />
                <main className="min-w-0 space-y-10">
                  {pages.map((p) => p.element)}
                  {rest}
                </main>
              </div>
            </div>
          );
        }}
      </PagedController>
    </div>
  );
}

export function Report({
  layout = 'article',
  ...props
}: ReportProps) {
  if (layout === 'paged') {
    return <PagedLayout {...props} layout="paged" />;
  }
  return <ArticleLayout {...props} layout="article" />;
}
Report.displayName = 'CookiebiteReport';
