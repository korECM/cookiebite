#!/usr/bin/env python3
"""Apply a theme preset to a report's THEME block.

Reads a preset JSON (assets/presets/*.json) and rewrites the block between
the `<!-- THEME ... -->` and `<!-- end THEME -->` markers in an HTML file, so
the whole report re-themes from one swap.

Usage:
    python scripts/apply-theme.py <preset> <report.html> [-o out.html]

<preset> may be a bare preset name (e.g. 'neutral', 'vercel'), resolved against this
script's own assets/presets/<name>.json, or a literal path to a preset JSON.

With no -o, it writes back to the same file.
"""
import argparse
import json
import re
import sys
from pathlib import Path

# this script's own preset library (mirrors how inline.sh resolves the runtime from
# its own dir, not the cwd) — so a bare preset name works from anywhere.
PRESETS_DIR = Path(__file__).resolve().parent.parent / "assets" / "presets"

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

# Anchor to the real wrapper so a stray earlier "<!-- THEME" comment can't swallow the
# title/runtime/marker. Prefer the COOKIEBITE:HEAD-THEME wrapper; fall back to the
# em-dash "THEME —" header (both authored by the template / theme-studio output).
BLOCK_RE = re.compile(
    r"<!-- COOKIEBITE:HEAD-THEME -->.*?<!-- /COOKIEBITE:HEAD-THEME -->"
    r"|<!-- THEME —.*?<!-- end THEME -->",
    re.DOTALL,
)

# locale.number (BCP-47-ish) -> html lang attribute
LOCALE_TO_LANG = {
    "en-US": "en", "en-GB": "en", "ko-KR": "ko", "ja-JP": "ja",
    "zh-CN": "zh", "zh-TW": "zh", "fr-FR": "fr", "de-DE": "de",
    "es-ES": "es", "pt-BR": "pt", "it-IT": "it",
}
LANG_ATTR_RE = re.compile(r'(<html\b[^>]*\blang=")([^"]*)(")', re.IGNORECASE)

# html lang -> the TOC heading word baked into template.html's COOKIEBITE:TOC slot.
# The template ships the Korean "목차"; when a non-Korean preset is applied we swap it
# so an en/ja/… report doesn't carry a lone Korean word in its most prominent nav element.
TOC_HEADING = {
    "ko": "목차", "en": "Contents", "ja": "目次", "zh": "目录",
    "fr": "Sommaire", "de": "Inhalt", "es": "Contenido",
    "pt": "Sumário", "it": "Indice",
}
# Match the hard-coded "목차" heading <p> inside the COOKIEBITE:TOC slot (anchored to the
# slot comment so we never touch a "목차" that happens to appear in report content).
TOC_HEADING_RE = re.compile(
    r"(<!-- COOKIEBITE:TOC -->\s*<p\b[^>]*>)목차(</p>)", re.DOTALL
)


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
    # accent-on must flip too, else accent-filled text (which sits on --accent) goes
    # invisible: a near-black accent's --accent-on is white, but the dark accent is
    # light, so the override re-pins --accent-on to a dark ink (accentOnDark, default
    # #111111).
    accent_dark = colors.get("accentDark")
    accent_on_dark = colors.get("accentOnDark", "#111111")
    dark_override = (
        f'  html[data-theme="dark"]{{ --accent: {accent_dark}; '
        f"--accent-strong: {accent_dark}; --accent-on: {accent_on_dark}; }}\n"
        if accent_dark
        else ""
    )

    # Emit INSIDE the COOKIEBITE:HEAD-THEME wrapper and keep the FOUC-proof / first-paint
    # guidance comment, so re-applying a preset to an already-themed report is stable.
    return (
        f"<!-- COOKIEBITE:HEAD-THEME -->\n"
        f"<!-- THEME — preset: {preset.get('label', preset.get('name', '?'))}. "
        f"Swap this block to re-theme (see assets/theme-studio.html).\n"
        f"     Kept INLINE + synchronous so the correct accent+neutrals apply at "
        f"first paint (FOUC-proof). -->\n"
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
        f"<!-- end THEME -->\n"
        f"<!-- /COOKIEBITE:HEAD-THEME -->"
    )


def resolve_preset_path(arg: str) -> Path:
    """Resolve a preset arg to a file path: a bare name maps to this script's own
    assets/presets/<name>.json; anything else is treated as a literal path."""
    name_candidate = PRESETS_DIR / f"{arg}.json"
    if not arg.endswith(".json") and name_candidate.is_file():
        return name_candidate
    return Path(arg)


def available_presets() -> str:
    names = sorted(p.stem for p in PRESETS_DIR.glob("*.json"))
    return ", ".join(names) if names else "(none found)"


def apply_lang(html: str, preset: dict) -> str:
    """Rewrite <html lang="…"> from the preset's locale.number; warn if not derivable."""
    number = (preset.get("locale") or {}).get("number")
    lang = LOCALE_TO_LANG.get(number or "")
    m = LANG_ATTR_RE.search(html)
    if not lang or not m:
        if not m:
            print("warning: no recognizable <html lang> attribute to rewrite",
                  file=sys.stderr)
        else:
            print(f"warning: no html lang mapping for locale '{number}'",
                  file=sys.stderr)
        return html
    return LANG_ATTR_RE.sub(rf"\g<1>{lang}\g<3>", html, count=1)


def apply_toc_heading(html: str, preset: dict) -> str:
    """Localize the hard-coded Korean '목차' TOC heading to the preset's language, so a
    non-Korean preset doesn't leave a lone Korean word in the most prominent nav element."""
    number = (preset.get("locale") or {}).get("number")
    lang = LOCALE_TO_LANG.get(number or "")
    heading = TOC_HEADING.get(lang or "")
    if not heading or heading == "목차":
        return html  # Korean (or unmapped) locale: leave the template default untouched
    return TOC_HEADING_RE.sub(rf"\g<1>{heading}\g<2>", html, count=1)


def main() -> int:
    ap = argparse.ArgumentParser(description="Apply a theme preset to a report.")
    ap.add_argument("preset", help="preset name (e.g. 'neutral') or path to a preset JSON")
    ap.add_argument("html", help="path to the report HTML")
    ap.add_argument("-o", "--out", help="output path (default: in place)")
    args = ap.parse_args()

    preset_path = resolve_preset_path(args.preset)
    try:
        with open(preset_path, encoding="utf-8") as f:
            preset = json.load(f)
    except FileNotFoundError:
        print(f"error: preset '{args.preset}' not found.", file=sys.stderr)
        print(f"  available presets: {available_presets()}", file=sys.stderr)
        return 1
    except json.JSONDecodeError as e:
        print(f"error: preset '{args.preset}' is not valid JSON: {e}", file=sys.stderr)
        return 1

    problems = validate_preset(preset)
    if problems:
        print(f"error: preset '{args.preset}' is missing required fields:",
              file=sys.stderr)
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        return 1

    with open(args.html, encoding="utf-8") as f:
        html = f.read()

    matches = BLOCK_RE.findall(html)
    if len(matches) != 1:
        print(f"error: expected exactly one THEME block in {args.html}, "
              f"found {len(matches)}", file=sys.stderr)
        return 1

    out_html = BLOCK_RE.sub(lambda _: build_block(preset), html, count=1)
    out_html = apply_lang(out_html, preset)
    out_html = apply_toc_heading(out_html, preset)
    out_path = args.out or args.html
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(out_html)
    print(f"applied '{preset.get('label', preset.get('name', '?'))}' -> {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
