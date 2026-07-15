// v3 public surface — shell + constants. Data components arrive in Task 9.
export {
  Report,
  type ReportProps,
} from './shell/report.tsx';
export {
  Section,
  type SectionProps,
} from './shell/section.tsx';
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
export type { ThemeDocument, ThemeSeed } from './themes.ts';
