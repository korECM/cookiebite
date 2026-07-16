// v3 public surface — shell + report data components + theme types.
export {
  Report,
  type ReportProps,
} from './shell/report.tsx';
export {
  Section,
  type SectionProps,
} from './shell/section.tsx';
export {
  Columns,
  type ColumnsProps,
} from './shell/columns.tsx';
export {
  Page,
  type PageProps,
} from './shell/page.tsx';
export {
  PageNav,
  PageNavMobile,
  PageNavDesktop,
  resolveInitialPageId,
  type PageNavItem,
  type PageNavProps,
} from './shell/nav.tsx';
export {
  Standfirst,
  Sources,
  Glossary,
  Prose,
  type StandfirstProps,
  type SourcesProps,
  type SourceItem,
  type GlossaryProps,
  type GlossaryTerm,
} from './shell/prose.tsx';
export {
  Controls,
  THEME_STORAGE_KEY,
  DENSITY_STORAGE_KEY,
  SHELL_CSS,
} from './shell/controls.tsx';
export {
  KpiRow,
  type KpiRowProps,
  type KpiItem,
  type KpiDelta,
} from './report/kpi-row.tsx';
export {
  Claims,
  type ClaimsProps,
  type ClaimItem,
} from './report/claims.tsx';
export {
  Findings,
  type FindingsProps,
  type FindingItem,
  type FindingSeverity,
} from './report/findings.tsx';
export {
  Matrix,
  type MatrixProps,
  type MatrixRow,
} from './report/matrix.tsx';
export {
  RangeDot,
  type RangeDotProps,
  type RangeDotItem,
} from './report/range-dot.tsx';
export {
  DataTable,
  DataTableColumnHeader,
  type DataTableProps,
} from './report/data-table.tsx';
export {
  BarList,
  type BarListProps,
  type BarListItem,
} from './report/bar-list.tsx';
export {
  Tracker,
  type TrackerProps,
  type TrackerBlock,
  type TrackerStatus,
} from './report/tracker.tsx';
export {
  CategoryBar,
  type CategoryBarProps,
  type CategoryBarSegment,
} from './report/category-bar.tsx';
export {
  Panel,
  type PanelProps,
} from './report/panel.tsx';
export type { ThemeDocument, ThemeSeed } from './themes.ts';
