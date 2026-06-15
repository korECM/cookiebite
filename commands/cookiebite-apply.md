---
description: Apply a cookiebite theme (studio output or theme.json) to reports
argument-hint: [paste the studio "Copy for agent" output, or a theme.json]
---
Apply the theme below to cookiebite reports, using the **cookiebite** skill's Theming
workflow.

Theme payload (the theme studio's "Copy for agent" / "Set as my default" output, or a
raw theme.json):
$ARGUMENTS

- One-report theme → rewrite the target report's `<!-- THEME … -->` block (use
  `scripts/apply-theme.py`).
- "Set as my default" payload → save it as the global default at
  `assets/presets/default.json`.

If no report path is obvious, ask which report to apply it to. Confirm exactly what you
applied and where.
