#!/usr/bin/env bash
# Render an HTML report in a headless browser (agent-browser) and capture
# LEGIBLE, sectioned screenshots so the model can visually self-check the layout
# before handing the report over. A full-page screenshot alone gets downscaled when
# read and hides exactly the failures we care about (label collisions, overlap,
# clipped text, broken charts) — so we also slice the page into viewport-sized tiles.
#
# Usage:  verify-report.sh <path-to-html> [out-dir]
# Output: <out-dir>/full.png, <out-dir>/tile-NN.png, <out-dir>/checks.json
#
# Requires: agent-browser (lightweight; do NOT substitute Playwright). Resolved from
# PATH, else `npx -y agent-browser`, else `bunx agent-browser`; prints install help if none.
set -euo pipefail

HTML="${1:?usage: verify-report.sh <path-to-html> [out-dir]}"
[ -f "$HTML" ] || { echo "file not found: $HTML" >&2; exit 1; }
ABS="$(cd "$(dirname "$HTML")" && pwd)/$(basename "$HTML")"
OUT="${2:-$(dirname "$ABS")/.verify}"
URL="file://$ABS"
S="report-verify-$$"

# Resolve an agent-browser runner: PATH binary first, then npx, then bunx.
if command -v agent-browser >/dev/null 2>&1; then AB="agent-browser"
elif command -v npx >/dev/null 2>&1 && npx -y agent-browser --version >/dev/null 2>&1; then AB="npx -y agent-browser"
elif command -v bunx >/dev/null 2>&1 && bunx agent-browser --version >/dev/null 2>&1; then AB="bunx agent-browser"
else
  echo "agent-browser not found. Install it with:" >&2
  echo "    npm i -g agent-browser && agent-browser install" >&2
  echo "(or make 'npx -y agent-browser' / 'bunx agent-browser' runnable)" >&2
  exit 127
fi
ab(){ $AB --session "$S" "$@"; }
# Clean prior output, but never `rm -rf` an arbitrary user-supplied dir wholesale.
# Default workflow uses a `.verify` sentinel dir we own -> safe to wipe entirely.
# Any other out-dir: only remove the known artifact globs we emit, never the dir.
mkdir -p "$OUT"   # only after the runner resolves, so a missing runner never wipes prior output
case "$(basename "$OUT")" in
  *.verify) rm -rf "$OUT"; mkdir -p "$OUT" ;;  # sentinel dir we create -> safe to wipe
  *) rm -f "$OUT"/full-*.png "$OUT"/*-tile-*.png "$OUT"/checks-*.json \
        "$OUT"/_*.json "$OUT"/_inlined.html 2>/dev/null || true ;;  # only our artifacts
esac

# Auto-inline: if the report still carries the raw ./assets/cookiebite.* placeholders
# (not yet folded by inline.sh), inline it into a throwaway copy under $OUT and render
# THAT — so the edit->verify loop stays a single step and no .inlined.html litters the
# repo. The real deliverable is still produced explicitly with inline.sh at hand-over.
if grep -qiE '<script[^>]+src=["'\''][^"'\'']*assets/cookiebite\.js' "$ABS" \
   && ! grep -qi 'id="cookiebite-js"' "$ABS"; then
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  # Capture inline.sh's stderr so a real failure is surfaced (not swallowed by 2>/dev/null).
  if INLINE_ERR="$(bash "$SCRIPT_DIR/inline.sh" "$ABS" -o "$OUT/_inlined.html" 2>&1)"; then
    URL="file://$OUT/_inlined.html"
    echo "[auto-inline] raw runtime placeholders folded into $OUT/_inlined.html (rendering that)."
    echo "  Deliverable stays explicit: bash scripts/inline.sh '$HTML' -o <report>.final.html"
  else
    echo "[auto-inline] inline.sh failed — rendering the raw file as-is (charts/helpers may not load)." >&2
    [ -n "$INLINE_ERR" ] && printf '%s\n' "$INLINE_ERR" >&2
  fi
fi

cleanup(){ ab close >/dev/null 2>&1 || true; }
trap cleanup EXIT

ab --allow-file-access open "$URL" >/dev/null

# Force LIGHT for the desktop + narrow passes regardless of the runner's OS color-scheme.
# First load honours prefers-color-scheme, so on a dark-set machine the "light" primary
# pass renders dark and the intended default (light) theme goes unverified. The dark pass
# below flips to dark explicitly, keeping the 3 passes orthogonal: light, light, dark.
ab eval "window.applyTheme ? applyTheme('light') : (document.documentElement.dataset.theme='light')" >/dev/null 2>&1 || true
ab wait 300 >/dev/null 2>&1 || true

# capture(label, width): set viewport width, settle, run checks, full shot + legible tiles
capture(){
  local label="$1" width="$2"
  ab set viewport "$width" 1000 >/dev/null 2>&1 || true
  ab wait --load networkidle >/dev/null 2>&1 || true
  ab wait 2200 >/dev/null 2>&1 || true   # let charts animate/settle

  ab eval --stdin > "$OUT/_checks-$label.dom.json" 2>/dev/null <<'EOF'
(function () {
  var wide = Array.from(document.querySelectorAll('body *'))
    .filter(el => el.getBoundingClientRect().right > window.innerWidth + 4);
  // Grid.js wraps its table in a .gridjs-wrapper that scrolls internally, so a wide table
  // there is EXPECTED — not a page-level break. Fold those out so the real signal isn't
  // buried under thead/th/sort-button noise that fires on every multi-column table at 390px.
  // ALSO fold out genuine self-scrollers: an element (or an ancestor) whose own computed
  // overflow-x is auto/scroll contains its own width (e.g. <pre>/<code class="overflow-x-auto">),
  // so it's not a page-level break either — the page-level horizontalOverflow signal stays intact.
  var selfScrolls = function (el) {
    for (var n = el; n && n !== document.body; n = n.parentElement) {
      var ox = getComputedStyle(n).overflowX;
      if (ox === 'auto' || ox === 'scroll') return true;
    }
    return false;
  };
  var real = wide.filter(el => !el.closest('.gridjs-wrapper, .gridjs-container, .gridjs') && !selfScrolls(el));
  return JSON.stringify({
    innerWidth: window.innerWidth,
    pageHeight: document.body.scrollHeight,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2, // PRIMARY layout-break signal
    overflowers: real.slice(0, 12)
      .map(el => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')),
    tableScrollsInternally: wide.length > real.length, // wide Grid.js table inside its own scroller — OK, not a break
    collapsedCharts: Array.from(document.querySelectorAll('canvas, svg, [_echarts_instance_], .echart, [id*="chart"]'))
      .filter(el => el.offsetHeight < 24).length,
  }, null, 0);
})()
EOF

  # Console-error signal: the skill tells reviewers to hunt console errors, so surface them
  # in checks-*.json. agent-browser exposes both `console` (console.* calls) and `errors`
  # (uncaught page exceptions) — these are disjoint, so we merge: console messages of
  # type 'error' + all page errors -> consoleErrors[] with a consoleErrorCount.
  ab console --json > "$OUT/_console-$label.json" 2>/dev/null || echo '{}' > "$OUT/_console-$label.json"
  ab errors --json > "$OUT/_errors-$label.json" 2>/dev/null || echo '{}' > "$OUT/_errors-$label.json"
  # `ab eval` returns the JSON-stringified return value, so the DOM checks land
  # double-encoded (a JSON string whose value is the checks object). Preserve that exact
  # shape: unwrap -> parse -> add the two keys -> re-emit as a JSON string.
  python3 - "$OUT/_checks-$label.dom.json" "$OUT/_console-$label.json" "$OUT/_errors-$label.json" \
    > "$OUT/checks-$label.json" 2>/dev/null <<'PY' || true
import json, sys
raw = json.load(open(sys.argv[1]))            # outer: a JSON string
dom = json.loads(raw) if isinstance(raw, str) else raw
def load(p):
    try: return json.load(open(p))
    except Exception: return {}
con = load(sys.argv[2]); err = load(sys.argv[3])
errs = []
for m in (con.get("data") or {}).get("messages", []) or []:
    if m.get("type") == "error":
        errs.append(m.get("text", ""))
for e in (err.get("data") or {}).get("errors", []) or []:
    errs.append(e.get("text", ""))
dom["consoleErrorCount"] = len(errs)
dom["consoleErrors"] = errs[:20]
print(json.dumps(json.dumps(dom, separators=(",", ":"))))  # re-wrap to match ab eval shape
PY
  # Validate the merged checks file is non-empty valid JSON. If the python step or the
  # DOM eval produced nothing usable, emit an explicit error marker instead of silently
  # leaving an empty file and reporting success (the old `|| cp` masked exactly this).
  if ! python3 -c 'import json,sys; json.load(open(sys.argv[1]))' "$OUT/checks-$label.json" 2>/dev/null \
     || [ ! -s "$OUT/checks-$label.json" ]; then
    echo "⚠ [$label] DOM checks failed to produce valid JSON — see stderr." >&2
    printf '%s\n' '{"error":"checks failed","label":"'"$label"'"}' > "$OUT/checks-$label.json"
  fi
  rm -f "$OUT/_checks-$label.dom.json" "$OUT/_console-$label.json" "$OUT/_errors-$label.json"

  local H PAGE STEP i y
  H="$(ab eval 'window.innerHeight' 2>/dev/null | tr -dc '0-9')"; H="${H:-1000}"
  PAGE="$(ab eval 'document.body.scrollHeight' 2>/dev/null | tr -dc '0-9')"; PAGE="${PAGE:-$H}"
  STEP=$(( H - 80 )); [ "$STEP" -lt 200 ] && STEP=$H

  # Pre-scroll the whole page to the bottom and back BEFORE the full-page shot, so
  # IntersectionObserver/AOS reveals fire and lazy content paints. Otherwise full-*.png
  # captures blank space below the fold (content reveals only on scroll). Step down in
  # viewport chunks (a single jump to the bottom can skip observers mid-page), settle,
  # then return to top so the full capture starts clean.
  y=0
  while [ "$y" -lt "$PAGE" ]; do
    ab eval "window.scrollTo(0,$y)" >/dev/null 2>&1 || true
    ab wait 120 >/dev/null 2>&1 || true
    y=$(( y + STEP ))
  done
  ab eval "window.scrollTo(0,$PAGE)" >/dev/null 2>&1 || true
  ab wait 300 >/dev/null 2>&1 || true     # settle reveals/animations at the very bottom
  ab eval "window.scrollTo(0,0)" >/dev/null 2>&1 || true
  ab wait 300 >/dev/null 2>&1 || true     # let the page settle back at the top

  ab screenshot --full "$OUT/full-$label.png" >/dev/null 2>&1 || true

  i=0; y=0
  while [ "$y" -lt "$PAGE" ]; do
    ab eval "window.scrollTo(0,$y)" >/dev/null 2>&1 || true
    ab wait 180 >/dev/null 2>&1 || true
    ab screenshot "$OUT/${label}-tile-$(printf '%02d' "$i").png" >/dev/null 2>&1 || true
    i=$(( i + 1 )); y=$(( y + STEP ))
    [ "$i" -gt 40 ] && break
  done
  ab eval "window.scrollTo(0,0)" >/dev/null 2>&1 || true
  echo "[$label @ ${width}px] $i tiles + full-$label.png | checks: $(cat "$OUT/checks-$label.json" 2>/dev/null)"
}

# Desktop pass (primary) + narrow pass (catch mobile/stacking breakage).
# Narrow is 390px (a real phone), NOT 768: Tailwind's md: breakpoint is exactly 768px,
# so a 768 pass leaves md:grid-cols-* in their 2-col state and never tests the stacked
# mobile layout. 390 is below sm/md/lg, so it exercises the fully-collapsed layout.
capture desktop 1280
capture narrow 390

# Dark pass (only if the report ships a dark toggle) — flip to dark and re-capture
# at desktop width so dark-mode contrast + re-themed charts get eyeballed too.
# Calls the page's applyTheme() so canvas charts re-theme, falling back to a raw flip.
HAS_DARK="$(ab eval "!!document.getElementById('themeToggle')" 2>/dev/null | tr -d '[:space:]')"
if [ "$HAS_DARK" = "true" ]; then
  ab eval "window.applyTheme ? applyTheme('dark') : (document.documentElement.dataset.theme='dark')" >/dev/null 2>&1 || true
  ab wait 400 >/dev/null 2>&1 || true
  capture dark 1280
  ab eval "window.applyTheme ? applyTheme('light') : (document.documentElement.dataset.theme='light')" >/dev/null 2>&1 || true
fi

# Theme assert: the rendered --accent must equal the THEME block's declared value.
# Catches the "source says Persimmon but it renders indigo" class of cascade bugs
# (a later/un-layered :root silently overriding the THEME block) that screenshots miss.
# Capture the FULL declared --accent value (up to ';'), not just a HEX — so rgb()/hsl()/
# oklch()/named accents are asserted too instead of silently skipping the check. Normalize
# both sides through the browser (set --_assert to the declared value, read it back computed)
# so any color format compares apples-to-apples regardless of how it was written.
DECL_RAW="$(grep -oiE '\-\-accent:[^;}]*' "$ABS" | head -1 | sed -E 's/^[^:]*:[[:space:]]*//; s/[[:space:]]+$//')"
norm(){ # normalize a color string the same way for both sides: lowercase, strip spaces/quotes, expand 3-digit hex
  local v; v="$(printf '%s' "$1" | tr -d '[:space:]"' | tr 'A-Z' 'a-z')"
  if printf '%s' "$v" | grep -qiE '^#[0-9a-f]{3}$'; then
    v="#$(printf '%s' "${v#\#}" | sed -E 's/(.)(.)(.)/\1\1\2\2\3\3/')"
  fi
  printf '%s' "$v"
}
DECL="$(norm "$DECL_RAW")"
COMP="$(norm "$(ab eval "getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()" 2>/dev/null)")"
if [ -n "$DECL" ] && [ -n "$COMP" ] && [ "$DECL" != "$COMP" ]; then
  # Non-hex formats (rgb/hsl/oklch/named) can differ textually yet render identically; the
  # browser's computed value is canonical, so resolve the declared value through the page too.
  if printf '%s' "$DECL" | grep -qiE '^#[0-9a-f]{3,8}$'; then
    echo "⚠ THEME MISMATCH: THEME block declares --accent $DECL but the page renders $COMP." >&2
    echo "  A later or un-layered :root is overriding the THEME block — check the @layer wrapping / inline order." >&2
  else
    RESOLVED="$(norm "$(ab eval "var e=document.createElement('span');e.style.color=$( printf '%s' "$DECL_RAW" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))');document.body.appendChild(e);var c=getComputedStyle(e).color;e.remove();c" 2>/dev/null)")"
    RESCOMP="$(norm "$(ab eval "var e=document.createElement('span');e.style.color=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();document.body.appendChild(e);var c=getComputedStyle(e).color;e.remove();c" 2>/dev/null)")"
    if [ -n "$RESOLVED" ] && [ -n "$RESCOMP" ] && [ "$RESOLVED" != "$RESCOMP" ]; then
      echo "⚠ THEME MISMATCH: THEME block declares --accent $DECL_RAW but the page renders $COMP (resolved $RESOLVED vs $RESCOMP)." >&2
      echo "  A later or un-layered :root is overriding the THEME block — check the @layer wrapping / inline order." >&2
    else
      echo "[theme] note: --accent is non-hex ($DECL_RAW); declared/rendered resolve equal — assert passed." >&2
    fi
  fi
fi

echo "-> $OUT"
echo "NEXT: Read full-desktop.png + every desktop-tile-*.png at legible size."
echo "Then skim narrow-tile-*.png to confirm the layout survives a narrow viewport"
echo "(TOC collapses, cards stack, charts/tables don't overflow)."
echo "Look for: text/label overlap, clipped or cut-off text, charts that are empty/"
echo "degenerate/unreadable, elements bleeding off the edge, mismatched colors, awkward gaps."
echo "checks-*.json: 'horizontalOverflow' is the primary layout-break signal. 'overflowers'"
echo "now excludes Grid.js internal nodes; 'tableScrollsInternally:true' just means a wide"
echo "table scrolls inside its own wrapper (fine). 'consoleErrorCount'/'consoleErrors' surface"
echo "console.error() calls + uncaught page exceptions — any non-zero count is worth a look."
echo "desktop+narrow render LIGHT, dark is its own pass."
echo "CLEANUP: these are throwaway artifacts — 'rm -rf $OUT' when done (it's regenerated each run)."
