import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface AsideProps {
  /** 산문 쪽. 문단을 여러 개 넣는 자리다. */
  prose: ReactNode;
  /** 데이터 쪽 — Panel, 표, 차트, 코드 블록. */
  children?: ReactNode;
  /** 산문을 어느 쪽에 둘지. 기본 `left`. */
  side?: 'left' | 'right';
  className?: string;
}

/**
 * 산문과 데이터를 나란히 놓는 2열.
 *
 * `Columns`는 Panel 두 개를 대등하게 놓는 격자라 산문이 들어가면 카드 없는 텍스트가
 * 카드 옆에서 붕 뜬다. 여기서는 산문이 한쪽 열 전체를 갖고, 데이터가 그 옆에 선다.
 * `md` 아래에서는 항상 산문이 먼저 쌓인다.
 */
export function Aside({ prose, children, side = 'left', className }: AsideProps) {
  const proseCol = (
    <div className="space-y-3 text-card-foreground [&_p]:text-pretty">{prose}</div>
  );
  return (
    <div
      className={cn(
        // *:min-w-0 — 그리드 아이템 기본 min-width:auto가 넓은 표에서 셀을 밀어내는 것 방지
        'grid gap-6 *:min-w-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]',
        className,
      )}
    >
      {side === 'right' ? (
        <>
          <div className="md:order-2">{proseCol}</div>
          <div className="md:order-1">{children}</div>
        </>
      ) : (
        <>
          {proseCol}
          <div>{children}</div>
        </>
      )}
    </div>
  );
}
Aside.displayName = 'CookiebiteAside';
