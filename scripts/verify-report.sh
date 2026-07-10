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
# Absolutize OUT up front (without creating it yet — the mkdir still waits until the runner
# resolves, so a missing runner never touches the filesystem): a RELATIVE custom out-dir
# otherwise yields a relative file:// URL for the auto-inlined copy below, crashing the
# runner with ERR_INVALID_URL. Resolve an existing dir via cd/pwd; otherwise prefix $PWD.
case "$OUT" in
  /*) ;;
  *) if [ -d "$OUT" ]; then OUT="$(cd "$OUT" && pwd)"; else OUT="$PWD/$OUT"; fi ;;
esac
# cbrender=svg: the runtime renders every chart with the SVG renderer during verify,
# turning chart labels into real <text> nodes the label-issue detector below can measure.
QS="?cbrender=svg"
URL="file://$ABS$QS"
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
    URL="file://$OUT/_inlined.html$QS"
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
  // Custom-scale guard: the whole design system remaps Tailwind's w-12/w-16 to 12px/16px
  // (icon + spacing scale), which only takes if window.tailwind.config was assigned BEFORE
  // the Play CDN scanned. If cookiebite.js loads first (or a tool reorders <head>), the
  // config is ignored and w-12 falls back to the default 48px rem scale — every Lucide icon
  // renders 4x and flex layouts collapse. Measure a throwaway w-12: ~12px means the custom
  // scale applied; ~48px means the load-order contract was violated. Also count visibly
  // oversized rendered icons (svg/[data-lucide] taller than 32px) as a corroborating signal.
  // LABEL ISSUES — the automated version of the 'read the pixels' pass for chart text:
  // with the SVG renderer (cbrender=svg) every label is a <text> node, so we can measure
  // (a) CLIPPED labels poking past their chart box and (b) OVERLAPPING label pairs
  // (intersection > 35% of the smaller box — adjacent ticks touching don't count).
  // TEXT CLIPS — the HTML sibling of the chart-label pass: an element that owns text
  // and cuts it off (overflow hidden/clip or text-overflow ellipsis, scrollWidth past
  // clientWidth) is silently losing words — KPI figures, chips, table headers. The
  // 4px slack ignores subpixel noise; sr-only nodes are intentional.
  var textClips = [];
  Array.from(document.querySelectorAll('body *')).forEach(function (el) {
    if (textClips.length >= 20) return;
    if (el.scrollWidth <= el.clientWidth + 4 || el.clientWidth <= 1) return;
    if (/\bsr-only\b/.test(el.className || '')) return;
    var hasText = Array.from(el.childNodes).some(function (n) { return n.nodeType === 3 && n.textContent.trim(); });
    if (!hasText) return;
    var cs = getComputedStyle(el);
    if (cs.overflowX === 'hidden' || cs.overflowX === 'clip' || cs.textOverflow === 'ellipsis') {
      textClips.push(el.tagName.toLowerCase() + ': "' + el.textContent.trim().slice(0, 30) + '" (' + el.scrollWidth + '>' + el.clientWidth + ')');
    }
  });
  var labelIssues = [];
  Array.from(document.querySelectorAll('[id^="cbChart"], [_echarts_instance_]')).forEach(function (box) {
    if (labelIssues.length >= 40) return;
    var svg = box.querySelector('svg'); if (!svg) return;
    var bb = box.getBoundingClientRect(); if (!bb.width) return;
    var name = box.getAttribute('aria-label') || box.id || 'chart';
    var texts = Array.from(svg.querySelectorAll('text')).map(function (t) {
      return { r: t.getBoundingClientRect(), s: (t.textContent || '').trim() };
    }).filter(function (t) { return t.s && t.r.width > 0; });
    texts.forEach(function (t) {
      if (t.r.right > bb.right + 2 || t.r.left < bb.left - 2)
        labelIssues.push(name + ': clipped "' + t.s.slice(0, 24) + '"');
    });
    for (var i = 0; i < texts.length; i++) {
      if (labelIssues.length >= 40) break;
      for (var j = i + 1; j < texts.length; j++) {
        var a = texts[i].r, b = texts[j].r;
        var ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        var oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 2 && oy > 2) {
          var small = Math.min(a.width * a.height, b.width * b.height);
          if (small > 0 && (ox * oy) / small > 0.35)
            labelIssues.push(name + ': overlap "' + texts[i].s.slice(0, 16) + '" / "' + texts[j].s.slice(0, 16) + '"');
        }
      }
    }
  });
  var probe = document.createElement('div');
  probe.className = 'w-12';
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);
  var w12 = probe.getBoundingClientRect().width;
  probe.remove();
  // Play CDN generates classes it has SEEN: if nothing in the page uses w-12, the
  // synchronous probe measures 0 (the MutationObserver can't emit CSS before we read).
  // Fall back to the runtime-injected theme toggle (w-40 h-40, always present): ~40px
  // means the px scale applied; ~160px (10rem) means the load-order contract broke.
  var scaleToggle = document.getElementById('themeToggle');
  var tw = scaleToggle ? scaleToggle.getBoundingClientRect().width : 0;
  var customScaleApplied = (w12 > 0 && w12 < 24) || (w12 === 0 && tw > 0 && tw < 60);
  var oversizedIcons = Array.from(document.querySelectorAll('svg[data-lucide], [data-lucide] > svg, .lucide'))
    .filter(el => el.getBoundingClientRect().height > 32).length;
  // Contained-clip: an element whose own overflow-x is hidden/clip but whose content is far
  // wider than its box (scrollWidth >> clientWidth) is silently clipping content — a "narrow
  // pass looks clean" trap that horizontalOverflow misses because the page itself doesn't
  // overflow. Flag elements clipping >48px of content; report a few worst offenders.
  var clipped = Array.from(document.querySelectorAll('body *')).filter(function (el) {
    if (el.scrollWidth <= el.clientWidth + 48) return false;
    // skip visually-hidden a11y nodes (sr-only): 1px boxes whose scrollWidth is the full
    // off-screen text — intentional, not a clip. Real clips have a substantive box width.
    if (el.clientWidth <= 1 || el.clientHeight <= 1) return false;
    if (/\bsr-only\b/.test(el.className || '')) return false;
    var ox = getComputedStyle(el).overflowX;
    return ox === 'hidden' || ox === 'clip';
  });
  return JSON.stringify({
    innerWidth: window.innerWidth,
    pageHeight: document.body.scrollHeight,
    customScaleApplied: customScaleApplied, // false => cookiebite.js loaded before the Tailwind CDN
    oversizedIcons: oversizedIcons,          // >0 corroborates a broken custom scale
    w12px: Math.round(w12),
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2, // PRIMARY layout-break signal
    overflowers: real.slice(0, 12)
      .map(el => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')),
    tableScrollsInternally: wide.length > real.length, // wide Grid.js table inside its own scroller — OK, not a break
    collapsedCharts: Array.from(document.querySelectorAll('canvas, svg, [_echarts_instance_], .echart, [id*="chart"]'))
      .filter(el => el.offsetHeight < 24).length,
    containedClipCount: clipped.length,           // elements clipping >48px of their own content
    containedClips: clipped.slice(0, 8).map(el =>
      el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')
      + ' (' + el.scrollWidth + '>' + el.clientWidth + ')'),
    // the runtime's chart-level warning contract (truncated baselines, crowded bands,
    // too-many-rows, >8 peer series) — surfaced here so the reviewer needn't scrape console
    chartWarnings: ((window.COOKIEBITE && window.COOKIEBITE.__chartWarnings) || [])
      .map(w => w.chart + ': [' + w.code + '] ' + w.msg),
    labelIssueCount: labelIssues.length,
    labelIssues: labelIssues.slice(0, 12),
    textClipCount: textClips.length,
    textClips: textClips.slice(0, 8),
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

# palette_check(label, theme): judge every palette the runtime generated (CB.__palettes)
# with scripts/validate-palette.mjs against the LIVE surface color, and fold the results
# into checks-<label>.json as a "palettes" key. The color part is computable, so compute
# it — never eyeball colorblind safety. Policy by palette kind:
#   categoricalColors 'analogous'/'mono' — one-family by DESIGN, so a CVD/contrast FAIL
#     demotes to WARN + a note (the relief channels — legend, direct labels, CB.chart's
#     data table — are the mitigation; 4+ peers should consider mode:'categorical'/'emphasis').
#   categoricalColors 'categorical' — raw verdicts (a wide-arc identity palette must pass).
#   ramp — validated as an ordered ramp (--ordinal); the categorical checks would
#     FAIL a good ramp by design.
#   'emphasis' / diverging — skipped (similar grays / V-shaped lightness are the point);
#     structure is enforced at generation.
palette_check(){
  local label="$1"
  command -v node >/dev/null 2>&1 || { echo "[palette] node not found — palette validation skipped" >&2; return 0; }
  ab eval "JSON.stringify((window.COOKIEBITE&&window.COOKIEBITE.__palettes)||[])" > "$OUT/_pal-$label.json" 2>/dev/null || return 0
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)" \
  python3 - "$OUT" "$label" <<'PY' || true
import json, os, subprocess, sys
out, label = sys.argv[1], sys.argv[2]
validator = os.path.join(os.environ["SCRIPT_DIR"], "validate-palette.mjs")
def unwrap(path, default):
    try:
        raw = json.load(open(path))
        while isinstance(raw, str):
            try: raw = json.loads(raw)
            except Exception: return raw
        return raw
    except Exception:
        return default
palettes = unwrap(os.path.join(out, f"_pal-{label}.json"), [])
results = []
for p in palettes:
    theme = p.get("theme", "light")
    surface = (p.get("surface") or "").strip()
    entry = {k: p.get(k) for k in ("fn", "n", "mode", "theme", "colors")}
    fn, mode = p.get("fn"), p.get("mode")
    if mode == "emphasis" or fn == "diverging":
        entry["skipped"] = "by policy: " + ("emphasis palettes carry identity via the accent + labels" if mode == "emphasis" else "diverging structure (poles + neutral midpoint) is enforced at generation")
        results.append(entry); continue
    cmd = ["node", validator, ",".join(p.get("colors") or []), "--mode", theme, "--json"]
    if surface: cmd += ["--surface", surface]
    if fn == "ramp": cmd += ["--ordinal"]
    try:
        run = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        entry["result"] = json.loads(run.stdout)
    except Exception as exc:
        entry["error"] = str(exc); results.append(entry); continue
    if fn == "categoricalColors" and mode in ("analogous", "mono"):
        for c in entry["result"].get("checks", []):
            if c["id"] in ("cvd-separation", "surface-contrast", "lightness-band") and c["verdict"] == "FAIL":
                c["verdict"] = "WARN"
                note = ("lightness IS the separator in a one-family palette" if c["id"] == "lightness-band"
                        else "one-family palette by design; relief channels (legend, direct labels, data table) required")
                c["detail"] += f" — demoted: {note}. 4+ peers: consider mode:'categorical' or 'emphasis'."
        vs = [c["verdict"] for c in entry["result"].get("checks", [])]
        entry["result"]["verdict"] = "FAIL" if "FAIL" in vs else "WARN" if "WARN" in vs else "PASS"
    results.append(entry)
checks_path = os.path.join(out, f"checks-{label}.json")
try:
    checks = unwrap(checks_path, {})
    checks["palettes"] = results
    json.dump(json.dumps(checks, separators=(",", ":")), open(checks_path, "w"))
except Exception:
    pass
for r in results:
    tag = f'{r.get("fn")}({r.get("n")}, {r.get("mode")}, {r.get("theme")})'
    if "skipped" in r: print(f"[palette:{label}] {tag} — skipped ({r['skipped']})")
    elif "error" in r: print(f"[palette:{label}] {tag} — validator error: {r['error']}", file=sys.stderr)
    else:
        res = r["result"]
        worst = "; ".join(f'{c["id"]} {c["verdict"]}' for c in res["checks"] if c["verdict"] != "PASS") or "all checks PASS"
        print(f'[palette:{label}] {tag} -> {res["verdict"]} ({worst})')
PY
  rm -f "$OUT/_pal-$label.json"
}

# Desktop pass (primary) + narrow pass (catch mobile/stacking breakage).
# Narrow is 390px (a real phone), NOT 768: Tailwind's md: breakpoint is exactly 768px,
# so a 768 pass leaves md:grid-cols-* in their 2-col state and never tests the stacked
# mobile layout. 390 is below sm/md/lg, so it exercises the fully-collapsed layout.
capture desktop 1280
capture narrow 390

# Narrow column-collapse heuristic (F18): a narrow pass can report "all clear" while the
# layout has actually collapsed every column into one tall stack. Compare narrow pageHeight
# to desktop pageHeight — a >3x blow-up is the tell. Annotate the narrow checks file with a
# narrowColumnCollapse field (matching the double-encoded shape) and note it on stderr.
python3 - "$OUT/checks-desktop.json" "$OUT/checks-narrow.json" >&2 2>/dev/null <<'PY' || true
import json, sys
def load(p):
    raw = json.load(open(p))
    return json.loads(raw) if isinstance(raw, str) else raw
try:
    d = load(sys.argv[1]); n = load(sys.argv[2])
except Exception:
    sys.exit(0)
dh = d.get("pageHeight") or 0
nh = n.get("pageHeight") or 0
collapse = bool(dh and nh and nh > dh * 3)
n["narrowColumnCollapse"] = collapse
n["desktopPageHeight"] = dh
json.dump(json.dumps(n, separators=(",", ":")), open(sys.argv[2], "w"))
if collapse:
    print(f"⚠ [narrow] pageHeight {nh}px is >3x desktop {dh}px — columns likely "
          "collapsed into one tall stack (check narrow tiles).")
PY

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

# Palette validation — once, after every pass: each recorded palette carries the theme +
# surface it was generated against, so one sweep judges them all; results fold into
# checks-desktop.json (the primary checks file).
palette_check desktop

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
echo "'containedClipCount'>0 flags elements clipping their own content (overflow-x:hidden/clip"
echo "with scrollWidth >> clientWidth) — a 'narrow looks clean' trap. 'narrowColumnCollapse:true'"
echo "(narrow pageHeight >3x desktop) means columns collapsed into one tall stack — check tiles."
echo "'customScaleApplied:false' (or 'oversizedIcons'>0) means cookiebite.js loaded BEFORE the"
echo "Tailwind CDN, so the 12px icon/spacing scale was ignored (giant icons, collapsed layout) —"
echo "fix the <head> order: load cdn.tailwindcss.com before cookiebite.js."
echo "'palettes' holds the validate-palette.mjs verdicts for every palette the report generated:"
echo "fix any FAIL; a CVD/contrast WARN needs its relief channel (direct labels / legend / table)."
echo "'chartWarnings' lists the runtime's chart-honesty warnings (truncated zero-baseline,"
echo "crowded bands, too many rows/series) — each one is a real defect; fix, don't dismiss."
echo "'labelIssues' is the AUTOMATED label pass (SVG-rendered charts): clipped labels poking"
echo "past their chart box and overlapping label pairs; 'textClips' is its HTML sibling —"
echo "elements cutting off their own text (KPI figures, chips, headers). Fix every entry —"
echo "these used to be catchable only by eyeballing tiles."
echo "desktop+narrow render LIGHT, dark is its own pass."
echo "CLEANUP: these are throwaway artifacts — 'rm -rf $OUT' when done (it's regenerated each run)."
