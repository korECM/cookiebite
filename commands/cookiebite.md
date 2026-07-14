---
description: Build a polished single-file HTML report with the cookiebite skill
argument-hint: [what to report on, or paste the data]
---
Use the **cookiebite** skill to build a polished, single-file, interactive HTML report.

Request / data:
$ARGUMENTS

Run the cookiebite workflow end to end: plan the claims and evidence first, then
`bunx cookiebite new <report>.tsx`, write the narrative and data with the typed
components, apply the default theme (or any theme the request names) via the `theme`
prop, `bunx cookiebite build <report>.tsx`, and `bunx cookiebite verify <report>.html
--runs 3`. Do the visual self-check on the rendered pixels before handing the file back.
If no data was given above, ask what to report on first.
