# Task 3 Report — 듀얼 번들 (SSR + 클라이언트 하이드레이션)

**Status:** DONE  
**Branch:** `v3`  
**Date:** 2026-07-15

## What was done

1. Rewrote `lib/render.mjs` with shared `@/` alias plugin (`createAtAliasPlugin`) and dual-mode `renderReport`.
2. Added `lib/client-bundle.mjs` exporting `buildClientBundle` (browser iife, minify, `NODE_ENV=production`).
3. Local shadowing: report-dir `components/ui/<name>.tsx` / `lib/<name>.ts` wins over package `src/ui` / `src/lib`.
4. Tests: `test/render-v3.test.mjs`, `test/client-bundle.test.mjs` + fixtures. Legacy `test/render.test.mjs` untouched and still green.

## Dual-mode `renderReport` (coexistence until Task 7)

| default export | return shape |
|----------------|--------------|
| **function** (v3 App component) | `{ markup, theme }` — `theme` from optional named `__theme`, else `null` |
| **element** (`<Report>`) | legacy `{ markup, theme, title, lang, collected }` for `build.mjs` |

Task 7 cutover deletes the element path.

## Alias resolution

```
@/components/ui/<name> → (1) <reportDir>/components/ui/<name>.{tsx,ts}
                       → (2) <pkgRoot>/src/ui/<name>.{tsx,ts}
@/lib/<name>           → (1) <reportDir>/lib/<name>.{tsx,ts}
                       → (2) <pkgRoot>/src/lib/<name>.{tsx,ts}
other @/…              → build error listing supported prefixes
```

## Client bundle globals (Task 10 verify)

| global | when |
|--------|------|
| `window.__COOKIEBITE_HYDRATED__` | sync success after `hydrateRoot` |
| `window.__COOKIEBITE_HYDRATION_ERROR__` | sync throw in try/catch |
| `window.__COOKIEBITE_HYDRATION_WARNINGS__` | `onRecoverableError` pushes `String(error)` |

## Files created

| Path | Notes |
|------|--------|
| `lib/client-bundle.mjs` | `buildClientBundle(tsxPath) → { js }` |
| `test/render-v3.test.mjs` | Card SSR, `__theme`, shadowing, unknown alias |
| `test/client-bundle.test.mjs` | hydrateRoot / flag / NODE_ENV / unknown alias |
| `test/fixtures/hydration-card.tsx` | Card + text, no theme |
| `test/fixtures/hydration-card-theme.tsx` | + `__theme` export |
| `test/fixtures/shadow-card/report.tsx` | imports `@/components/ui/card` |
| `test/fixtures/shadow-card/components/ui/card.tsx` | local shadow (`data-slot="shadowed-card"`) |
| `test/fixtures/unknown-alias.tsx` | `@/wat/x` |

## Files modified

| Path | Change |
|------|--------|
| `lib/render.mjs` | alias plugin, dual-mode SSR, export `pkgRoot` / `resolveReactNodeModules` / `createAtAliasPlugin` |

## Test output

```
cwd: packages/cookiebite
command: node --test

ℹ tests 110
ℹ pass 110
ℹ fail 0
ℹ duration_ms ~33234
```

New tests (6):

```
✔ buildClientBundle includes hydrateRoot and hydration flag; NODE_ENV defined away
✔ buildClientBundle rejects unknown @/ alias with supported prefixes
✔ v3 renderReport: Card markup has data-slot and text; theme null without __theme
✔ v3 renderReport: returns __theme when exported
✔ v3 renderReport: local components/ui/card.tsx shadows package
✔ v3 renderReport: unknown @/ alias rejects with supported prefixes
```

## Concerns / deviations

1. **Dual-mode on one `renderReport`** — brief names the new API `renderReport`, but `build.mjs` + legacy tests still need the element path. Detection is `typeof default === 'function'`. Task 7 should drop the element branch.
2. **`resolveDir` stays `pkgRoot`** — package-outside reports (e.g. `cookiebite new` in tmp) fail to resolve `react-dom/server` if resolveDir is the report dir. Alias plugin uses absolute paths, so this is safe.
3. **Client wrapper uses `createElement(App)`** not JSX — stdin loader is `js`; same effect as brief's `<App />`.
4. **No Tabs in SSR fixture** — brief mentioned Card+Tabs; Card alone covers `data-slot` + alias. Tabs would pull Radix client primitives without adding alias coverage.
5. **Recharts empty SSR** — noted in plan; not asserted here (no ChartContainer fixture yet).

---

## Coverage fix (code review follow-up)

**What changed**

| Path | Change |
|------|--------|
| `test/fixtures/hydration-tabs.tsx` | Radix `Tabs` fixture (`defaultValue`, two triggers/contents) |
| `test/render-v3.test.mjs` | SSR test: `data-slot="tabs"` + `tab-one-label` in markup |
| `test/client-bundle.test.mjs` | Assert `__COOKIEBITE_HYDRATION_ERROR__`, `__COOKIEBITE_HYDRATION_WARNINGS__`, `onRecoverableError` in bundle JS |

**Commands run**

```bash
cd packages/cookiebite
node --test test/render-v3.test.mjs test/client-bundle.test.mjs
node --test
```

**Output summary**

- Covering tests: 7 pass, 0 fail
- Full suite: 111 pass, 0 fail (~33s)
