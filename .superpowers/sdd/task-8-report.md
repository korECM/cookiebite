# Task 8 Report — paged layout + Page + sidebar nav

**STATUS:** done  
**Commit:** (see git log after commit)  
**Suite:** 80 pass / 1 skip / 0 fail (`node --test`, packages/cookiebite)

## What shipped

### New
- `src/shell/page.tsx` — `<Page id title icon?>`; renders `<section data-page id>`; inactive pages get `hidden print:block` only after hydration via `PageVisibilityContext`.
- `src/shell/nav.tsx` — `PageNavMobile` / `PageNavDesktop` (anchor + `preventDefault` switch), `ArticleToc` (IntersectionObserver scrollspy, `aria-current="true"`), `PagedController` (hash → active id, `history.replaceState`).
- `src/shell/resolve-page-id.mjs` (+ `.d.mts`) — pure `resolveInitialPageId(hash, pageIds)`.

### Modified
- `src/shell/report.tsx` — `layout="paged"` collects Page children (same Children.forEach rules as article toc); fragment limitation comment; article uses `ArticleToc`.
- `src/shell/prose.tsx` — Sources/Glossary collision-safe keys (`${label}-${i}` / `${term}-${i}`).
- `src/shell/controls.tsx` + `lib/assemble.mjs` — `SHELL_CSS` print rule `@media print{[data-page].hidden{display:block!important}}`.
- `src/index.ts` — exports `Page`, `PageNav*`, `resolveInitialPageId` (`v3.ts` re-exports).

### Tests
- `test/shell-paged.test.mjs` + fixtures `shell-paged.tsx`, `shell-paged-under-article.tsx`
  1. SSR: all pages stacked, `data-page`, no `hidden`
  2. Nav: `#href` per page (mobile+desktop = 2×)
  3. Article + Page: tolerant section render, no Pages nav
  4. `resolveInitialPageId` unit cases
  5. e2e build: all pages + nav + print CSS in HTML

## Graceful degradation

- SSR / pre-hydration / JS-dead: every Page is in the markup, none hidden → vertical stack.
- After hydrate: only active page visible; print media restores all.
- No-JS nav: `<a href="#id">` jumps to stacked section; with JS, click switches page without scroll jump (`replaceState`).

## Concerns

- `ArticleToc` `items` array identity changes every render (reconnects observer); fine for typical toc sizes, could memoize by id key later.
- Desktop+mobile each render a full nav (duplicate anchors in SSR) — intentional for CSS breakpoint swap; acceptable for static markup size.
- Fragment children still not collected (documented; same as Task 6 article toc).
