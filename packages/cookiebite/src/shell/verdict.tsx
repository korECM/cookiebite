import { Children, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { koGlue } from '@/lib/ko-text';

export type VerdictTone = 'default' | 'caution';

export interface VerdictProps {
  /** 위에 붙는 짧은 라벨 — `판정`, `주의` 등. */
  label?: string;
  tone?: VerdictTone;
  children: ReactNode;
  className?: string;
}

/**
 * 데이터 블록 **뒤에** 오는 판정 문단.
 *
 * Panel의 `description`이나 Section의 `lede`는 데이터를 소개하는 한 줄 캡션이다.
 * 해석은 데이터를 보고 난 다음에 온다 — 그 자리를 이 컴포넌트가 맡는다. children이
 * 문단이므로 근거, 반론, 단서를 이어서 쓸 수 있다.
 */
export function Verdict({ label, tone = 'default', children, className }: VerdictProps) {
  return (
    <aside
      className={cn(
        'rounded-r-lg border-l-2 bg-muted px-5 py-4',
        tone === 'caution' ? 'border-destructive' : 'border-primary',
        className,
      )}
    >
      {label ? (
        <p
          className={cn(
            'mb-1.5 text-xs font-semibold tracking-wide uppercase',
            tone === 'caution' ? 'text-destructive' : 'text-primary',
          )}
        >
          {koGlue(label)}
        </p>
      ) : null}
      <div className="space-y-3 text-card-foreground [&_p]:text-pretty">
        {Children.map(children, (child) =>
          typeof child === 'string' ? <p>{koGlue(child)}</p> : child,
        )}
      </div>
    </aside>
  );
}
Verdict.displayName = 'CookiebiteVerdict';
