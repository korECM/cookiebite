# Task 4 Report — Tailwind 컴파일 개편 (소스 스캔 + shadcn @theme)

**Status:** DONE  
**Branch:** `v3`  
**Date:** 2026-07-15

## What was done

1. Kept legacy `compileTw(markup)` unchanged for `lib/build.mjs` / old tests (Task 7 deletes it).
2. Added `compileTwSources({ tsxPath, packageRoot? })` → Promise\<string\>:
   - Scans user TSX + `dirname(tsxPath)/{components,lib}/**` (local shadowing)
   - Package `@source`: `src/ui/**/*.tsx`, `src/lib/**/*.ts`, `src/shell/**/*.tsx`, `src/report/**/*.tsx` (missing dirs are fine)
   - `@theme inline` maps Task 2 shadcn vars (`--color-background: var(--background)` … charts, radius steps)
   - Default palette wiped (`--color-*: initial`); `bg-red-500` emits no utility
   - Empty return when no `@layer utilities {` block (tw-animate `@property` braces do not count)
3. Exported `BASE_CSS` — shadcn border/body only (no box-sizing; assemble/core already owns reset).
4. Added dependency `tw-animate-css` (vendored UI uses `animate-in` / `animate-out` / accordion keyframes).

## Scan / theme

| Piece | Detail |
|-------|--------|
| Scanner | `@tailwindcss/oxide` via compile()`sources` + local `scanFiles({content, extension})` |
| Theme | `@theme inline` → semantic CSS vars from Task 2 `compileTheme` |
| Animations | `@import "tw-animate-css"` in v3 input |
| Wipe | `--color-*: initial` before semantic remaps |

## Files

| Path | Change |
|------|--------|
| `lib/tw-compile.mjs` | `compileTwSources`, `BASE_CSS`, keep `compileTw` |
| `test/tw-compile.test.mjs` | +5 cases (4 required + BASE_CSS) |
| `test/fixtures/tw-*.tsx` | state / wiped / bg-card / plain |
| `package.json` / `pnpm-lock.yaml` | `tw-animate-css@^1.4.0` |

## Tests

```
cwd: packages/cookiebite
command: node --test

ℹ tests 116
ℹ pass 116
ℹ fail 0
```

New `compileTwSources` cases: state-class source scan, palette wipe, `bg-card`→`var(--card)`, empty utilities → `''`, `BASE_CSS` shape.

## Concerns

- Empty-string test uses optional `packageRoot` pointing at an empty tree; with real `src/ui` in the scan set a plain TSX is never empty (by design).
- Every report CSS will include all candidates from vendored `src/ui` (intentional for Radix client-state classes; HTML size grows).
- `pnpm add` tried to create `pnpm-workspace.yaml` (esbuild allowBuilds stub) — deleted, not committed (same as Task 2).
