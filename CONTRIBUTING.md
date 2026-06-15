# Contributing

Thanks for taking a look. This is a small project, so the process is light.

## How it's laid out

- `SKILL.md` — the instructions an agent follows to build a report.
- `assets/template.html` — the report skeleton you copy and fill in.
- `assets/theme-studio.html` — the in-browser theme editor.
- `assets/presets/*.json` — theme token sets.
- `assets/design-packs/<brand>/DESIGN.md` — source design specs for the brand presets.
- `references/*.md` — the deeper guides (libraries, interactions, motion, design tokens).
- `scripts/verify-report.sh` — renders an HTML file and screenshots it in sections so you can check the layout.

## Adding a theme preset

1. Create `assets/presets/<name>.json`. Copy `neutral.json` and change the values. Every preset needs all 17 colors, a font (with a working CDN URL), and a locale.
2. Pick a font that's free and loads from a CDN. Google Fonts is the safe bet.
3. Keep it a light report theme — light background, dark text — even if the brand it's based on ships a dark UI. Reports are read on white.
4. Add it to the `PRESET_LIST` array in `theme-studio.html` so it shows up in the gallery.

## Before you open a PR

Run the visual check on anything you touched that renders:

```bash
bash scripts/verify-report.sh assets/template.html
```

Then open the screenshots it writes and look at them. The script can't tell you a label is overlapping or a chart broke — only your eyes can. It needs [agent-browser](https://github.com/built-by-as/agent-browser) on your PATH.

## Style

Match what's already there. Inline styles in the HTML, no build step, everything over CDN so a report is one file you can double-click.
