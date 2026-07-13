---
description: Scaffold a new cookiebite report — a freeform reading doc by default, or a legacy full-runtime type
argument-hint: [reading | dashboard | review | postmortem | explainer | comparison] [out.html]
---
Start a new cookiebite report. The default is a quiet freeform reading document; the five
legacy types render the full-runtime compatibility template. Use the **cookiebite** skill
for the actual authoring.

Request:
$ARGUMENTS

**Default (freeform reading):** run `bash scripts/scaffold.sh <out.html>` with no type. It
copies `assets/template.html` — semantic HTML you own, the core runtime only, an inert
theme seed, and an empty `<!-- COOKIEBITE:USE -->` marker. Edit the `COOKIEBITE:*` slots
(`TITLE` / `HEADER` / `SECTIONS` / `FOOTER`), pick a theme seed, and declare behavior in the
marker only if you need it (`chart`, `table`, `glossary`, `motion`, `export`). A pure
reading doc needs no capabilities. Plan the claims and evidence before writing.

**Legacy full-runtime types:** run `bash scripts/scaffold.sh <type> <out.html>` — this
renders `assets/template-compat.html` with the full `assets/cookiebite.css` /
`assets/cookiebite.js` runtime. Pick the closest to what's being reported:
- `dashboard` — kpis + filtered chart + table (status / metrics one-pager)
- `review` — findings + diff/code + actionItems (code / design review)
- `postmortem` — takeaway + timeline + findings + mermaid (incident write-up)
- `explainer` — takeaway + mermaid + codeTabs + glossary (teach a concept)
- `comparison` — compare + pill + callout (decision / options grid)

If a legacy type was requested but is genuinely ambiguous, ask; otherwise default to
reading. If no output path was given, choose a sensible filename.

Then: edit the `‹REPLACE›` placeholders with the real content (see `DESIGN.md` for the
freeform contract, or `references/snippets.md` / `helpers.md` for legacy section recipes),
do the cookiebite visual self-check, and run `bash scripts/inline.sh <out.html>` — a
marker-bearing report is assembled with only its declared dependencies — before handing the
file back.
