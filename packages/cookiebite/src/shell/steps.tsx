import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { koGlue } from '@/lib/ko-text';

export interface StepItem {
  /** 좌측 키 컬럼 위에 붙는 짧은 라벨 — `1단계 · 즉시` 등. */
  kicker?: string;
  title: string;
  /** 이 단계의 결과를 한 줄로 — `+11.1 cores · 월 $320~485`. */
  summary?: string;
  /** 우측 본문. 문단, 표, 리스트 무엇이든. */
  children?: ReactNode;
}

export interface StepsProps {
  items: StepItem[];
  className?: string;
}

/**
 * 좌측 키 컬럼 + 우측 본문으로 단계를 쌓는다.
 *
 * 실행 계획, 마이그레이션 순서, 조사 단계처럼 **순서가 논지인** 내용을 위한 골격이다.
 * 좌측이 "무엇을 얼마나"를 고정하니 우측은 캡션이 아니라 문단으로 쓸 수 있다.
 */
export function Steps({ items, className }: StepsProps) {
  return (
    <div className={cn('divide-y divide-border', className)}>
      {items.map((item, i) => (
        <div
          key={`${item.title}-${i}`}
          className={cn(
            // *:min-w-0 — 우측에 넓은 표가 오면 좌측 트랙을 밀어내는 것 방지
            'grid gap-3 py-6 *:min-w-0 md:grid-cols-[minmax(0,200px)_minmax(0,1fr)] md:gap-10',
            i === 0 && 'pt-0',
          )}
        >
          <div>
            {item.kicker ? (
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {koGlue(item.kicker)}
              </p>
            ) : null}
            <p className="mt-1 text-base font-semibold text-card-foreground">
              {koGlue(item.title)}
            </p>
            {item.summary ? (
              <p className="mt-1 text-sm font-medium text-primary tabular-nums">
                {koGlue(item.summary)}
              </p>
            ) : null}
          </div>
          <div className="space-y-3 text-card-foreground [&_p]:text-pretty">
            {item.children}
          </div>
        </div>
      ))}
    </div>
  );
}
Steps.displayName = 'CookiebiteSteps';
