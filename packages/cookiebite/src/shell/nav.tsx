import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import { resolveInitialPageId } from './resolve-page-id.mjs';

export { resolveInitialPageId };

export interface PageNavItem {
  id: string;
  title: string;
  icon?: ReactNode;
}

/** Page가 활성/하이드레이션 여부를 읽어 hidden을 적용. SSR 기본값은 전부 표시. */
export const PageVisibilityContext = createContext<{
  activeId: string | null;
  hydrated: boolean;
}>({ activeId: null, hydrated: false });

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: PageNavItem;
  active: boolean;
  onNavigate: (id: string) => void;
}) {
  return (
    <a
      href={`#${item.id}`}
      aria-current={active ? 'page' : undefined}
      onClick={(e) => {
        e.preventDefault();
        onNavigate(item.id);
      }}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
        active
          ? 'bg-muted text-foreground'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
      )}
    >
      {item.icon ? (
        <span className="shrink-0 [&_svg]:size-4">{item.icon}</span>
      ) : null}
      <span className="truncate">{item.title}</span>
    </a>
  );
}

export interface PageNavProps {
  items: PageNavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  className?: string;
}

/** lg 미만: 상단 가로 스크롤 탭. */
export function PageNavMobile({
  items,
  activeId,
  onNavigate,
  className,
}: PageNavProps) {
  return (
    <nav
      aria-label="Pages"
      className={cn('-mx-6 overflow-x-auto px-6 pb-2 lg:hidden', className)}
    >
      <ul className="flex w-max gap-1">
        {items.map((item) => (
          <li key={item.id} className="shrink-0">
            <NavLink
              item={item}
              active={activeId === item.id}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** lg+: article toc와 같은 좌측 sticky 슬롯. */
export function PageNavDesktop({
  items,
  activeId,
  onNavigate,
  className,
}: PageNavProps) {
  return (
    <nav aria-label="Pages" className={cn('hidden lg:block', className)}>
      <ul className="sticky top-8 space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <NavLink
              item={item}
              active={activeId === item.id}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** 모바일+데스크톱 네비 한 번에 (테스트·단순 사용). */
export function PageNav(props: PageNavProps) {
  return (
    <>
      <PageNavMobile {...props} />
      <PageNavDesktop {...props} />
    </>
  );
}

export interface ArticleTocProps {
  items: { id: string; title: string }[];
}

/** article 목차 + IntersectionObserver 스크롤스파이 (effect only, SSR-safe). */
export function ArticleToc({ items }: ArticleTocProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el != null);
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          );
        const id = visible[0]?.target.id;
        if (id) setActiveId(id);
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.25] },
    );

    for (const el of sections) observer.observe(el);
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="Table of contents" className="hidden lg:block">
      <ul className="sticky top-8 space-y-2">
        {items.map((item) => {
          const current = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={current ? 'true' : undefined}
                className={cn(
                  'text-sm',
                  current
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export interface PagedControllerProps {
  pageIds: string[];
  children: (ctx: {
    activeId: string;
    navigate: (id: string) => void;
  }) => ReactNode;
}

/** hash 동기화 + PageVisibilityContext 제공. */
export function PagedController({ pageIds, children }: PagedControllerProps) {
  const [activeId, setActiveId] = useState(pageIds[0] ?? '');
  const [hydrated, setHydrated] = useState(false);
  const pageIdsKey = pageIds.join('\0');

  useEffect(() => {
    const ids = pageIdsKey ? pageIdsKey.split('\0') : [];
    const next = resolveInitialPageId(
      typeof location !== 'undefined' ? location.hash : '',
      ids,
    );
    setActiveId(next);
    setHydrated(true);

    // back/forward + same-document '#page-id' links. navigate() uses
    // history.replaceState, which does not fire hashchange — so this
    // listener won't fight our own switches. Dedupe by resolved id anyway
    // (cheap; safe if pushState / location.hash assignment is ever used).
    function onHashChange() {
      const resolved = resolveInitialPageId(location.hash, ids);
      setActiveId((current) => (current === resolved ? current : resolved));
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [pageIdsKey]);

  function navigate(id: string) {
    setActiveId(id);
    try {
      history.replaceState(null, '', `#${id}`);
    } catch {
      /* ignore */
    }
  }

  return (
    <PageVisibilityContext.Provider value={{ activeId, hydrated }}>
      {children({ activeId, navigate })}
    </PageVisibilityContext.Provider>
  );
}
