#!/usr/bin/env bash
# inline.sh — make a cookiebite report self-contained for its OWN runtime.
#
# Replaces the cookiebite.css <link> and cookiebite.js <script src> (the ./assets/
# placeholder lines in a report) with inline <style>…</style> / <script>…</script>
# blocks read from the LOCAL repo copy of assets/cookiebite.css and
# assets/cookiebite.js — so the output is self-contained for its own runtime and
# survives the runtime repo moving or changing. The before-Tailwind ordering is
# preserved (the inlined config still precedes the Tailwind tag). Third-party libs
# (Tailwind/echarts/countup/alpine/lucide/Grid.js/Tippy) stay on CDN — they can't be
# trivially inlined.
#
# Usage:  bash scripts/inline.sh <report.html> [-o out.html]
#         (no -o => writes <report>.inlined.html next to the input)
#
# KNOWN LIMITATION (printed below): cdn.tailwindcss.com does NOT work offline.
# "Self-contained" here means works-when-online with cookiebite's own runtime
# inlined. True full-offline requires vendoring a prebuilt Tailwind CSS — out of scope.
set -euo pipefail

usage() { echo "usage: bash scripts/inline.sh <report.html> [-o out.html]" >&2; exit 1; }

IN=""; OUT=""
while [ $# -gt 0 ]; do
  case "$1" in
    -o|--out) OUT="${2:?-o needs a path}"; shift 2 ;;
    -h|--help) usage ;;
    *) [ -z "$IN" ] && IN="$1" || usage; shift ;;
  esac
done
[ -n "$IN" ] || usage
[ -f "$IN" ] || { echo "file not found: $IN" >&2; exit 1; }

# repo root = parent of this script's dir; single source of truth for the runtime files
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CSS_FILE="$REPO_ROOT/assets/cookiebite.css"
JS_FILE="$REPO_ROOT/assets/cookiebite.js"
[ -f "$CSS_FILE" ] || { echo "missing $CSS_FILE" >&2; exit 1; }
[ -f "$JS_FILE" ]  || { echo "missing $JS_FILE"  >&2; exit 1; }

[ -n "$OUT" ] || OUT="${IN%.html}.inlined.html"

# Idempotency: if the input is already inlined (carries our marker), re-inlining is a
# no-op SUCCESS — not an error. Copy through to OUT (when distinct) so callers that pass
# an already-inlined file still get the expected output path, and exit 0.
if grep -qi 'id="cookiebite-js"' "$IN"; then
  echo "already inlined (id=\"cookiebite-js\" present) — no-op." >&2
  if [ "$OUT" != "$IN" ]; then cp "$IN" "$OUT"; echo "  copied as-is -> $OUT" >&2; fi
  exit 0
fi

IN="$IN" OUT="$OUT" CSS_FILE="$CSS_FILE" JS_FILE="$JS_FILE" python3 - <<'PY'
import os, re, sys

inp  = os.environ['IN']
outp = os.environ['OUT']
css  = open(os.environ['CSS_FILE'], encoding='utf-8').read()
js   = open(os.environ['JS_FILE'],  encoding='utf-8').read()

html = open(inp, encoding='utf-8').read()

# Match the cookiebite.css <link> by CDN-pinned URL OR a bare local assets/ href.
# Match the cookiebite.js <script src> the same way. </script> is closed explicitly
# so the inline replacement keeps the exact <head> position (before the Tailwind tag).
css_pat = re.compile(
    r'<link\b[^>]*href=["\'][^"\']*(?:cookiebite@[^/]+/assets/cookiebite\.css|(?:\./|/)?assets/cookiebite\.css)[^"\']*["\'][^>]*>',
    re.IGNORECASE)
js_pat = re.compile(
    r'<script\b[^>]*src=["\'][^"\']*(?:cookiebite@[^/]+/assets/cookiebite\.js|(?:\./|/)?assets/cookiebite\.js)[^"\']*["\'][^>]*>\s*</script>',
    re.IGNORECASE)

# guard against a stray "</script>" in the JS body breaking the inline <script>
js_safe = js.replace('</script>', '<\\/script>')

n_css = n_js = 0
def repl_css(_):
    global n_css; n_css += 1
    return '<style id="cookiebite-css">\n' + css + '\n</style>'
def repl_js(_):
    global n_js; n_js += 1
    return '<script id="cookiebite-js">\n' + js_safe + '\n</script>'

# Inline ALL occurrences (count=0), not just the first — a report may carry the placeholder
# more than once (e.g. duplicated head/template fragments) and a single-shot sub would leave
# stragglers loading the raw ./assets/cookiebite.js from a path that won't exist after hand-over.
html = css_pat.sub(repl_css, html, count=0)
html = js_pat.sub(repl_js, html, count=0)

if n_js == 0:
    sys.stderr.write(
        "error: no cookiebite.js <script src> found to inline.\n"
        "  expected the placeholder href (./assets/cookiebite.js).\n")
    sys.exit(2)
if n_css == 0:
    sys.stderr.write("warning: no cookiebite.css <link> found to inline (continuing).\n")

# Any raw ./assets/cookiebite.js still left (e.g. a non-<script>-src reference the pattern
# can't safely fold) would break offline — warn so the author can resolve it by hand.
leftover = len(re.findall(r'(?:\./|/)?assets/cookiebite\.js', html, re.IGNORECASE))
if leftover:
    sys.stderr.write(
        "warning: %d raw './assets/cookiebite.js' reference(s) remain after inlining.\n" % leftover)

open(outp, 'w', encoding='utf-8').write(html)
sys.stderr.write("inlined cookiebite runtime -> %s\n" % outp)
sys.stderr.write("  css: %s   js: %s\n" % ("inlined" if n_css else "MISSING", "inlined"))
PY

cat >&2 <<'NOTE'

NOTE: "self-contained" = cookiebite's OWN runtime is inlined, so this file survives
      the runtime repo moving/changing and renders the same offline-capable contract.
      It is NOT fully offline: Tailwind Play CDN (cdn.tailwindcss.com) and the other
      pinned third-party libs still load from the network. A double-clicked file on a
      plane renders UNSTYLED. Genuine full-offline needs a vendored prebuilt Tailwind
      CSS (out of scope). ESM-module escape-hatch libs (e.g. Mermaid imported as a
      module) are never inlined either.
NOTE
