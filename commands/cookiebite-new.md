---
description: Scaffold a new cookiebite report with the typed TSX pipeline
argument-hint: [out.tsx]
---
Start a new cookiebite report. Use the **cookiebite** skill for the actual authoring.

Request:
$ARGUMENTS

Run `bunx cookiebite new <out>.tsx` (pick a sensible filename if none was given). It
scaffolds a typed starter: a `<Report>` with a theme import and a couple of `Section`s.
Then:

1. **Plan the claims and evidence first** — one to three claims, their evidence, the
   reader's first question. Decide reading vs dashboard before writing.
2. Fill the TSX with the real narrative and data using the typed components (`Standfirst`,
   `Section`, `KpiRow`, `Claims`, `Findings`, `Chart`, `Table`, `Matrix`, `RangeDot`,
   `Glossary`, `Sources`). Import components from `cookiebite`, a theme from
   `cookiebite/themes` — or the theme the request names.
3. `bunx cookiebite build <out>.tsx` (typecheck + token lint → HTML), then
   `bunx cookiebite verify <out>.html --runs 3`, and do the visual self-check on the
   rendered pixels before handing the file back.

Colors must be `var(--cb-*)` tokens, every `Chart` needs a short `ariaLabel`, and the build
fails fast on any of these — so let it carry those invariants.
