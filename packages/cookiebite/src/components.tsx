// 컴포넌트 인덱스 (1줄 시그니처):
//   Report({ theme, title, lang?, controls?, children })     — 문서 쉘 (controls 기본 true: 다크/밀도 토글)
//   Section({ title, children, id? })                        — 섹션 (id 주면 section/h2 앵커 고정)
//   KpiRow({ items: KpiItem[] })                             — KPI 카드 줄 (dl)
//   Claims({ items: ClaimItem[], title? })                   — 주장→증거 앵커 목록 (evidence: '#section-id')
//   Findings({ items: FindingItem[] })                       — 심각도 배지 발견 목록
//   Matrix({ rows, cols, data, max?, format?, ariaLabel, caption? }) — accent 오버레이 히트 테이블
//   RangeDot({ rows, domain?, format?, unit?, ariaLabel })   — min-max-value SVG figure
//   Chart({ type, data, semanticTypes, encodings, ariaLabel, height? }) — flint spec 차트 (chart.tsx, chart capability 등록)
//   (쉘: Report, Standfirst, Section, Sources / capability: Table, Glossary → capability-components.tsx)
import { useId, type ReactNode } from 'react';
import { resolveTheme } from '../lib/resolve-theme.mjs';
import type { ThemeDocument } from './themes.ts';
import { registerCss, registerFlag } from './collect.ts';
import { ThemeContext } from './theme-context.ts';

export interface ReportProps {
  theme: ThemeDocument;
  title: string;
  lang?: string;
  /** 다크/밀도 토글 클러스터. 기본 true — false면 마크업·JS 모두 생략. */
  controls?: boolean;
  children: ReactNode;
}

const CONTROLS_CSS = `.cb-controls {
  position: fixed;
  top: calc(var(--cb-space-unit) * 4);
  right: calc(var(--cb-space-unit) * 4);
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: calc(var(--cb-space-unit) * 2);
}
.cb-controls button {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--cb-space-unit) * 2);
  padding: calc(var(--cb-space-unit) * 2) calc(var(--cb-space-unit) * 3);
  border: 1px solid var(--cb-divider);
  border-radius: var(--cb-radius);
  background: var(--cb-surface);
  color: var(--cb-text);
  font: inherit;
  font-size: 0.85em;
  cursor: pointer;
}
.cb-controls button:hover { color: var(--cb-accent); border-color: var(--cb-accent); }
.cb-controls button:focus-visible {
  outline: 2px solid var(--cb-focus);
  outline-offset: 2px;
}
.cb-controls [aria-hidden="true"] { opacity: 0.85; }
@media (max-width: 640px) {
  .cb-controls {
    position: static;
    top: auto;
    right: auto;
    margin: calc(var(--cb-space-unit) * 4) calc(var(--cb-space-unit) * 4) 0 auto;
    align-items: flex-end;
  }
}
@media print {
  .cb-controls { display: none; }
}`;

function ControlsCluster() {
  registerFlag('controls');
  registerCss('controls', CONTROLS_CSS);
  return (
    <div className="cb-controls" role="group" aria-label="Report controls">
      <button type="button" data-cb-toggle="theme" aria-pressed="false" aria-label="Toggle dark mode">
        <span aria-hidden="true">◐</span>
        Dark
      </button>
      <button type="button" data-cb-toggle="density" aria-label="Cycle density">
        <span aria-hidden="true">☰</span>
        <span data-cb-density-label="">comfortable</span>
      </button>
    </div>
  );
}

/** 문서 루트. 빌더가 theme, title, lang prop을 읽어 <head>를 조립한다. */
export function Report({ theme, controls = true, children }: ReportProps) {
  // Chart compile이 context theme을 쓰므로 Provider에서 파생 dark를 채운다.
  return (
    <ThemeContext.Provider value={resolveTheme(theme)}>
      {controls ? <ControlsCluster /> : null}
      <main>{children}</main>
    </ThemeContext.Provider>
  );
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
  /** 주어지면 section id와 h2 id(`${id}-title`)를 고정해 Claims evidence 앵커로 쓴다. */
  id?: string;
}

export function Section({ title, children, id }: SectionProps) {
  const autoId = useId();
  const headingId = id === undefined ? autoId : `${id}-title`;
  return (
    <section id={id} aria-labelledby={headingId}>
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

export interface KpiItem {
  label: string;
  value: string | number;
  unit?: string;
  delta?: { dir: 'up' | 'down' | 'flat'; text: string; tone: 'success' | 'critical' | 'neutral' };
  note?: string;
}

const ARROW = { up: '▲', down: '▼', flat: '—' } as const;

// shadcn Card 룩은 TW 유틸. 밀도(--cb-space-unit) 간격만 CSS 청크.
const KPIS_CSS = `.cb-kpis {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: calc(var(--cb-space-unit) * 4); margin: 0; align-items: start;
}
.cb-kpi { padding: calc(var(--cb-space-unit) * 4); }
.cb-delta { display: block; font-size: 0.8em; margin-block-start: 0.35em; }
.cb-tone-success, .cb-tone-critical { color: var(--cb-accent-strong); }
.cb-tone-critical { font-weight: 600; }
.cb-note { margin: 0.25em 0 0; }`;

/** KPI 줄. 값은 큰 숫자, 델타는 기호+텍스트로 방향을 알린다 (색 단독 금지). */
export function KpiRow({ items }: { items: KpiItem[] }) {
  registerCss('kpis', KPIS_CSS);
  return (
    <dl className="cb-kpis">
      {items.map((item, index) => (
        // shadcn/ui Card 정적 서브셋 (MIT) — rounded-xl border bg-card shadow-sm
        <div
          className="cb-kpi rounded-xl border border-border bg-card text-card-foreground shadow-sm"
          key={index}
        >
          <dt className="text-sm text-muted-foreground">{item.label}</dt>
          <dd className="m-0">
            <strong className="text-2xl font-semibold tracking-tight tabular-nums">{item.value}</strong>
            {item.unit === undefined ? null : (
              <small className="text-muted-foreground"> {item.unit}</small>
            )}
            {item.delta === undefined ? null : (
              <span className={`cb-delta cb-tone-${item.delta.tone} text-muted-foreground`}>
                {ARROW[item.delta.dir]} {item.delta.text}
              </span>
            )}
            {item.note === undefined ? null : (
              <p className="cb-note text-sm text-muted-foreground">{item.note}</p>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export interface ClaimItem {
  claim: string;
  evidence?: string;
  value?: string;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'critical';
}

// 도트(::before)·톤 변수는 TW가 못 함. 값 칩은 Badge 룩 TW.
const CLAIMS_CSS = `.cb-claims { margin: 0; }
.cb-claims-title { margin: 0 0 calc(var(--cb-space-unit) * 2); }
.cb-claims ol { list-style: none; margin: 0; padding: 0;
  display: grid; gap: calc(var(--cb-space-unit) * 2); }
.cb-claim { display: flex; align-items: baseline; gap: calc(var(--cb-space-unit) * 2);
  padding-inline-start: calc(var(--cb-space-unit) * 3); }
.cb-claim::before { content: ""; flex: none; align-self: center;
  width: 0.5em; height: 0.5em; border-radius: 50%;
  background: var(--cb-claim-dot, var(--cb-text-muted)); }
.cb-claim a { color: inherit; }
.cb-claim-value { margin-inline-start: auto; font-variant-numeric: tabular-nums; text-wrap: nowrap; }
.cb-claim.cb-tone-neutral { --cb-claim-dot: var(--cb-text-muted); }
.cb-claim.cb-tone-info { --cb-claim-dot: var(--cb-accent); }
.cb-claim.cb-tone-success { --cb-claim-dot: var(--cb-accent-strong); }
.cb-claim.cb-tone-warning { --cb-claim-dot: var(--cb-accent-strong); }
.cb-claim.cb-tone-critical { --cb-claim-dot: var(--cb-accent-strong); font-weight: 600; }`;

/** 핵심 주장 목록. 톤은 앞쪽 도트 색(--cb-claim-dot)으로, 근거가 있으면 링크. */
export function Claims({ items, title }: { items: ClaimItem[]; title?: string }) {
  registerCss('claims', CLAIMS_CSS);
  return (
    <nav className="cb-claims" aria-label={title ?? '핵심 주장'}>
      {title === undefined ? null : (
        <p className="cb-claims-title text-sm text-muted-foreground">{title}</p>
      )}
      <ol>
        {items.map((item, index) => (
          <li className={`cb-claim cb-tone-${item.tone ?? 'neutral'} text-card-foreground`} key={index}>
            {item.evidence === undefined ? (
              <span>{item.claim}</span>
            ) : (
              <a href={item.evidence}>{item.claim}</a>
            )}
            {item.value === undefined ? null : (
              // shadcn/ui Badge outline 정적 서브셋 (MIT)
              <span className="cb-claim-value inline-flex items-center rounded-md border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                {item.value}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export interface FindingItem {
  tone: 'critical' | 'warning' | 'info' | 'neutral' | 'success';
  title: string;
  where?: string;
  note?: string;
  label?: string;
}

const SEV_LABEL = {
  critical: 'Critical',
  warning: 'High',
  info: 'Medium',
  neutral: 'Low',
  success: 'Note',
} as const;

// 레이아웃 간격만 CSS. Badge variant 색은 TW (border+텍스트 — 색 단독 금지).
const FINDINGS_CSS = `.cb-findings { list-style: none; margin: 0; padding: 0;
  display: grid; gap: calc(var(--cb-space-unit) * 3); }
.cb-finding { display: flex; align-items: baseline; gap: calc(var(--cb-space-unit) * 3); }
.cb-badge { flex: none; text-transform: uppercase; letter-spacing: 0.02em; text-wrap: nowrap; }
.cb-finding-title { margin: 0; }
.cb-note { margin: 0.25em 0 0; }`;

const BADGE_TONE = {
  critical: 'border-accent-strong text-accent-strong',
  warning: 'border-primary text-accent-strong',
  info: 'border-primary text-primary',
  neutral: 'border-border text-muted-foreground',
  success: 'border-accent-strong text-accent-strong',
} as const;

/** 발견 목록. 심각도는 보더+텍스트 배지, 색은 accent 계열 보조로만. */
export function Findings({ items }: { items: FindingItem[] }) {
  registerCss('findings', FINDINGS_CSS);
  return (
    <ul className="cb-findings">
      {items.map((item, index) => (
        <li className={`cb-finding cb-tone-${item.tone}`} key={index}>
          {/* shadcn/ui Badge outline variant 정적 서브셋 (MIT) — critical은 border+진한 텍스트 */}
          <span
            className={`cb-badge inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${BADGE_TONE[item.tone]}`}
          >
            {item.label ?? SEV_LABEL[item.tone]}
          </span>
          <div>
            <p className="cb-finding-title text-card-foreground">{item.title}</p>
            {item.where === undefined ? null : (
              <code className="text-sm text-muted-foreground">{item.where}</code>
            )}
            {item.note === undefined ? null : (
              <p className="cb-note text-sm text-muted-foreground">{item.note}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export interface MatrixProps {
  rows: string[];
  cols: string[];
  data: number[][];
  max?: number;
  format?: (v: number) => string;
  ariaLabel: string;
  caption?: string;
}

// 램프 셀(.cb-heat) 인라인 opacity + 셀 isolation은 TW로 불가.
const MATRIX_CSS = `.cb-matrix { margin: 0; overflow: hidden; }
.cb-matrix table { border-collapse: collapse; font-variant-numeric: tabular-nums; }
.cb-matrix th, .cb-matrix td {
  border: 1px solid var(--cb-divider);
  padding: calc(var(--cb-space-unit) * 2); text-align: center;
}
.cb-matrix td { position: relative; isolation: isolate; }
.cb-matrix .cb-heat { position: absolute; inset: 0; z-index: -1;
  background: var(--cb-accent); }
.cb-matrix figcaption { margin-block-start: calc(var(--cb-space-unit) * 2);
  padding-inline: calc(var(--cb-space-unit) * 3); padding-block-end: calc(var(--cb-space-unit) * 2); }`;

/** 히트맵 테이블. 셀마다 accent 오버레이 불투명도로 강도를 표현한다. 잉크는 항상 --cb-text. */
export function Matrix({ rows, cols, data, max, format, ariaLabel, caption }: MatrixProps) {
  registerCss('matrix', MATRIX_CSS);
  const flat = data.flat();
  const effectiveMax = max ?? (flat.length === 0 ? 0 : Math.max(...flat));

  return (
    // shadcn Card + Table 정적 서브셋 (MIT)
    <figure className="cb-matrix rounded-xl border border-border bg-card text-card-foreground shadow-sm">
      <table className="w-full caption-bottom text-sm">
        <caption className="px-3 py-2 text-left text-sm text-muted-foreground">{ariaLabel}</caption>
        <thead>
          <tr className="border-b">
            <th scope="col" className="h-10 px-2 text-muted-foreground font-medium" />
            {cols.map((col) => (
              <th scope="col" key={col} className="h-10 px-2 text-muted-foreground font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row} className="border-b">
              <th scope="row" className="px-2 font-medium text-muted-foreground">
                {row}
              </th>
              {(data[ri] ?? []).map((v, ci) => {
                // 셀 강도는 accent 오버레이 불투명도로 표현한다(최대 0.6). td 자체 배경은
                // 투명하게 두어 대비 계측이 실제 잉크 대 페이지 배경을 읽도록 한다.
                const opacity =
                  effectiveMax <= 0 ? 0 : Math.min(0.6, Math.max(0, (v / effectiveMax) * 0.6));
                return (
                  <td key={`${ri}-${ci}`} className="p-2 text-card-foreground">
                    <span className="cb-heat" style={{ opacity }} aria-hidden="true" />
                    {format?.(v) ?? String(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {caption === undefined ? null : (
        <figcaption className="text-sm text-muted-foreground">{caption}</figcaption>
      )}
    </figure>
  );
}

export interface RangeDotRow {
  label: string;
  min: number;
  max: number;
  value: number;
}

export interface RangeDotProps {
  rows: RangeDotRow[];
  domain?: [number, number];
  format?: (v: number) => string;
  unit?: string;
  ariaLabel: string;
}

// SVG 레이아웃만. .cb-visually-hidden은 core CSS에 있음.
const RANGEDOT_CSS = `.cb-rangedot { margin: 0; position: relative; padding: calc(var(--cb-space-unit) * 4); }
.cb-rangedot svg { display: block; width: 100%; height: auto; }`;

/** min–max 캡슐과 value 도트를 한 SVG figure로 그린다. */
export function RangeDot({ rows, domain, format, unit, ariaLabel }: RangeDotProps) {
  registerCss('rangedot', RANGEDOT_CSS);
  const lo = domain?.[0] ?? Math.min(...rows.map((r) => r.min));
  const hi = domain?.[1] ?? Math.max(...rows.map((r) => r.max));
  const xOf = (v: number) => (hi === lo ? 380 : 160 + ((v - lo) / (hi - lo)) * 440);
  const height = rows.length * 40;

  return (
    // shadcn Card 래핑 (MIT 정적 서브셋)
    <figure
      className="cb-rangedot rounded-xl border border-border bg-card text-card-foreground shadow-sm"
      role="img"
      aria-label={ariaLabel}
    >
      <svg viewBox={`0 0 640 ${height}`} role="presentation">
        {rows.map((row, i) => {
          const y = i * 40 + 20;
          const xMin = xOf(row.min);
          const xMax = xOf(row.max);
          const xVal = xOf(row.value);
          // U+2009 thin space keeps the unit readable without a full word gap.
          const valueText = `${format?.(row.value) ?? String(row.value)}${unit === undefined ? '' : `\u2009${unit}`}`;
          return (
            <g key={row.label}>
              <text x={8} y={y} dominantBaseline="middle" fill="var(--cb-text)">
                {row.label}
              </text>
              <line
                x1={xMin}
                y1={y}
                x2={xMax}
                y2={y}
                stroke="var(--cb-divider)"
                strokeWidth={6}
                strokeLinecap="round"
              />
              <circle cx={xVal} cy={y} r={5} fill="var(--cb-accent)" />
              <text x={xVal} y={y - 10} textAnchor="middle" fill="var(--cb-text-muted)" fontSize={11}>
                {valueText}
              </text>
            </g>
          );
        })}
      </svg>
      <table className="cb-visually-hidden">
        <thead>
          <tr>
            <th>label</th>
            <th>min</th>
            <th>value</th>
            <th>max</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{row.min}</td>
              <td>{row.value}</td>
              <td>{row.max}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
