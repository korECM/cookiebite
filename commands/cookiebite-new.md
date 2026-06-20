---
description: Scaffold a new cookiebite report from a TYPE skeleton (not the payments demo)
argument-hint: [dashboard | review | postmortem | explainer | comparison] [out.html]
---
Start a new cookiebite report from a TYPE-appropriate skeleton instead of editing the
payments demo out of `assets/template.html`. Use the **cookiebite** skill for the actual
authoring.

Request:
$ARGUMENTS

Run `bash scripts/scaffold.sh <type> <out.html>` — it copies `assets/template.html` to
`<out.html>` and swaps the demo content in the `COOKIEBITE:SECTIONS` /
`COOKIEBITE:REPORT-SCRIPT` (and `COOKIEBITE:TOC` / `COOKIEBITE:HEADER` / `COOKIEBITE:FOOTER`)
slots for a small, correct, on-theme starting point built from the right helpers for that
type. The slot markers stay intact, so you keep surgical-editing exactly as with the raw
template.

Types (pick the closest to what's being reported):
- `dashboard` — kpis + filtered chart + table (status / metrics one-pager)
- `review` — findings + diff/code + actionItems (code / design review)
- `postmortem` — takeaway + timeline + findings + mermaid (incident write-up)
- `explainer` — takeaway + mermaid + codeTabs + glossary (teach a concept)
- `comparison` — compare + pill + callout (decision / options grid)

If no type was given above, pick the one that best fits the request (ask only if it's
genuinely ambiguous). If no output path was given, choose a sensible filename.

Then: edit the `‹REPLACE›` placeholders in the slots with the real content (see
`references/snippets.md` for more section recipes and `helpers.md` for each helper's input
shape), do the cookiebite visual self-check, and run `bash scripts/inline.sh <out.html>`
before handing the file back.
