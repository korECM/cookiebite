import { useContext, useId, type ReactNode } from 'react';
import { compileChartOptions } from '../lib/chart-compile.mjs';
import { registerCall, registerCss } from './collect.ts';
import { ThemeContext } from './theme-context.ts';

export interface ChartProps {
  type: string;
  data: Array<Record<string, string | number>>;
  semanticTypes: Record<string, string>;
  encodings: Record<string, string | { field: string }>;
  ariaLabel: string;
  height?: number;
}

const CHART_CSS = `.cb-chart { margin: calc(var(--cb-space-unit) * 6) 0; padding: calc(var(--cb-space-unit) * 4); }
.cb-chart > div { width: 100%; }`;

/** flint chartType + 데이터를 빌드 시점에 컴파일해 chart capability로 등록한다. */
export function Chart({
  type,
  data,
  semanticTypes,
  encodings,
  ariaLabel,
  height,
}: ChartProps): ReactNode {
  const theme = useContext(ThemeContext);
  const hostId = useId();
  if (theme === null) {
    throw new Error('Chart는 <Report> 안에서만 사용할 수 있습니다');
  }
  if (ariaLabel.trim() === '') {
    throw new Error('Chart: ariaLabel이 비어 있습니다 — 차트 설명을 채우세요.');
  }
  if (data.length === 0) {
    throw new Error('Chart: data가 비어 있습니다 — 행을 채우거나 컴포넌트를 제거하세요.');
  }

  const columns = Object.keys(data[0]);
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const keys = Object.keys(row);
    const missing = columns.filter((c) => !(c in row));
    const extra = keys.filter((k) => !columns.includes(k));
    if (missing.length > 0 || extra.length > 0 || keys.length !== columns.length) {
      const parts = [
        missing.length > 0 ? `누락 키: ${missing.join(', ')}` : null,
        extra.length > 0 ? `초과 키: ${extra.join(', ')}` : null,
      ].filter(Boolean);
      throw new Error(`Chart: data[${i}] 행이 균질하지 않습니다 — ${parts.join('; ')}`);
    }
  }

  registerCss('chart', CHART_CSS);
  const rows = data.map((r) => columns.map((c) => r[c]));
  const { light, dark, dropped } = compileChartOptions(
    { type, data, semanticTypes, encodings, height },
    theme,
  );
  if (dropped.length > 0) {
    console.warn(`cookiebite: chart option에서 제거됨: ${dropped.join(', ')}`);
  }
  registerCall({
    capability: 'chart',
    hostId,
    options: { light, dark, data: { columns, rows }, ariaLabel },
  });

  return (
    // shadcn Card 래핑 (MIT 정적 서브셋)
    <figure className="cb-chart rounded-xl border border-border bg-card text-card-foreground shadow-sm">
      <div id={hostId} style={{ height: `${height ?? 320}px` }} />
    </figure>
  );
}
