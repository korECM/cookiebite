# Cookiebite Design Contract

Cookiebite's default is a quiet reading document. The author owns semantic
HTML, CSS, SVG, and the argument's order. Cookiebite supplies a small visual
contract and optional behavior; it never chooses a report layout.

## 1. Narrative before components

Start with one to three claims, their evidence, and the reader's first
question. A dashboard is appropriate only when readers need to scan and slice
live dimensions. Most investigations, proposals, and explainers should read
in sequence: answer, evidence, takeaway, sources.

Use semantic elements directly. A useful default is `main`, an `h1`, a
standfirst paragraph, `section` elements, figures where evidence is visual,
and a source or method footer. One-off CSS values are allowed. Promote a value
to a report-local custom property when it repeats within a report; promote it
to the shared theme only when it repeats with the same meaning across reports.

## 2. Theme document

Core documents carry one inert theme document:

```html
<script type="application/json" id="cookiebite-theme">
{
  "schemaVersion": 1,
  "seed": {
    "font": "Pretendard Variable, Pretendard, sans-serif",
    "background": "#FAFAF9",
    "text": "#1A1A1A",
    "accent": "#E8503A",
    "spaceUnit": 4,
    "measure": "68ch",
    "radius": 12,
    "surface": "border"
  },
  "resources": { "fontStylesheets": [] },
  "locale": { "number": "ko-KR", "currency": "KRW" }
}
</script>
```

`schemaVersion: 1` is mandatory. The eight `seed` values are the complete
shared visual input:

| Key | Meaning | Valid values |
| --- | --- | --- |
| `font` | reading type family | a safe CSS family list |
| `background` | page background | opaque six-digit hex |
| `text` | authored body text | opaque six-digit hex |
| `accent` | one emphasis color | opaque six-digit hex |
| `spaceUnit` | base spacing unit | integer `2..12` |
| `measure` | prose line length | integer `45..90ch` |
| `radius` | optional soft edge | integer `0..32` |
| `surface` | surface strategy | `border`, `tonal`, or `shadow` |

Optional `dark`, `status`, `resources`, `locale`, and `overrides` refine the
seed. A partial `dark` object inherits omitted values from `seed`. Overrides
may name only semantic roles: `textMuted`, `divider`, `accentStrong`,
`surfaceRaised`, and `focus`. Component names are invalid. `resources` owns
external font stylesheets; a font family is not an implicit network request.

Input strings reject `;`, `{`, `}`, `</script>`, unsafe URLs, and non-whitelisted
units. The assembler escapes `</script>`, U+2028, and U+2029 before embedding
JSON in HTML.

## 3. Resolved token ABI

`CookiebiteTheme.validate(document)` validates input. `CookiebiteTheme.compile(document)`
returns `{ tokens, css, resources, warnings, metadata }`. The compiler is a
browser/Node-compatible UMD module: reports receive `window.CookiebiteTheme`
and Node receives `module.exports`.

It emits these stable CSS properties only:

```css
--cb-background
--cb-surface
--cb-surface-raised
--cb-text
--cb-text-muted
--cb-divider
--cb-accent
--cb-accent-strong
--cb-on-accent
--cb-focus
--cb-space-unit
--cb-measure
--cb-radius
--cb-font
--cb-rhythm
```

The authored `text`, `background`, and on-accent colors are never silently
changed. Text/background and on-accent pairs must meet `4.5:1`; a focus outline
must meet `3:1` against its adjacent surface. Only derived tones may be tuned
to meet those constraints. The compiler emits literal resolved colors so
rendering does not depend on relative-color browser support.

## 4. Core and capabilities

The core owns reset, typography, responsive measure, focus, print, locale
formatting, theme state, capability registration, lifecycle disposal, and
verification instrumentation. It does not create a page, title, section,
icon, card, navigation, control, parent wrapper, or sibling wrapper.

`CB.theme.current()` returns the active compiled theme. `CB.theme.set('light'
| 'dark')` is available only when the theme declares `dark`; it never injects
a toggle. Setting dark toggles a `data-theme="dark"` attribute on the root
element; the assembler ships the dark tokens as a `:root[data-theme="dark"]`
block scoped to that attribute (light is the default with no attribute).

Capabilities are explicit in a `COOKIEBITE:USE` marker. A known but omitted
capability is a fail-fast stub whose error names the marker addition needed.

| Capability | Authored host and call | Returned handle | It must not create |
| --- | --- | --- | --- |
| `chart` | `CB.chart(host, { option, data: { columns, rows }, ariaLabel })` | `{ instance, update(next), resize(), dispose() }` | a frame, caption, toolbar, title, or section |
| `table` | `CB.sortable(table, { numericColumns })` | `{ dispose() }` | a replacement table, grid, filter, or wrapper |
| `glossary` | `CB.glossary(term, { definition })` | `{ dispose() }` | visible chrome or a parent surface |
| `motion` | `CB.motion(target, { play })` | `{ play(), cancel(), dispose() }` | animation controls or a layout wrapper |
| `export` | `CB.export(region, { format: 'print' | 'html' })` | `{ run(), dispose() }` | a button, toolbar, or implicit raster image |

`numericColumns` uses zero-based column indexes. Table sorting is stable,
locale-aware, keyboard-operable, updates `aria-sort`, and restores authored
markup on `dispose()`. Glossary terms are authored as `dfn` or focusable terms;
their definition opens from keyboard focus/activation and closes with Escape.
Motion observes reduced motion and does nothing unless explicitly played.
Export runs only from an author-provided trigger and is limited to scoped print
or HTML output.

Charts require an authored host, an ARIA label, and a structured equivalent
with `columns` and `rows`. The option callback receives the active theme and
is re-evaluated after an allowed theme change. The core records every runtime
capability call for verification.

## 5. Assembly contract

New core templates carry an explicit marker, even with no capabilities:

```html
<!-- COOKIEBITE:USE chart table -->
```

Legacy reports with existing full-runtime placeholders and no marker remain in
compatibility mode. `compat` cannot be combined with a modular capability.
The inliner rejects unknown capabilities and direct undeclared calls before
writing. Declared-but-unused capabilities are warnings. Indirect dynamic calls
fail through known runtime stubs and are reported by verification.

Assembly writes a temporary file and renames it only after every dependency is
resolved. Output order is: compiled theme CSS (`cookiebite-theme-css`), declared
external resources, core CSS (`cookiebite-core-css`), core JS
(`cookiebite-core-js`), selected modules, then authored report scripts. The
inliner emits one JSON block with id `cookiebite-dependency-summary`:

```json
{
  "schemaVersion": 1,
  "mode": "core",
  "declared": ["chart"],
  "includedModules": ["chart"],
  "externalResources": [],
  "versions": {}
}
```

## 6. Verification contract

The browser verifier records `verification.json` with `schemaVersion`,
`complete`, `passed`, `findings`, `inventory`, and `manualReview`. Each finding
has a rule ID, severity, viewport, theme, selector or chart id, measured data,
and screenshot/rectangle evidence.

Hard failures include horizontal overflow, clipped or overlapping text/chart
labels, degenerate charts, uncaught errors, required resource failures,
insufficient contrast, unreachable keyboard interaction, absent chart ARIA or
data alternative, truncated bar baseline, declared/runtime capability
mismatch, and a declared capability that does not respond when its registered
action is driven. Warnings cover repeated literal candidates, extra surfaces, shadows,
icons or controls, unused capabilities, and long documents without a navigation
aid. Information records dependency bytes and counts.

The deterministic verifier runs at `390`, `768`, and `1280` pixels. Core dark
verification runs only when the seed declares `dark`; compatibility reports
retain their authored toggle behavior. Required runtime actions come from the
capability registry.

Some judgments are deliberately human: caption meaning versus data,
status-by-color in arbitrary authored graphics, duplicated claims,
prose-versus-visual suitability, and whether a conclusion is visible in five
seconds. They live in the `manual review` section. A release is incomplete,
not successful, while required entries are unrecorded.

## 7. Compatibility and release

`assets/cookiebite.css`, `assets/cookiebite.js`, and the compatibility template
stay public and unchanged by core execution. Existing reports are never
rewritten. Five legacy scaffold goldens and a legacy theme/inline flow protect
that promise.

Release verification uses a copied, full-depth skill installation from a clean
tracked archive, then runs from an unrelated working directory after the source
is unavailable. The nested theme skill resolves the sibling Cookiebite asset
directory. Comparative evaluation builds baseline `184023c` and the candidate
with identical prompts and recorded A/B randomization. Three independent blind
human recordings are required before claiming preference acceptance.

## TSX authoring layer

The TSX authoring package (`packages/cookiebite`) is a consumer of this contract, not an
extension of it. Report components emit markup, `--cb-*` tokens, and capability
declarations that conform to sections 1–7 above; this document remains the frozen source
of truth and is unchanged by the authoring layer.
