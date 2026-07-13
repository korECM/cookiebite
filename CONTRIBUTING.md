# Contributing

Thanks for taking a look. This is a small project, so the process is light.

## How it's laid out

There are two build paths, and they don't share a runtime:

- **Freeform (the default).** `assets/template.html` is the reading skeleton — author-owned semantic HTML, the small core runtime in `assets/core/cookiebite-core.*`, and an empty `<!-- COOKIEBITE:USE -->` marker. Opt-in behavior lives in `assets/capabilities/*` (chart, table, glossary, motion, export). `DESIGN.md` is the frozen design contract for this path — treat it as the spec, not a suggestion.
- **Legacy full-runtime.** `assets/template-compat.html` plus the `assets/cookiebite.css` / `assets/cookiebite.js` bundle back the five typed reports (dashboard, review, postmortem, explainer, comparison). This bundle stays public and unchanged — existing reports must keep rendering.

Everything else:

- `SKILL.md` — the instructions an agent follows to build a report.
- `assets/theme-studio.html` — the in-browser theme editor.
- `assets/presets/*.json` — theme token sets.
- `assets/design-packs/<brand>/DESIGN.md` — source design specs for the brand presets.
- `references/*.md` — the deeper guides (libraries, interactions, motion, design tokens).
- `tests/*.mjs` — unit and contract tests, run with `node --test`.
- `evals/*.sh` — real-browser evals (the release gate; see below).
- `scripts/verify-report.sh` — renders an HTML file and screenshots it in sections so you can check the layout.

## Adding a theme preset

1. Create `assets/presets/<name>.json`. Copy `neutral.json` and change the values. Every preset needs all 17 colors, a font (with a working CDN URL), and a locale.
2. Pick a font that's free and loads from a CDN. Google Fonts is the safe bet.
3. Keep it a light report theme — light background, dark text — even if the brand it's based on ships a dark UI. Reports are read on white.
4. Add it to the `PRESET_LIST` array in `theme-studio.html` so it shows up in the gallery.

## Before you open a PR

Run the eval suite — it's the release gate:

```bash
bash evals/run.sh
```

It checks syntax, the palette validator's self-test, every TYPE scaffold, and renders
a kitchen-sink fixture through `verify-report.sh`, asserting the checks JSON (console
errors, overflow, palette verdicts, label clipping/overlap, and that the deliberate
truncated-baseline bait still warns) plus real-browser interactions (filter chips,
storyline, altitude, dark mode). See `evals/README.md`.

Then run the visual check on anything you touched that renders and look at the
screenshots yourself:

```bash
bash scripts/verify-report.sh assets/template.html
```

The automated `labelIssues` pass catches clipped/overlapping chart labels, but
geometry, color, and caption↔visual mismatches still need your eyes. Both need
[agent-browser](https://github.com/built-by-as/agent-browser) on your PATH.

## Style

Match what's already there. Inline styles in the HTML, no build step, everything over CDN so a report is one file you can double-click.
