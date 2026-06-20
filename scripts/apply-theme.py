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


# A CSS color value we accept for a preset color key: hex (#rgb/#rgba/#rrggbb/#rrggbbaa),
# or a functional/named form (rgb()/hsl()/oklch()/transparent/named). We can't enumerate
# every named color, so anything non-hex must at least be a non-empty token that doesn't
# contain characters that would break the CSS rule (';', '}', quotes, newlines).
HEX_COLOR_RE = re.compile(r"^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$")
BAD_COLOR_CHARS_RE = re.compile(r"[;{}\"'\n]")

# ---- LOOK SYSTEM (optional theme.json "look":{} object) ----------------------------
# The runtime carrier is window.REPORT_LOOK = { ... }, read once at init via CB.applyLook,
# which sets the html data-* attributes + inline :root vars. apply-theme.py mirrors that:
# it emits REPORT_LOOK (so the runtime owns the wiring) AND the small set of inline :root
# vars / window.PALETTE_MODE / heading-font <link> that must be present at FIRST PAINT.
# Absent look === none of this is emitted (output byte-identical to today).
#
# Enumerated knobs map to a fixed set of allowed values (keeps the emitted markup safe —
# a stray value can't inject CSS); free-scalar knobs are validated for type/shape only.
LOOK_ENUM = {
    "density": ("compact", "comfortable", "spacious"),
    "elevation": ("flat", "soft", "sharp", "bordered"),
    "surface": ("card", "flat", "outlined"),
    "borderStyle": ("solid", "dashed"),
    "paletteMode": ("mono", "analogous", "categorical", "sequential"),
    "bg": ("plain", "wash", "pattern"),
    "header": ("standard", "banded", "bordered"),
    "semanticPreset": ("classic", "muted", "vivid", "colorblind-safe"),
    "darkTint": ("neutral", "warm", "cool", "accent"),
}
# free scalars: radiusScale (number), borderW (number, px), measureProse (CSS length token),
# measurePage (CSS length token), headingFont ({family,url?,fallback?}).
# A CSS length token we can safely emit into a `--var:VALUE;` rule (e.g. 68ch, 1400px,
# clamp(...)). Same safety bar as a non-hex color: no rule-breaking characters.
def _is_safe_css_token(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip()) and \
        BAD_COLOR_CHARS_RE.search(value) is None


def is_valid_color(value: object) -> bool:
    """True if value is a CSS color we can safely emit into a `--var:VALUE;` rule."""
    if not isinstance(value, str):
        return False
    v = value.strip()
    if not v:
        return False
    if HEX_COLOR_RE.match(v):
        return True
    # functional/named form: reject only values that would break the CSS rule
    return BAD_COLOR_CHARS_RE.search(v) is None


def _luminance(hex_color: str) -> float | None:
    """Relative luminance (0..1) of a #rgb/#rrggbb color, or None if not a hex color."""
    v = hex_color.strip().lstrip("#")
    if len(v) in (3, 4):
        v = "".join(c * 2 for c in v[:3])
    elif len(v) in (6, 8):
        v = v[:6]
    else:
        return None
    try:
        r, g, b = (int(v[i:i + 2], 16) / 255 for i in (0, 2, 4))
    except ValueError:
        return None

    def lin(c: float) -> float:
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def validate_preset(preset: object) -> list[str]:
    """Return a list of human-readable problems with the preset, empty if valid.
    Also emits non-fatal warnings (e.g. near-black accent without accentDark) to stderr."""
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
            elif not is_valid_color(colors[k]):
                problems.append(
                    f"color 'colors.{k}' is not a valid color: {colors[k]!r}")
        # Mirror the studio's isNearBlack: a near-black accent (relative luminance < ~0.18)
        # vanishes on a dark surface, so accentDark is expected. Warn (don't fail) if absent,
        # so the CLI and the theme-studio agree on the contract.
        accent = colors.get("accent")
        if is_valid_color(accent):
            lum = _luminance(accent) if isinstance(accent, str) else None
            if lum is not None and lum < 0.18 and not colors.get("accentDark"):
                print(
                    f"warning: accent {accent} is near-black (luminance {lum:.3f} < 0.18) "
                    "but no 'colors.accentDark' is set — it may vanish in dark mode.",
                    file=sys.stderr)
    return problems


def validate_look(look: object) -> list[str]:
    """Return a list of problems with the optional preset['look'] object, empty if valid
    or absent. A present-but-broken look fails loudly (rather than silently emitting junk)."""
    problems: list[str] = []
    if look is None:
        return problems
    if not isinstance(look, dict):
        return ["'look' is not a JSON object"]
    for key, allowed in LOOK_ENUM.items():
        if key in look and look[key] is not None and look[key] not in allowed:
            problems.append(
                f"look.{key} must be one of {allowed}, got {look[key]!r}")
    for key in ("radiusScale", "borderW"):
        if key in look and look[key] is not None and not isinstance(
                look[key], (int, float)) or isinstance(look.get(key), bool):
            problems.append(f"look.{key} must be a number, got {look.get(key)!r}")
    for key in ("measureProse", "measurePage"):
        if key in look and look[key] is not None and not _is_safe_css_token(look[key]):
            problems.append(
                f"look.{key} must be a safe CSS length token, got {look.get(key)!r}")
    hf = look.get("headingFont")
    if hf is not None:
        if not isinstance(hf, dict):
            problems.append("look.headingFont must be an object")
        else:
            if "family" not in hf or not isinstance(hf.get("family"), str) \
                    or not hf["family"].strip():
                problems.append("look.headingFont.family is required (non-empty string)")
            if "url" in hf and hf["url"] is not None and (
                    not isinstance(hf["url"], str) or '"' in hf["url"]):
                problems.append("look.headingFont.url must be a quote-safe string")
            if "fallback" in hf and hf["fallback"] is not None \
                    and not _is_safe_css_token(hf["fallback"]):
                problems.append("look.headingFont.fallback must be a safe CSS token")
    return problems


def build_look(look: dict) -> tuple[str, str, str]:
    """Build the three look fragments for an emitted THEME block:
      (link_html, root_vars, runtime_script)
    - link_html:    a heading-font <link> if look.headingFont.url is given, else ''.
    - root_vars:    extra :root CSS vars (--radius-scale/--border-w/--border-style/
                    --font-heading/--measure-prose/--measure-page/--dark-tint via REPORT_LOOK
                    is runtime-owned; the FIRST-PAINT-critical vars are inlined here).
    - runtime_script: window.REPORT_LOOK = {...} (+ window.PALETTE_MODE) the runtime reads.
    All empty when `look` is empty/absent (caller emits nothing extra → byte-identical)."""
    if not look:
        return "", "", ""

    # (1) heading-font <link> (only if a url is given). family interpolation happens in the
    # runtime via REPORT_LOOK; here we only emit the stylesheet link so the font is fetched
    # at first paint. url is validated quote-safe in validate_look.
    hf = look.get("headingFont") or {}
    link_html = (
        f'<link rel="stylesheet" href="{hf["url"]}" />\n'
        if isinstance(hf, dict) and hf.get("url") else ""
    )

    # (2) extra :root vars that must be correct at FIRST PAINT (before the runtime's
    # CB.applyLook runs). We emit a numeric/length subset; the runtime fills the rest
    # (data-* attrs, --font-heading from headingFont.family, etc.) from REPORT_LOOK.
    var_lines: list[str] = []
    if isinstance(look.get("radiusScale"), (int, float)) \
            and not isinstance(look.get("radiusScale"), bool):
        var_lines.append(f"--radius-scale:{look['radiusScale']};")
    if isinstance(look.get("borderW"), (int, float)) \
            and not isinstance(look.get("borderW"), bool):
        var_lines.append(f"--border-w:{look['borderW']}px;")
    if look.get("borderStyle"):
        var_lines.append(f"--border-style:{look['borderStyle']};")
    if look.get("measureProse"):
        var_lines.append(f"--measure-prose:{look['measureProse']};")
    if look.get("measurePage"):
        var_lines.append(f"--measure-page:{look['measurePage']};")
    root_vars = ("    " + "  ".join(var_lines) + "\n") if var_lines else ""

    # (3) the runtime look carrier. JSON is valid JS and only contains values we've
    # validated (enums from a fixed allow-list, numbers, quote-safe strings), so json.dumps
    # is safe inside a <script> body. We pass the whole validated look through verbatim so
    # the runtime is the single source of truth for applying it (data-* attrs + vars).
    # window.PALETTE_MODE is emitted separately too, because CB.categoricalColors reads the
    # global directly (the contract names it explicitly).
    look_json = json.dumps(look)
    palette = look.get("paletteMode")
    palette_line = (
        f" window.PALETTE_MODE = {json.dumps(palette)};" if palette else ""
    )
    runtime_script = (
        f"<script>window.REPORT_LOOK = {look_json};{palette_line}</script>\n"
    )
    return link_html, root_vars, runtime_script


def build_block(preset: dict) -> str:
    font = preset["font"]
    # The family is interpolated inside a single-quoted CSS string ('…'), so any apostrophe
    # in the name (e.g. "Bob's Font") would close the string early and corrupt the rule.
    # CSS escapes a quote with a backslash inside a quoted string.
    family = font["family"].replace("\\", "\\\\").replace("'", "\\'")
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
    # JSON is valid JS, and double quotes are safe inside a <script> body — emit it
    # directly. The old .replace('"',"'") corrupted any value containing an apostrophe/quote.
    locale = json.dumps(loc)

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

    # OPTIONAL look system. Absent/empty look → all three fragments are '' → the emitted
    # block is byte-identical to the pre-look output (no extra link/vars/script).
    look_link, look_vars, look_script = build_look(preset.get("look") or {})

    # Emit INSIDE the COOKIEBITE:HEAD-THEME wrapper and keep the FOUC-proof / first-paint
    # guidance comment, so re-applying a preset to an already-themed report is stable.
    return (
        f"<!-- COOKIEBITE:HEAD-THEME -->\n"
        f"<!-- THEME — preset: {preset.get('label', preset.get('name', '?'))}. "
        f"Swap this block to re-theme (see assets/theme-studio.html).\n"
        f"     Kept INLINE + synchronous so the correct accent+neutrals apply at "
        f"first paint (FOUC-proof). -->\n"
        f'<link rel="stylesheet" href="{font["url"]}" />\n'
        f"{look_link}"
        f"<style>\n"
        f"  :root{{\n"
        f"    --font-family:'{family}',{fallback};\n"
        f"    {accent}\n"
        f"    {neutrals}\n"
        f"    {semantic}\n"
        f"{look_vars}"
        f"  }}\n"
        f"{dark_override}"
        f"</style>\n"
        f"<script>window.REPORT_LOCALE = {locale};</script>\n"
        f"{look_script}"
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
    problems += validate_look(preset.get("look"))
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
