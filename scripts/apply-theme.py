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
    """Perceptual luma (0..1) of a #rgb/#rrggbb color, or None if not a hex color.
    MUST match the studio's luminance() (theme-studio.html): a straight 0.299/0.587/0.114
    weighted average over 0-255 channels, NO sRGB linearization — so the CLI's near-black
    warning and the studio's isNearBlack() agree on which accents trip the threshold."""
    v = hex_color.strip().lstrip("#")
    if len(v) in (3, 4):
        v = "".join(c * 2 for c in v[:3])
    elif len(v) in (6, 8):
        v = v[:6]
    else:
        return None
    try:
        r, g, b = (int(v[i:i + 2], 16) for i in (0, 2, 4))
    except ValueError:
        return None

    return (0.299 * r + 0.587 * g + 0.114 * b) / 255


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


def _coerce_heading_font(hf: object) -> tuple[dict | None, str | None]:
    """Coerce a headingFont knob to the canonical {family,url?,fallback?} object.
    Returns (coerced_or_None, problem_or_None). LENIENT on read so an older theme.json
    that stored a bare family string still applies (canon: studio EXPORTS the object,
    apply-theme + runtime TOLERATE a bare string). A coerced value is re-validated."""
    if isinstance(hf, str):
        hf = {"family": hf}  # back-compat: bare family string -> {family}
    if not isinstance(hf, dict):
        return None, "look.headingFont must be an object {family,url?,fallback?} or a family string"
    family = hf.get("family")
    if not isinstance(family, str) or not family.strip():
        return None, "look.headingFont.family is required (non-empty string)"
    out: dict = {"family": family}
    url = hf.get("url")
    if url is not None:
        if not isinstance(url, str) or '"' in url:
            return None, "look.headingFont.url must be a quote-safe string"
        out["url"] = url
    fb = hf.get("fallback")
    if fb is not None:
        if not _is_safe_css_token(fb):
            return None, "look.headingFont.fallback must be a safe CSS token"
        out["fallback"] = fb
    return out, None


def _coerce_measure(value: object, default_unit: str) -> tuple[str | None, str | None]:
    """Coerce a measure knob to a unit-bearing CSS length string. Canon: the studio
    EXPORTS a unit string ('58ch','1200px'); on read we tolerate a bare number by
    appending the field's default unit ('ch' for prose, 'px' for page)."""
    if isinstance(value, bool):
        return None, "must be a unit-bearing CSS length string (e.g. '58ch')"
    if isinstance(value, (int, float)):
        return f"{value}{default_unit}", None  # bare number -> append the canonical unit
    if _is_safe_css_token(value):
        return str(value), None
    return None, "must be a safe CSS length token (e.g. '58ch', '1200px')"


def normalize_look(look: object) -> tuple[dict, list[str]]:
    """Validate the optional preset['look'] PER KNOB and return (clean_look, warnings).

    Contract: a single bad knob must NOT abort the whole apply — we warn + SKIP the
    invalid knob and keep the rest. We are LENIENT on read (coerce a bare-string
    headingFont to {family}, a bare-number measure to a unit string) so an older
    theme.json still applies, while the studio now exports the canonical shapes.

    Returns the cleaned look (only valid, canonicalized knobs) and a list of warnings.
    An absent/None look returns ({}, []) so emission stays byte-identical."""
    warnings: list[str] = []
    if look is None:
        return {}, warnings
    if not isinstance(look, dict):
        return {}, ["'look' is not a JSON object — ignoring it"]

    clean: dict = {}
    for key, value in look.items():
        if value is None:
            continue
        if key in LOOK_ENUM:
            if value in LOOK_ENUM[key]:
                clean[key] = value
            else:
                warnings.append(
                    f"look.{key}={value!r} is not one of {LOOK_ENUM[key]} — skipping it")
        elif key == "radiusScale":
            # number OR a named scale the runtime understands ('sharp'/'subtle'/'default'/'round')
            if isinstance(value, (int, float)) and not isinstance(value, bool):
                clean[key] = value
            elif value in ("sharp", "subtle", "default", "round"):
                clean[key] = value
            else:
                warnings.append(
                    f"look.radiusScale={value!r} must be a number or "
                    "'sharp'/'subtle'/'default'/'round' — skipping it")
        elif key == "borderW":
            if isinstance(value, (int, float)) and not isinstance(value, bool):
                clean[key] = value
            else:
                warnings.append(f"look.borderW={value!r} must be a number — skipping it")
        elif key in ("measureProse", "measurePage"):
            unit = "ch" if key == "measureProse" else "px"
            coerced, problem = _coerce_measure(value, unit)
            if coerced is not None:
                clean[key] = coerced
            else:
                warnings.append(f"look.{key}={value!r} {problem} — skipping it")
        elif key == "headingFont":
            coerced, problem = _coerce_heading_font(value)
            if coerced is not None:
                clean[key] = coerced
            else:
                warnings.append(f"{problem} — skipping look.headingFont")
        else:
            # unknown knob: pass it through to REPORT_LOOK only if it's a JSON-safe scalar
            # the runtime might understand; otherwise skip it. Strings are guarded for
            # CSS-rule safety since they may reach a `--var:VALUE;` emit.
            if isinstance(value, (int, float)) or _is_safe_css_token(value):
                clean[key] = value
            else:
                warnings.append(f"look.{key}={value!r} is not a safe value — skipping it")
    return clean, warnings


def build_look(look: dict) -> tuple[str, str, str]:
    """Build the three look fragments for an emitted THEME block:
      (link_html, root_vars, runtime_script)
    - link_html:    a heading-font <link> if look.headingFont.url is given, else ''.
    - root_vars:    extra :root CSS vars that must be correct at FIRST PAINT
                    (--radius-scale/--border-w/--border-style/--font-heading/
                    --measure-prose/--measure-page). The runtime fills the rest
                    (data-* attrs, --dark-tint, etc.) from REPORT_LOOK.
    - runtime_script: window.REPORT_LOOK = {...} (+ window.PALETTE_MODE) the runtime reads.
    All empty when `look` is empty/absent (caller emits nothing extra → byte-identical).
    `look` is the already-normalized dict from normalize_look (canonical shapes)."""
    if not look:
        return "", "", ""

    # (1) heading-font <link> (only if a url is given). headingFont is the canonical
    # {family,url?,fallback?} object after normalize_look; url is validated quote-safe there.
    hf = look.get("headingFont") or {}
    link_html = (
        f'<link rel="stylesheet" href="{hf["url"]}" />\n'
        if isinstance(hf, dict) and hf.get("url") else ""
    )

    # (2) extra :root vars that must be correct at FIRST PAINT (before the runtime's
    # CB.applyLook runs). We emit the numeric/length/font subset; the runtime fills the
    # rest (data-* attrs, --dark-tint) from REPORT_LOOK.
    var_lines: list[str] = []
    if isinstance(look.get("radiusScale"), (int, float)) \
            and not isinstance(look.get("radiusScale"), bool):
        var_lines.append(f"--radius-scale:{look['radiusScale']};")
    if isinstance(look.get("borderW"), (int, float)) \
            and not isinstance(look.get("borderW"), bool):
        var_lines.append(f"--border-w:{look['borderW']}px;")
    if look.get("borderStyle"):
        var_lines.append(f"--border-style:{look['borderStyle']};")
    # --font-heading from headingFont.family (+ optional fallback). Canon: apply-theme
    # emits --font-heading:family(,fallback). The family is interpolated inside a single-
    # quoted CSS string, so escape backslash/apostrophe the same way build_block does.
    if isinstance(hf, dict) and hf.get("family"):
        fam = hf["family"].replace("\\", "\\\\").replace("'", "\\'")
        fb = hf.get("fallback")
        var_lines.append(f"--font-heading:'{fam}'{',' + fb if fb else ''};")
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
    # ACCENT-TEXT CONTRACT: an optional preset hex used as the accent ONLY where the
    # accent is rendered as TEXT on the light surface (the runtime consumes
    # var(--accent-text)). Mirrors theme-studio's buildCSS. Emitted only when present
    # so a preset without accentText stays byte-identical. apostrophe-safety n/a (color
    # value, validated by is_valid_color); but guard it so junk can't be emitted.
    accent_text = colors.get("accentText")
    if accent_text and is_valid_color(accent_text):
        accent += f"  --accent-text:{accent_text};"
    # ACCENT-ON-TEXT CONTRACT (F39): the ink for SMALL (<14px / non-bold) text sitting on
    # an --accent fill, so a bright accent clears the 4.5 small-text AA floor while large
    # titles/fills keep --accent-on. Defaults to var(--accent-on); presets whose white-on-
    # accent already passes omit it (byte-identical). Emitted only when present.
    accent_on_text = colors.get("accentOnText")
    if accent_on_text and is_valid_color(accent_on_text):
        accent += f"  --accent-on-text:{accent_on_text};"
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
    # #111111). --accent-text must also re-pin to the (now light) brand accent: a preset's
    # light-mode accentText is tuned for the light surface and goes low-contrast on the dark
    # one, so the hero figure (which uses --accent-text) needs the dark accent here too.
    accent_dark = colors.get("accentDark")
    accent_on_dark = colors.get("accentOnDark", "#111111")
    dark_override = (
        f'  html[data-theme="dark"]{{ --accent: {accent_dark}; '
        f"--accent-strong: {accent_dark}; --accent-on: {accent_on_dark}; "
        f"--accent-text: var(--accent); }}\n"
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
    if problems:
        print(f"error: preset '{args.preset}' is missing required fields:",
              file=sys.stderr)
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        return 1

    # LOOK: validate per-knob and warn+skip an invalid knob (a single bad knob must NOT
    # abort the whole apply). Replace the raw look with the cleaned/canonicalized one so
    # build_block emits only valid knobs.
    clean_look, look_warnings = normalize_look(preset.get("look"))
    for w in look_warnings:
        print(f"warning: {w}", file=sys.stderr)
    if "look" in preset:
        preset["look"] = clean_look

    try:
        with open(args.html, encoding="utf-8") as f:
            html = f.read()
    except (FileNotFoundError, IsADirectoryError, UnicodeDecodeError):
        print(f"error: report '{args.html}' not found / not readable", file=sys.stderr)
        return 1

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
