# Design system reference — Persimmon preset

This documents one concrete design-token preset, **Persimmon** (a warm tomato accent,
Pretendard type, Korean locale), as a worked example of the token model the skill uses.
It targets information-dense interfaces, not marketing pages: clear hierarchy,
predictable spacing, restrained surfaces, theme-driven emphasis — good principles for
any report theme, not just this one.

The skill is theme-agnostic: the built-in default is the **Persimmon** preset, and
tokens are swappable (`assets/presets/*.json`, `assets/theme-studio.html`) — **Neutral**
is the bundled Latin alternative. Read this file when
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

> **Contrast caveat for warm accents.** A few shipped accents are warm/bright and do
> **not** clear WCAG AA (4.5:1) for *small white text on the accent fill*: Persimmon
> `#FA4D02` (the shipped default, ~3.0:1) and Raycast `#FF5C5C` (~2.6:1). The brand
> accents are intentionally kept as-is for identity, so don't change them — instead, for
> small white-on-accent text (badges, pills, tiny labels) use `--accent-strong` as the
> fill rather than `--accent`; it's the darker shade and reads. Large text / icon glyphs
> and non-text accent fills (chart series, borders) are fine on `--accent`.
>
> The mirror case is the accent used **as text** on the light bg (KPI numbers, outline-
> button labels): a warm accent can fail AA there too. The optional preset field
> `colors.accentText` → `--accent-text` provides a darker, WCAG-safe ink variant for those
> sites while the brand accent stays the fill (see "Applying a theme" below). Omit it and
> accent text falls back to `--accent`.

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
- `colors.accentText` (optional) → `--accent-text`: a darker, WCAG-safe variant of the
  brand accent for accent-**as-text** use-sites (KPI numbers, outline-button labels) on the
  light bg. The brand accent stays the **fill**; this is only the text/ink variant. Theme-
  studio emits it in `buildCSS()` and scores it in the light-mode contrast badge (shipped on
  `supabase` = `#157F56`). Omit it and accent text falls back to `--accent`.
- `colors.accentDark` (optional) → a dark-mode override emitted **after** the `:root`
  block: `html[data-theme="dark"]{ --accent:<accentDark>; --accent-strong:<accentDark>;
  --accent-on:<accentOnDark> }`. Only present for near-black accents that would vanish on
  the dark surface; keep it when hand-applying a pasted theme.json or the accent
  disappears in dark mode. `colors.accentOnDark` (optional) is the accent-on ink for that
  override — it **must** flip too, else accent-filled text (which sits on `--accent`) goes
  invisible against the now-light dark accent; it defaults to a dark ink (`#111111`) when
  `accentDark` is present.
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

## The Look system (shape/density/surface knobs — separate from color)

The **Look** is a second, orthogonal layer on top of the color/font tokens above: a set
of **structural** knobs — density, corner radius, elevation, surface treatment, border
weight, chart-palette mode, heading font, text measure, page background, header style,
semantic preset, and dark-mode tint. Color answers *"what hue?"*; the Look answers
*"how sharp / dense / bordered / wide?"*.

> **Backward-compat is the whole contract: absent Look === today, byte-for-byte.**
> Every knob defaults to today's look. A report with no Look emits **nothing** extra and
> renders identically to before. You only opt in per knob; an untouched Look is invisible.

### The knobs (each: default === today)

| Knob | `look` field | Values (**default**) | Engages via |
|------|-------------|----------------------|-------------|
| Density | `density` | **comfortable** / compact / spacious | `html[data-density]` → `--density-scale` .82 / **1** / 1.18 |
| Corner radius | `radiusScale` | 0 sharp / .6 subtle / **1** default / 1.4 round | `html[data-radius]` → `--radius-scale` → `--r-*` |
| Elevation | `elevation` | **soft** / flat / sharp / bordered | `html[data-elevation]` → `--shadow-sm`/`--shadow-md` |
| Surface | `surface` | **card** / flat / outlined | `html[data-surface]` → `--surface-fill`/`-border-w`/`-shadow` |
| Border weight | `borderW` | .5 / **1** / 1.5 px | `html[data-border]` → `--border-w` |
| Border style | `borderStyle` | **solid** / dashed | `html[data-border]` → `--border-style` |
| Chart palette | `paletteMode` | **analogous** / mono / categorical / sequential | `window.PALETTE_MODE` (read by `categoricalColors`/`ramp`) |
| Heading font | `headingFont` | **''** (= body font) / a family name | `--font-heading` (+ a font `<link>`) |
| Prose measure | `measureProse` | **68** ch | `--measure-prose` (`.cb-lead`/`.cb-prose`/`.cb-figure`) |
| Page measure | `measurePage` | **1400** px | `html[data-measure-page]` → `--measure-page` (`main` max-width) |
| Page background | `bg` | **plain** / wash / pattern | `html[data-bg]` → `--page-bg` (BODY only; print forces white) |
| Header style | `header` | **standard** / banded / bordered | `html[data-header]` → `--header-bg`/`--header-rule` (needs a `.cb-header`/real `<header>`) |
| Semantic preset | `semanticPreset` | **classic** / muted / vivid / colorblind-safe | `--semantic-preset` (recolors the four semantic tokens as a set) |
| Dark-mode tint | `darkTint` | **neutral** / warm / cool / accent (or a raw color) | `html[data-theme=dark][data-dark-tint]` → `--dark-tint` (mixes bg/surface at 6%) |

Notes on the contract:

- The **data-attr layers fire only under an explicit attr** — `[data-density]`,
  `[data-radius]`, `[data-elevation]`, `[data-surface]`, `[data-border]`, `[data-bg]`,
  `[data-header]`, `[data-measure-page]`, `[data-dark-tint]`. Absent the attr, the default
  recipe is today's, so omitting a knob is a true no-op.
- `radiusScale` accepts a **number** or a name (`sharp`/`subtle`/`default`/`round`); the
  `--r-*` keys are `calc(base × scale)`. The Tailwind `rounded-*` keys live in
  `cookiebite.js`; the vars live in CSS.
- **Print / forced-colors clamp:** borders are forced to min `1px solid` and the page
  background to white under `@media print` and forced-colors, regardless of the Look.
- `darkTint` `neutral` resolves to today's exact `#101013`/`#1a1a1f`. The semantic-preset
  *token sets* are JS-written; the CSS dark layer only nudges them by name.

### How a Look is carried: `window.REPORT_LOOK` → `CB.applyLook`

```js
window.REPORT_LOOK = { /* only the knobs that differ from default */ };
```
`CB.applyLook(look?)` (in the runtime, signature in `helpers.md`) reads
`window.REPORT_LOOK` (or its argument) **once at init, before charts render**, and
projects each field onto its `html data-*` attr or inline `:root` var (and writes
`window.PALETTE_MODE`). It is **sparse-friendly**: absent fields touch nothing. You don't
call it by hand — the emitted THEME block does.

### The theme.json `look:{}` block (sparse)

A preset's optional `look` object carries the same knobs:

```jsonc
{
  "colors": { /* … */ },
  "font":   { /* … */ },
  "look": {                  // OMITTED ENTIRELY when all-default
    "density": "compact",
    "radiusScale": 0,        // or "sharp"|"subtle"|"default"|"round"
    "elevation": "bordered",
    "surface": "outlined",
    "borderW": 1.5, "borderStyle": "dashed",
    "paletteMode": "sequential",
    "headingFont": "Fraunces",   // family NAME; the matching <link> is emitted alongside
    "measureProse": 72, "measurePage": 1200,
    "bg": "wash", "header": "banded",
    "semanticPreset": "colorblind-safe",
    "darkTint": "warm"
  }
}
```

- **SPARSE: only divergent knobs appear.** If every field is default, the whole `look`
  key is omitted and `theme.json` is byte-identical to today.
- `apply-theme.py` / theme-studio's `buildCSS()` emit
  `<script>window.REPORT_LOOK={…}</script>` (+ a heading-font `<link>` when one is chosen)
  **only when the Look diverges from default**; the runtime owns applying it via
  `CB.applyLook`. When hand-applying a pasted `theme.json`, copy any `look` fields into a
  `window.REPORT_LOOK = {…}` script in the THEME block the same way.
- Defaults each field fills to when absent: `density=comfortable, radiusScale=1,
  elevation=soft, surface=card, borderW=1, borderStyle=solid, paletteMode=analogous,
  headingFont='', measureProse=68, measurePage=1400, bg=plain, header=standard,
  semanticPreset=classic, darkTint=neutral`.
- The CLI validates a present `look` (`validate_look`) and **fails the run (exit 1)** with
  field-level messages if a knob is out of range — a broken Look never silently emits junk.

### The theme-studio **Look tab**

`assets/theme-studio.html` has a **Look** tab beside the color/font controls: segmented
buttons + card pickers for every knob above (density, radius, elevation, surface, border,
chart palette, heading font, width/prose, page background, header, semantic preset, dark
tint). **Every control defaults to today's look**, so an untouched Look exports nothing —
the studio's CSS/`theme.json` output stays byte-identical until the user actually changes a
knob. The semantic-preset picker fills the four semantic color pickers (still individually
tweakable). "Reset look" returns every knob to default.
