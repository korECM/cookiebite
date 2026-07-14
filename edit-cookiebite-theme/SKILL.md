---
name: edit-cookiebite-theme
description: >-
  Open the cookiebite theme studio — a live, browser-based editor for designing the
  theme (accent, neutrals, semantic colors, font, locale) used by cookiebite HTML
  reports. Use when the user wants to edit / change / customize / pick / design a
  theme, change a report's colors or font, or says "open the theme studio" / "edit my
  theme" / "customize the theme" / "테마 스튜디오 열어줘" / "테마 바꾸고 싶어" / "테마
  편집" / "내 테마 만들래". This skill only opens the editor in the browser; applying a
  designed theme to a report (paste-apply, or setting a global default) is handled by
  the cookiebite skill's Theming section. Do NOT use to build a report itself, edit
  prose/markdown, or theme non-cookiebite UI.
---

# Theme Studio

Open the **theme studio** — cookiebite's live, browser-based theme editor — so the user
can design the look (accent, neutral ramp, semantic colors, font, locale) that
cookiebite reports use. This skill's whole job is to **launch the editor**; it does not
build reports and does not itself apply themes.

## When to use

Trigger when the user wants to edit / change / customize / pick / design a theme, change
a report's colors or font, or says things like:

- "open the theme studio", "edit my theme", "customize the theme", "design a theme",
  "change the report colors/font", "pick a theme"
- "테마 스튜디오 열어줘", "테마 바꾸고 싶어", "테마 편집", "내 테마 만들래", "리포트
  색/폰트 바꾸고 싶어"

If instead the user wants to **build a report**, or to **apply / set** a theme they
already designed (e.g. pasting a `theme.json` back), that's the **cookiebite** skill —
defer to it (see "After opening").

## What it is

`theme-studio.html` is a live editor with the 10-preset gallery (click any preset to
preview + apply instantly), per-token color pickers, a font/locale chooser, and a live
report preview. It persists to `localStorage`, so the user's last theme is remembered.
It exports a theme two ways: **Set as my default** and **Copy for agent** (see below).

## Action: open the studio

Open the studio file **in the user's browser**. The file ships with cookiebite at
`assets/theme-studio.html`. Resolve its path **at runtime** relative to this skill —
don't hardcode a user-specific absolute path:

- This `SKILL.md` lives in the skill's own directory (wherever the skill is installed).
- The studio sits next to cookiebite's assets, one level up from this skill:
  `<this-skill-dir>/../assets/theme-studio.html`.
- Resolve and normalize that path, then open it:
  - macOS: `open "<resolved>/assets/theme-studio.html"`
  - Linux: `xdg-open "<resolved>/assets/theme-studio.html"`
  - Windows: `start "" "<resolved>\assets\theme-studio.html"`

If that relative path doesn't resolve (e.g. the skill was installed standalone, without
cookiebite next to it), find the cookiebite skill's directory and open
`assets/theme-studio.html` from there. As a last resort, tell the user the file is
`assets/theme-studio.html` inside their cookiebite install and they can open it manually.

## After opening: tell the user the flow

Keep it brief. Once the studio is open, the user:

1. **Designs/tweaks** the theme in the live preview — start from a preset, nudge the
   accent, change neutrals/semantic colors, pick a font + locale.
2. **Exports** the theme — a studio-format object (`{ name, font, colors, locale }`).
   Note this is **not** the TSX pipeline's `ThemeDocument`, and there is no converter.
3. **Pastes that output back into the chat.** That paste is what actually applies the
   theme — and **the cookiebite skill handles it**, not this one: it maps the export's
   values into a `ThemeDocument` seed by hand (`colors.bg` → `background`,
   `colors.primary` → `text`, `colors.accent` → `accent`, `font.family` +
   `font.fallback` → `font`, `font.url` → `resources.fontStylesheets`, `locale` as-is;
   `spaceUnit` / `measure` / `radius` / `surface` come from a preset) and sets it as the
   report's `<Report theme={…}>` prop. See the cookiebite skill's "Theme" section.

So: this skill opens the editor; cookiebite consumes whatever the user designs.
