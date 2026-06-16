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
# Requires: agent-browser on PATH (lightweight; do NOT substitute Playwright).
set -euo pipefail

HTML="${1:?usage: verify-report.sh <path-to-html> [out-dir]}"
[ -f "$HTML" ] || { echo "file not found: $HTML" >&2; exit 1; }
ABS="$(cd "$(dirname "$HTML")" && pwd)/$(basename "$HTML")"
OUT="${2:-$(dirname "$ABS")/.verify}"
URL="file://$ABS"
S="report-verify-$$"
rm -rf "$OUT"; mkdir -p "$OUT"

ab(){ agent-browser --session "$S" "$@"; }
cleanup(){ ab close >/dev/null 2>&1 || true; }
trap cleanup EXIT

ab --allow-file-access open "$URL" >/dev/null

# capture(label, width): set viewport width, settle, run checks, full shot + legible tiles
capture(){
  local label="$1" width="$2"
  ab set viewport "$width" 1000 >/dev/null 2>&1 || true
  ab wait --load networkidle >/dev/null 2>&1 || true
  ab wait 2200 >/dev/null 2>&1 || true   # let charts animate/settle

  ab eval --stdin > "$OUT/checks-$label.json" 2>/dev/null <<'EOF'
JSON.stringify({
  innerWidth: window.innerWidth,
  pageHeight: document.body.scrollHeight,
  horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
  overflowers: Array.from(document.querySelectorAll('body *'))
    .filter(el => el.getBoundingClientRect().right > window.innerWidth + 4)
    .slice(0, 12)
    .map(el => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')),
  collapsedCharts: Array.from(document.querySelectorAll('canvas, svg, [_echarts_instance_], .echart, [id*="chart"]'))
    .filter(el => el.offsetHeight < 24).length,
}, null, 0)
EOF

  ab screenshot --full "$OUT/full-$label.png" >/dev/null 2>&1 || true

  local H PAGE STEP i y
  H="$(ab eval 'window.innerHeight' 2>/dev/null | tr -dc '0-9')"; H="${H:-1000}"
  PAGE="$(ab eval 'document.body.scrollHeight' 2>/dev/null | tr -dc '0-9')"; PAGE="${PAGE:-$H}"
  STEP=$(( H - 80 )); [ "$STEP" -lt 200 ] && STEP=$H
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
capture desktop 1280
capture narrow 768

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

echo "-> $OUT"
echo "NEXT: Read full-desktop.png + every desktop-tile-*.png at legible size."
echo "Then skim narrow-tile-*.png to confirm the layout survives a narrow viewport"
echo "(TOC collapses, cards stack, charts/tables don't overflow)."
echo "Look for: text/label overlap, clipped or cut-off text, charts that are empty/"
echo "degenerate/unreadable, elements bleeding off the edge, mismatched colors, awkward gaps."
