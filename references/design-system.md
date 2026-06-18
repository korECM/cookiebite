# Design system reference — Persimmon preset

This documents one concrete design-token preset, **Persimmon** (a warm tomato accent,
Pretendard type, Korean locale), as a worked example of the token model the skill uses.
It targets information-dense interfaces, not marketing pages: clear hierarchy,
predictable spacing, restrained surfaces, theme-driven emphasis — good principles for
any report theme, not just this one.

The skill is theme-agnostic: the default is the **Neutral** preset, and tokens are
swappable (`assets/presets/*.json`, `assets/theme-studio.html`). Read this file when
you want the exact Persimmon values, or as an example of how a coherent token set
(neutrals + one accent + semantic colors + type/spacing scales) fits together — the
same structure applies to any theme you build.

## Color Palette

### Theme color
Default accent: **Tomato `#FA4D02`**. Pick exactly one accent per report.

Available theme hues: `gray, tomato, red, crimson, pink, plum, purple, violet,
iris, indigo, blue, sky, cyan, teal, green, grass, yellow, orange, brown, bronze`.

### Neutrals
- Background: Gray 1 `#FCFCFC`
- Surface: White `#FFFFFF`
- Text Primary: Gray 10 `#222222`
- Text Secondary: Gray 8 `#555555`
- Text Disabled: Gray 6 `#B0B0B0`
- Placeholder: Gray 5 `#C7C7C7`
- Line Base: Gray 5 `#C7C7C7`
- Line Weak: Gray 4 `#E4E4E4`
- Disabled Background: Gray 3 `#F0F0F0`

### Semantic colors
- Critical: Red `#CE2C31`
- Cautionary: Yellow `#FBB800`
- Positive: Grass `#3E9B4F`
- Informative: Blue `#0588F0`

### Usage guidance
- Neutral grays carry layout structure and readability.
- One theme color is the primary accent for actions, selection, emphasis, active states.
- Semantic colors are for status/feedback, not decoration.
- No one-off hex colors in product UI unless a token is added first. (Reports may
  derive tints/shades of the chosen accent for charts — see SKILL.md.)

## Typography

Recommended family: **Pretendard** (Korean + Latin). Not bundled by the token set;
import it directly (CDN in SKILL.md).

### Type scale (size / line-height / letter-spacing)
- Caption 12: `12px / 16px / -0.02em`
- Body 14: `14px / 20px / -0.02em`
- Body 16: `16px / 24px / -0.02em`
- Body 18: `18px / 26px / -0.02em`
- Title 20: `20px / 28px / -0.02em`
- Title 24: `24px / 30px / -0.02em`
- Title 28: `28px / 36px / -0.02em`
- Headline 36: `36px / 44px / -0.02em`
- Headline 48: `48px / 56px / -0.02em`

### Usage guidance
- `body-14` / `body-16` for most text.
- `title-*` for section titles and local hierarchy.
- `headline-*` sparingly for page-level emphasis.
- Keep hierarchy obvious and shallow.

## Spacing

Base unit `2px`. Scale: `0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 72`.

- Prefer token spacing only.
- Keep component internals tight before increasing outer layout spacing.
- Favor consistent vertical rhythm over clever gaps.

## Components

Priority order: project-level components → design-system components/tokens → external libs.

### Buttons
- Variants: `fill, weak, outline, outline-weak, text`. Sizes: `small, medium, large`.
- Use the theme color by default. One primary action per area; secondary steps down in strength.

### Text Inputs
- `TextField` for input and textarea. Sizes: `small, medium, large`. Icons/helpers compose inside `TextField.Root`.

### Field
- `Field` for label, control, description, error (in that order). Row layout only when it aids scanning.

### Select, Checkbox, RadioGroup, Switch
- Use the provided form controls; match sizes with adjacent inputs/buttons; keep groups consistent per screen.

### Tags
- Variants: `fill, outline`. Sizes: `small, medium`. May be theme-colored, optionally rounded. Concise metadata/state labels only.

### Tabs
- For peer views at the same info level. Active state uses theme color.

### Tables
- Variants: `line, fill`. Sizes: `small, medium, large`. For dense comparison/operational data. Preserve alignment and rhythm; minimal inline decoration in cells.

### Toast
- Variants: `fill, weak, outline`. Sizes: `small, medium, large`. Default Blue (informative). Map semantic colors for status.

### Dialog, Tooltip, Progress, Pagination, FileUpload
- Project components first, then the design system. Dialogs focused/action-oriented. Tooltips clarify, never carry essential instructions. Progress communicates state changes. Pagination dense over ornamental. FileUpload looks like part of the form system.

## Elevation & Depth

### Radius
- XX-Small `4px`, X-Small `8px`, Small `12px`, Medium `16px`, Large `24px`, X-Large `32px`.

### Shadow
- X-Small `0 1px 2px rgba(0,0,0,0.5)`
- Small `0 2px 8px rgba(0,0,0,0.15)`
- Medium `0 8px 20px rgba(0,0,0,0.12)`
- Large `0 7px 30px rgba(0,0,0,0.2)`

### Usage guidance
- Prefer borders, background contrast, spacing before strong shadow.
- Use shadow to separate layers (dialogs, popovers, floating feedback).
- Keep depth subtle on core surfaces.

## Do's & Don'ts

### Do
- Project-level components first when they already express the pattern.
- Then the shared component/icon/token packages.
- External libs only when the project and the design system don't cover the need.
- One theme color consistently per screen/area.
- Semantic colors for feedback/status.
- Keep layouts scannable, compact, predictable.
- Update Storybook examples when a visible component rule changes.

### Don't
- No ad-hoc hex colors, spacing, radii, shadows in component code.
- No mixing several accents in one workflow without a semantic reason.
- No marketing-style gradients, oversized hero type, or decorative motion **in console product surfaces**.
- Don't bypass project components just to use raw primitives.
- Don't use color alone to communicate state.

## Dark mode (token-derived, free for every theme)

The report template ships a **generic dark layer** — `html[data-theme="dark"]` in the
non-THEME `<style>` block — and a top-right toggle. It overrides only the **neutrals**
(bg/surface/text/lines/disabled-bg) plus `--accent-weak`; the **accent stays the same**
in both modes so brand identity is preserved. `--accent-weak` is re-derived with
`color-mix(in srgb, var(--accent) 22%, #16161a)`, so the dark variant works for *any*
preset without a per-preset dark JSON. Semantic hues are nudged brighter to read on a
dark surface. Because the layer lives outside the swappable THEME block, it survives
preset swaps. Canvas charts don't follow CSS vars, so the template re-reads the tokens
on toggle (`readThemeVars()`) and re-renders; keep that contract if you customize the
template. The first-load theme honours `prefers-color-scheme` and the user's last choice
is remembered in `localStorage`.

> Note for reports: a standalone HTML report is **not** a console product surface.
> The token discipline (color/type/spacing/radius) still applies so it reads as
> the report itself, but reports may use richer data visualization, motion, and graphic
> treatment than an embedded console screen would. See SKILL.md for the balance.

## Applying & defaulting themes (operational)

### Applying a theme the user pasted (do this yourself — no scripts needed)

The theme studio's "Copy for agent" gives the user a prompt with their `theme.json`
inline. When a user pastes a theme.json (or its token values) and asks to use/apply it,
**set the report's THEME block directly from those tokens** — you don't need any script
or to know where the skill is installed. Map the JSON to the THEME block:

- `font.url` → the font `<link href>`; `font.family` + `font.fallback` → `--font-family`
- `colors.accent/accentStrong/accentWeak/accentOn` → `--accent` / `--accent-strong` / `--accent-weak` / `--accent-on`
- the nine neutrals → `--c-bg`, `--c-surface`, `--c-primary`, `--c-secondary`,
  `--c-disabled`, `--c-placeholder`, `--c-line`, `--c-line-weak`, `--c-disabled-bg`
- the four semantic → `--c-critical` / `--c-cautionary` / `--c-positive` / `--c-informative`
- `locale` → `window.REPORT_LOCALE`

Replace the existing `<!-- THEME … -->`…`<!-- end THEME -->` block (or build it into a
new report). To make it reusable by name, save the JSON to `assets/presets/<name>.json`
and the user can later just say "use the `<name>` theme". (`scripts/apply-theme.py` does
the same swap from the CLI if the repo is cloned, but it's optional.)

### Setting / using a default theme

A user can set **one global default theme** that applies to every report from now on.

**Theme priority for a report** (highest wins):

1. A theme/preset the user explicitly asks for in this request.
2. The user's saved default at `assets/presets/default.json` (in this skill's directory).
3. The template's built-in default (Persimmon).

- **Using it.** When the user hasn't asked for a specific theme/preset, check whether
  `assets/presets/default.json` exists; if it does, apply it as the THEME block using the
  mapping above. Otherwise fall back to the template's built-in default. `default.json` is
  not shipped, so out of the box this falls through to the built-in default.
- **Setting it.** When the user says "set this as my default" (typically with a pasted
  theme.json, e.g. from the studio's "Set as my default" button), write that JSON to
  `assets/presets/default.json`. Confirm all future reports will use it until they change
  it — the user reverts by deleting that file or setting a new default.
