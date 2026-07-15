import type { ReactNode } from 'react';
import { useContext } from 'react';
import { cn } from '@/lib/utils';
import { PageVisibilityContext } from './nav.tsx';

export interface PageProps {
  id: string;
  title: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * paged 레이아웃의 한 장. SSR에서는 전부 세로로 쌓이고,
 * 하이드레이션 후 비활성 페이지만 hidden(인쇄 시 복원).
 * article 레이아웃 아래에서는 일반 section으로 관용 렌더.
 */
export function Page({ id, title, icon, children, className }: PageProps) {
  const { activeId, hydrated } = useContext(PageVisibilityContext);
  const inactive = hydrated && activeId != null && activeId !== id;

  return (
    <section
      id={id}
      data-page=""
      className={cn(
        'scroll-mt-8 space-y-6',
        inactive && 'hidden print:block',
        className,
      )}
    >
      <h2 className="flex items-center gap-2 border-b border-border pb-2 text-2xl font-semibold tracking-tight text-foreground">
        {icon ? <span className="shrink-0 [&_svg]:size-5">{icon}</span> : null}
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
Page.displayName = 'CookiebitePage';
