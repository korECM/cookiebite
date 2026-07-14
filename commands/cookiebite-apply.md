---
description: Apply a cookiebite theme (studio output or ThemeDocument) to reports
argument-hint: [paste the studio output, or a ThemeDocument object]
---
Apply the theme below to cookiebite reports, using the **cookiebite** skill's Theme
workflow.

Theme payload (the theme studio's export, or a raw `ThemeDocument` object):
$ARGUMENTS

- One report → set the payload as that report's `<Report theme={…}>` prop. If it's a
  `ThemeDocument` literal, inline it or import it; if it names a built-in preset, import
  that preset from `cookiebite/themes`. Rebuild with `bunx cookiebite build`.
- Reusable default → save the `ThemeDocument` as a module the user's reports import from,
  and point new reports' `theme` prop at it.

If no report path is obvious, ask which report to apply it to. Confirm exactly what you
applied and where.
