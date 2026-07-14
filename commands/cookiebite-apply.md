---
description: Apply a cookiebite theme (studio output or ThemeDocument) to reports
argument-hint: [paste the studio output, or a ThemeDocument object]
---
Apply the theme below to cookiebite reports, using the **cookiebite** skill's Theme
workflow.

Theme payload (the theme studio's export, or a raw `ThemeDocument` object):
$ARGUMENTS

- If the payload names a built-in preset (persimmon, neutral, stripe, …) → import it from
  `cookiebite/themes` and set it as the report's `<Report theme={…}>` prop.
- If it's already a `ThemeDocument` (`{ schemaVersion: 1, seed, … }`) → inline it or
  import it, and set it as `theme`.
- If it's a **studio export** (`{ name, font, colors, locale }` — not a `ThemeDocument`;
  there is no converter) → build the `ThemeDocument` by hand from it: `colors.bg` →
  `seed.background`, `colors.primary` → `seed.text`, `colors.accent` → `seed.accent`,
  `font.family` joined with `font.fallback` → `seed.font`, `font.url` →
  `resources.fontStylesheets: [url]`, `locale` carries over as-is. `spaceUnit`, `measure`,
  `radius`, `surface` aren't in the export — take them from a preset (persimmon: `4`,
  `'68ch'`, `12`, `'border'`) unless the user says otherwise.

Then rebuild with `bunx cookiebite build`. For a reusable default, save the
`ThemeDocument` as a module the user's reports import from. If no report path is obvious,
ask which report to apply it to. Confirm exactly what you applied and where.
