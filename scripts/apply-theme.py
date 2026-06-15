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

    return (
        f"<!-- THEME — preset: {preset.get('label', preset['name'])}. "
        f"Swap this block to re-theme (see assets/theme-studio.html). -->\n"
        f'<link rel="stylesheet" href="{font["url"]}" />\n'
        f"<style>\n"
        f"  :root{{\n"
        f"    --font-family:'{family}',{fallback};\n"
        f"    {accent}\n"
        f"    {neutrals}\n"
        f"    {semantic}\n"
        f"  }}\n"
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
    print(f"applied '{preset.get('label', preset['name'])}' -> {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
