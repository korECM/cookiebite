// 컴포넌트 인덱스 (1줄 시그니처):
//   KpiRow({ items: KpiItem[] })                             — KPI 카드 줄 (dl)
//   Claims({ items: ClaimItem[], title? })                   — 주장→증거 앵커 목록
//   Findings({ items: FindingItem[] })                       — 심각도 배지 발견 목록
//   Matrix({ rows, cols, data, max?, format?, ariaLabel, caption? }) — accent 오버레이 히트 테이블
//   RangeDot({ rows, domain?, format?, unit?, ariaLabel })   — min-max-value SVG figure
//   (쉘: Report, Standfirst, Section, Sources / capability: Table, Glossary → capability-components.tsx)
import { useId, type ReactNode } from 'react';
import type { ThemeDocument } from './themes.ts';
import { registerCss } from './collect.ts';

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

export interface KpiItem {
  label: string;
  value: string | number;
  unit?: string;
  delta?: { dir: 'up' | 'down' | 'flat'; text: string; tone: 'success' | 'critical' | 'neutral' };
  note?: string;
}

const ARROW = { up: '▲', down: '▼', flat: '—' } as const;

const KPIS_CSS = `.cb-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: calc(var(--cb-space-unit) * 4px); margin: 0; }
.cb-kpi { border: 1px solid var(--cb-divider); border-radius: var(--cb-radius);
  padding: calc(var(--cb-space-unit) * 4px); background: var(--cb-surface); }
.cb-kpi dt { color: var(--cb-text-muted); font-size: 0.85em; }
.cb-kpi dd { margin: 0; }
.cb-kpi strong { font-size: 1.6em; font-variant-numeric: tabular-nums; }
.cb-kpi small { color: var(--cb-text-muted); }
.cb-delta { font-size: 0.8em; margin-inline-start: 0.5em; text-wrap: nowrap; }
.cb-tone-success { color: var(--cb-accent-strong); }
.cb-tone-critical { color: var(--cb-accent-strong); font-weight: 600; }
.cb-note { color: var(--cb-text-muted); font-size: 0.85em; margin: 0.25em 0 0; }`;

/** KPI 줄. 값은 큰 숫자, 델타는 기호+텍스트로 방향을 알린다 (색 단독 금지). */
export function KpiRow({ items }: { items: KpiItem[] }) {
  registerCss('kpis', KPIS_CSS);
  return (
    <dl className="cb-kpis">
      {items.map((item, index) => (
        <div className="cb-kpi" key={index}>
          <dt>{item.label}</dt>
          <dd>
            <strong>{item.value}</strong>
            {item.unit === undefined ? null : <small> {item.unit}</small>}
            {item.delta === undefined ? null : (
              <span className={`cb-delta cb-tone-${item.delta.tone}`}>
                {ARROW[item.delta.dir]} {item.delta.text}
              </span>
            )}
            {item.note === undefined ? null : <p className="cb-note">{item.note}</p>}
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

const CLAIMS_CSS = `.cb-claims { margin: 0; }
.cb-claims-title { color: var(--cb-text-muted); font-size: 0.85em; margin: 0 0 calc(var(--cb-space-unit) * 2px); }
.cb-claims ol { list-style: none; margin: 0; padding: 0;
  display: grid; gap: calc(var(--cb-space-unit) * 2px); }
.cb-claim { display: flex; align-items: baseline; gap: calc(var(--cb-space-unit) * 2px);
  padding-inline-start: calc(var(--cb-space-unit) * 3px); color: var(--cb-text); }
.cb-claim::before { content: ""; flex: none; align-self: center;
  width: 0.5em; height: 0.5em; border-radius: 50%;
  background: var(--cb-claim-dot, var(--cb-text-muted)); }
.cb-claim a { color: inherit; }
.cb-claim > a, .cb-claim > span:first-of-type { color: var(--cb-text); }
.cb-claim-value { margin-inline-start: auto; color: var(--cb-text-muted);
  font-variant-numeric: tabular-nums; text-wrap: nowrap; }
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
      {title === undefined ? null : <p className="cb-claims-title">{title}</p>}
      <ol>
        {items.map((item, index) => (
          <li className={`cb-claim cb-tone-${item.tone ?? 'neutral'}`} key={index}>
            {item.evidence === undefined ? (
              <span>{item.claim}</span>
            ) : (
              <a href={item.evidence}>{item.claim}</a>
            )}
            {item.value === undefined ? null : <span className="cb-claim-value">{item.value}</span>}
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

const FINDINGS_CSS = `.cb-findings { list-style: none; margin: 0; padding: 0;
  display: grid; gap: calc(var(--cb-space-unit) * 3px); }
.cb-finding { display: flex; align-items: baseline; gap: calc(var(--cb-space-unit) * 3px); }
.cb-badge { flex: none; border: 1px solid var(--cb-divider); border-radius: var(--cb-radius);
  padding: calc(var(--cb-space-unit) * 0.5px) calc(var(--cb-space-unit) * 1.5px);
  font-size: 0.75em; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.02em; color: var(--cb-text-muted); text-wrap: nowrap; }
.cb-finding.cb-tone-critical .cb-badge { border-color: var(--cb-accent-strong); color: var(--cb-accent-strong); }
.cb-finding.cb-tone-warning .cb-badge { border-color: var(--cb-accent); color: var(--cb-accent-strong); }
.cb-finding.cb-tone-info .cb-badge { border-color: var(--cb-accent); color: var(--cb-accent); }
.cb-finding.cb-tone-success .cb-badge { border-color: var(--cb-accent-strong); color: var(--cb-accent-strong); }
.cb-finding-title { margin: 0; color: var(--cb-text); }
.cb-finding code { color: var(--cb-text-muted); font-size: 0.85em; }
.cb-note { color: var(--cb-text-muted); font-size: 0.85em; margin: 0.25em 0 0; }`;

/** 발견 목록. 심각도는 보더+텍스트 배지, 색은 accent 계열 보조로만. */
export function Findings({ items }: { items: FindingItem[] }) {
  registerCss('findings', FINDINGS_CSS);
  return (
    <ul className="cb-findings">
      {items.map((item, index) => (
        <li className={`cb-finding cb-tone-${item.tone}`} key={index}>
          <span className="cb-badge">{item.label ?? SEV_LABEL[item.tone]}</span>
          <div>
            <p className="cb-finding-title">{item.title}</p>
            {item.where === undefined ? null : <code>{item.where}</code>}
            {item.note === undefined ? null : <p className="cb-note">{item.note}</p>}
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

const MATRIX_CSS = `.cb-matrix { margin: 0; }
.cb-matrix table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
.cb-matrix th, .cb-matrix td { border: 1px solid var(--cb-divider);
  padding: calc(var(--cb-space-unit) * 2px); text-align: center; }
.cb-matrix td { position: relative; isolation: isolate; color: var(--cb-text); }
.cb-matrix .cb-heat { position: absolute; inset: 0; z-index: -1;
  background: var(--cb-accent); }
.cb-matrix th { color: var(--cb-text-muted); font-weight: 600; background: var(--cb-surface); }
.cb-matrix figcaption { color: var(--cb-text-muted); font-size: 0.85em;
  margin-block-start: calc(var(--cb-space-unit) * 2px); }`;

/** 히트맵 테이블. 셀마다 accent 오버레이 불투명도로 강도를 표현한다. 잉크는 항상 --cb-text. */
export function Matrix({ rows, cols, data, max, format, ariaLabel, caption }: MatrixProps) {
  registerCss('matrix', MATRIX_CSS);
  const flat = data.flat();
  const effectiveMax = max ?? (flat.length === 0 ? 0 : Math.max(...flat));

  return (
    <figure className="cb-matrix">
      <table>
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col" />
            {cols.map((col) => (
              <th scope="col" key={col}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row}>
              <th scope="row">{row}</th>
              {(data[ri] ?? []).map((v, ci) => {
                // 셀 강도는 accent 오버레이 불투명도로 표현한다(최대 0.6). td 자체 배경은
                // 투명하게 두어 대비 계측이 실제 잉크 대 페이지 배경을 읽도록 한다.
                const opacity =
                  effectiveMax <= 0 ? 0 : Math.min(0.6, Math.max(0, (v / effectiveMax) * 0.6));
                return (
                  <td key={`${ri}-${ci}`}>
                    <span className="cb-heat" style={{ opacity }} aria-hidden="true" />
                    {format?.(v) ?? String(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {caption === undefined ? null : <figcaption>{caption}</figcaption>}
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

const RANGEDOT_CSS = `.cb-rangedot { margin: 0; position: relative; }
.cb-rangedot svg { display: block; width: 100%; height: auto; }
.cb-visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }`;

/** min–max 캡슐과 value 도트를 한 SVG figure로 그린다. */
export function RangeDot({ rows, domain, format, unit, ariaLabel }: RangeDotProps) {
  registerCss('rangedot', RANGEDOT_CSS);
  const lo = domain?.[0] ?? Math.min(...rows.map((r) => r.min));
  const hi = domain?.[1] ?? Math.max(...rows.map((r) => r.max));
  const xOf = (v: number) => (hi === lo ? 380 : 160 + ((v - lo) / (hi - lo)) * 440);
  const height = rows.length * 40;

  return (
    <figure className="cb-rangedot" role="img" aria-label={ariaLabel}>
      <svg viewBox={`0 0 640 ${height}`} role="presentation">
        {rows.map((row, i) => {
          const y = i * 40 + 20;
          const xMin = xOf(row.min);
          const xMax = xOf(row.max);
          const xVal = xOf(row.value);
          const valueText = `${format?.(row.value) ?? String(row.value)}${unit === undefined ? '' : unit}`;
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
