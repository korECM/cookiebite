#!/usr/bin/env bash
# Render the core-runtime fixture in a real browser (agent-browser) and assert the
# freeform primitives enhance authored DOM without manufacturing chrome: chart ARIA
# + data alternative, keyboard-operable sort with aria-sort, glossary open/close,
# reduced-motion-aware motion, export output, and recorded capability calls.
#
# Usage:  bash evals/test-core-runtime.sh
# Requires: agent-browser (network access for the ECharts CDN in the fixture).
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
FIXTURE="file://$HERE/fixtures/core-runtime.html"
SESSION="cookiebite-core-$$"

if command -v agent-browser >/dev/null 2>&1; then AB="agent-browser"
elif command -v npx >/dev/null 2>&1 && npx -y agent-browser --version >/dev/null 2>&1; then AB="npx -y agent-browser"
elif command -v bunx >/dev/null 2>&1 && bunx agent-browser --version >/dev/null 2>&1; then AB="bunx agent-browser"
else
  echo "agent-browser not found. Install it with: npm i -g agent-browser && agent-browser install" >&2
  exit 3
fi

ab() { $AB --session-name "$SESSION" "$@"; }
cleanup() { ab close >/dev/null 2>&1 || true; }
trap cleanup EXIT

fail=0
check() { # name expected actual
  if [ "$2" = "$3" ]; then printf '  ok   %s\n' "$1"; else printf '  FAIL %s (expected %s, got %s)\n' "$1" "$2" "$3"; fail=1; fi
}
val() { ab eval "$1" 2>/dev/null | tail -1 | tr -d '"'; }

ab open "$FIXTURE" >/dev/null 2>&1
ab wait 2000 >/dev/null 2>&1

echo "core + capabilities load and enhance authored DOM:"
check "author script ran"        "true"  "$(val 'window.__ready===true')"
check "chart host role=img"      "img"   "$(val "document.getElementById('traffic-chart').getAttribute('role')")"
check "chart has aria-label"     "true"  "$(val "!!document.getElementById('traffic-chart').getAttribute('aria-label')")"
check "chart data alternative"   "true"  "$(val "!!document.querySelector('#traffic-chart table.cb-visually-hidden')")"
check "chart rendered"           "true"  "$(val "!!document.querySelector('#traffic-chart canvas, #traffic-chart svg')")"
check "sort buttons injected"    "2"     "$(val "document.querySelectorAll('#traffic-table th button.cb-sort').length")"
check "glossary starts hidden"   "true"  "$(val "document.querySelector('.cb-glossary-def').hidden")"
check "term aria-describedby"    "true"  "$(val "!!document.getElementById('rate-limit-term').getAttribute('aria-describedby')")"
check "no manufactured chrome"   "6"     "$(val "document.querySelectorAll('main > *').length")"
check "every call recorded"      "true"  "$(val "['chart','table','glossary','motion','export'].every(c=>CB.calls.some(x=>x.capability===c&&x.type==='call'))")"

echo "keyboard-operable sort:"
ab click "#traffic-table th:nth-child(2) button.cb-sort" >/dev/null 2>&1
ab wait 200 >/dev/null 2>&1
check "aria-sort ascending"      "ascending" "$(val "document.querySelector('#traffic-table th:nth-child(2)').getAttribute('aria-sort')")"
check "rows sorted numerically"  "09:00"     "$(val "document.querySelector('#traffic-table tbody tr:first-child td:first-child').textContent")"
check "sort recorded"            "true"      "$(val "CB.calls.some(c=>c.capability==='table'&&c.action==='sort')")"

echo "glossary opens from focus and closes on Escape:"
ab focus "#rate-limit-term" >/dev/null 2>&1
ab wait 150 >/dev/null 2>&1
check "opens on focus"           "false" "$(val "document.querySelector('.cb-glossary-def').hidden")"
ab press "Escape" >/dev/null 2>&1
ab wait 150 >/dev/null 2>&1
check "closes on Escape"         "true"  "$(val "document.querySelector('.cb-glossary-def').hidden")"

echo "motion plays only when asked, and export returns scoped HTML:"
check "motion play returns anim" "true"  "$(val "(function(){var a=window.__cb.motion.play();return !!a&&CB.calls.some(c=>c.capability==='motion'&&c.action==='play');})()")"
check "export html scoped"       "true"  "$(val "(function(){var h=window.__cb.export.run();return typeof h==='string'&&h.includes('report-region')&&h.includes('<style>');})()")"

if [ "$fail" -eq 0 ]; then echo "PASS: core runtime fixture verified"; else echo "FAIL: core runtime fixture has regressions"; fi
exit "$fail"
