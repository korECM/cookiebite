#!/usr/bin/env python3
"""Apply a theme preset to a report's THEME block.

Reads a preset JSON (assets/presets/*.json) and rewrites the block between
the `<!-- THEME ... -->` and `<!-- end THEME -->` markers in an HTML file, so
the whole report re-themes from one swap.

Usage:
    python scripts/apply-theme.py <preset.json> <report.html> [-o out.html]

With no -o, it writes back to the same file.
"""
import argparse
import json
import re
import sys

# preset color key -> CSS variable name (matches assets/template.html)
COLOR_VARS = {
    "accent": "--accent", "accentStrong": "--accent-strong",
    "accentWeak": "--accent-weak", "accentOn": "--accent-on",
    "bg": "--c-bg", "surface": "--c-surface", "primary": "--c-primary",
    "secondary": "--c-secondary", "disabled": "--c-disabled",
    "placeholder": "--c-placeholder", "line": "--c-line",
    "lineWeak": "--c-line-weak", "disabledBg": "--c-disabled-bg",
    "critical": "--c-critical", "cautionary": "--c-cautionary",
    "positive": "--c-positive", "informative": "--c-informative",
}

BLOCK_RE = re.compile(r"<!-- THEME.*?<!-- end THEME -->", re.DOTALL)


def validate_preset(preset: object) -> list[str]:
    """Return a list of human-readable problems with the preset, empty if valid."""
    problems = []
    if not isinstance(preset, dict):
        return ["preset is not a JSON object"]

    font = preset.get("font")
    if not isinstance(font, dict):
        problems.append("missing 'font' object")
    else:
        for k in ("family", "url"):
            if k not in font:
                problems.append(f"missing font key 'font.{k}'")

    if "locale" not in preset:
        problems.append("missing 'locale'")

    colors = preset.get("colors")
    if not isinstance(colors, dict):
        problems.append("missing 'colors' object")
    else:
        for k in COLOR_VARS:
            if k not in colors:
                problems.append(f"missing color key 'colors.{k}'")
    return problems


def build_block(preset: dict) -> str:
    font = preset["font"]
    family = font["family"]
    fallback = font.get("fallback", "-apple-system, system-ui, sans-serif")
    colors = preset["colors"]
    loc = preset["locale"]

    accent = "  ".join(
        f"{COLOR_VARS[k]}:{colors[k]};" for k in
        ("accent", "accentStrong", "accentWeak", "accentOn")
    )
    neutrals = "  ".join(
        f"{COLOR_VARS[k]}:{colors[k]};" for k in
        ("bg", "surface", "primary", "secondary", "disabled",
         "placeholder", "line", "lineWeak", "disabledBg")
    )
    semantic = "  ".join(
        f"{COLOR_VARS[k]}:{colors[k]};" for k in
        ("critical", "cautionary", "positive", "informative")
    )
    locale = json.dumps(loc).replace('"', "'")

    # ACCENT-DARK CONTRACT: an optional preset hex used as the accent ONLY in dark
    # mode (for near-black accents that vanish on a dark surface). When present, emit a
    # dark-scoped override AFTER the :root block; presets without it emit nothing extra.
    accent_dark = colors.get("accentDark")
    dark_override = (
        f'  html[data-theme="dark"]{{ --accent: {accent_dark}; '
        f"--accent-strong: {accent_dark}; }}\n"
        if accent_dark
        else ""
    )

    return (
        f"<!-- THEME — preset: {preset.get('label', preset.get('name', '?'))}. "
        f"Swap this block to re-theme (see assets/theme-studio.html). -->\n"
        f'<link rel="stylesheet" href="{font["url"]}" />\n'
        f"<style>\n"
        f"  :root{{\n"
        f"    --font-family:'{family}',{fallback};\n"
        f"    {accent}\n"
        f"    {neutrals}\n"
        f"    {semantic}\n"
        f"  }}\n"
        f"{dark_override}"
        f"</style>\n"
        f"<script>window.REPORT_LOCALE = {locale};</script>\n"
        f"<!-- end THEME -->"
    )


def main() -> int:
    ap = argparse.ArgumentParser(description="Apply a theme preset to a report.")
    ap.add_argument("preset", help="path to a preset JSON")
    ap.add_argument("html", help="path to the report HTML")
    ap.add_argument("-o", "--out", help="output path (default: in place)")
    args = ap.parse_args()

    with open(args.preset, encoding="utf-8") as f:
        preset = json.load(f)

    problems = validate_preset(preset)
    if problems:
        print(f"error: preset '{args.preset}' is missing required fields:",
              file=sys.stderr)
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        return 1

    with open(args.html, encoding="utf-8") as f:
        html = f.read()

    if not BLOCK_RE.search(html):
        print("error: no <!-- THEME ... end THEME --> block found in", args.html,
              file=sys.stderr)
        return 1

    out_html = BLOCK_RE.sub(lambda _: build_block(preset), html, count=1)
    out_path = args.out or args.html
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(out_html)
    print(f"applied '{preset.get('label', preset.get('name', '?'))}' -> {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
