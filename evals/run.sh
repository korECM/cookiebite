#!/usr/bin/env bash
# evals/run.sh [out-dir] — cookiebite's deterministic eval suite.
#
# Three tiers, cheapest first, all asserted (any failure -> exit 1):
#   1. STATIC     syntax + the palette validator's self-test
#   2. SCAFFOLDS  every TYPE skeleton builds and carries its load-bearing calls
#   3. FIXTURE    the kitchen-sink report (evals/build-fixture.py) rendered through
#                 scripts/verify-report.sh, its checks JSON asserted (console errors,
#                 overflow, palette verdicts, and the DELIBERATE truncated-baseline
#                 bait must warn), then INTERACTIONS driven in a real browser:
#                 every filter chip wires (the v0.12.1 regression), storyline steps,
#                 the altitude toggle hides detail sections, the data-table toggle
#                 opens, the matrix fills its container, dark mode flips.
#
# Interactions need agent-browser; without it that tier is SKIPPED (noted, not failed)
# so the static tiers still run in minimal environments.
#
# Usage: bash evals/run.sh            # temp out-dir
#        bash evals/run.sh /tmp/out   # keep artifacts for inspection
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$(mktemp -d /tmp/cookiebite-evals.XXXXXX)}"
mkdir -p "$OUT"
FAILS=0
pass(){ printf 'PASS  %s\n' "$1"; }
fail(){ printf 'FAIL  %s\n' "$1"; FAILS=$((FAILS+1)); }
check(){ local name="$1"; shift; if "$@" >/dev/null 2>&1; then pass "$name"; else fail "$name"; fi; }

echo "== tier 1: static =="
check "cookiebite.js parses (node --check)" node --check "$ROOT/assets/cookiebite.js"
for s in inline.sh verify-report.sh scaffold.sh; do
  check "scripts/$s syntax (bash -n)" bash -n "$ROOT/scripts/$s"
done
check "validate-palette.mjs --self-test" node "$ROOT/scripts/validate-palette.mjs" --self-test

echo "== tier 2: scaffolds =="
for t in dashboard review postmortem explainer comparison; do
  check "scaffold $t builds" bash "$ROOT/scripts/scaffold.sh" "$t" "$OUT/sk-$t.html"
done
if grep -q "CB.claims" "$OUT/sk-postmortem.html" 2>/dev/null && grep -q "CB.storyline" "$OUT/sk-postmortem.html" 2>/dev/null; then
  pass "postmortem skeleton carries claims + storyline"
else fail "postmortem skeleton carries claims + storyline"; fi
if grep -q "CB.claims" "$OUT/sk-review.html" 2>/dev/null; then
  pass "review skeleton carries the claims verdict"
else fail "review skeleton carries the claims verdict"; fi
if grep -q "bigUnits': false" "$OUT/sk-dashboard.html" 2>/dev/null; then
  pass "en scaffold drops bigUnits (no \$3.5만)"
else fail "en scaffold drops bigUnits (no \$3.5만)"; fi

echo "== tier 3: fixture through verify-report =="
check "fixture builds" python3 "$ROOT/evals/build-fixture.py" "$OUT/fixture.html"
if bash "$ROOT/scripts/verify-report.sh" "$OUT/fixture.html" "$OUT/verify.verify" >"$OUT/verify.log" 2>&1; then
  pass "verify-report.sh runs clean"
else fail "verify-report.sh runs clean (see $OUT/verify.log)"; fi

python3 - "$OUT/verify.verify/checks-desktop.json" <<'PY'
import json, sys
def unwrap(p):
    raw = json.load(open(p))
    while isinstance(raw, str): raw = json.loads(raw)
    return raw
try:
    c = unwrap(sys.argv[1])
except Exception as e:
    print('FAIL  checks-desktop.json readable (%s)' % e); sys.exit(1)
fails = 0
def a(name, ok, detail=''):
    global fails
    print(('PASS  ' if ok else 'FAIL  ') + name + (('  — ' + detail) if (detail and not ok) else ''))
    if not ok: fails += 1
a('no console errors', c.get('consoleErrorCount') == 0, str(c.get('consoleErrors'))[:200])
a('no horizontal overflow', c.get('horizontalOverflow') is False)
a('no collapsed charts', c.get('collapsedCharts') == 0)
a('custom Tailwind scale applied', c.get('customScaleApplied') is True)
a('no oversized icons', c.get('oversizedIcons') == 0)
warns = c.get('chartWarnings') or []
a('bait chart warned truncated-baseline',
  any('bait-truncated' in w and 'truncated-baseline' in w for w in warns), str(warns)[:200])
a('no UNEXPECTED chart warnings',
  all('bait-truncated' in w for w in warns), str(warns)[:200])
pals = c.get('palettes') or []
a('palettes were recorded + judged', len(pals) >= 1)
bad = [p for p in pals if (p.get('result') or {}).get('verdict') == 'FAIL']
a('no palette hard-FAILs', not bad, str([p.get('fn') for p in bad]))
a('no label clipping/overlap (desktop)', c.get('labelIssueCount') == 0, str(c.get('labelIssues'))[:300])
a('no HTML text clipping (desktop)', c.get('textClipCount') == 0, str(c.get('textClips'))[:300])
themes = set(p.get('theme') for p in pals)
a('palettes judged for BOTH themes (function-option re-derive)', {'light', 'dark'} <= themes, str(themes))
import os
narrow_path = os.path.join(os.path.dirname(sys.argv[1]), 'checks-narrow.json')
try:
    n = unwrap(narrow_path)
    a('no label clipping/overlap (narrow)', n.get('labelIssueCount') == 0, str(n.get('labelIssues'))[:300])
    a('no HTML text clipping (narrow)', n.get('textClipCount') == 0, str(n.get('textClips'))[:300])
except Exception as e:
    a('no label clipping/overlap (narrow)', False, str(e))
sys.exit(1 if fails else 0)
PY
[ $? -ne 0 ] && FAILS=$((FAILS+1))

echo "== tier 3b: interactions (agent-browser) =="
if ! command -v agent-browser >/dev/null 2>&1; then
  echo "SKIP  agent-browser not found — interaction assertions skipped"
else
  INLINED="$OUT/verify.verify/_inlined.html"
  [ -f "$INLINED" ] || INLINED="$OUT/fixture.html"
  S="cb-eval-$$"
  ab(){ agent-browser --session "$S" "$@"; }
  # expect NAME EXPR EXPECTED — single-expression evals only (agent-browser eval
  # rejects multi-statement snippets); strings come back quoted, so strip quotes.
  expect(){
    local name="$1" expr="$2" want="$3" got
    got="$(ab eval "$expr" 2>/dev/null | tr -d '"')"
    if [ "$got" = "$want" ]; then pass "$name"; else fail "$name  — got '$got', want '$want'"; fi
  }
  ab --allow-file-access open "file://$INLINED" >/dev/null 2>&1
  ab wait 2800 >/dev/null 2>&1

  # connectFilter: EVERY chip wires (the v0.12.1 regression test)
  ab eval "document.querySelectorAll('#fxFilter button')[2].click(); 0" >/dev/null 2>&1
  ab wait 400 >/dev/null 2>&1
  expect "chip 3 activates (aria-pressed)" \
    "document.querySelectorAll('#fxFilter button')[2].getAttribute('aria-pressed')" "true"
  expect "chip 3 re-feeds the chart" \
    "echarts.getInstanceByDom(document.querySelector('#fxFilterChart [id^=cbChart]')).getOption().series[0].data.join(',')" "9,9,9"
  ab eval "document.querySelectorAll('#fxFilter button')[1].click(); 0" >/dev/null 2>&1
  ab wait 300 >/dev/null 2>&1
  expect "chip 2 re-feeds the chart" \
    "echarts.getInstanceByDom(document.querySelector('#fxFilterChart [id^=cbChart]')).getOption().series[0].data.join(',')" "1,2,3"

  # storyline: prev disabled at step 0; next advances the caption
  expect "storyline prev disabled at step 0" \
    "document.querySelector('[data-cb-story-prev]').disabled" "true"
  ab eval "document.querySelector('[data-cb-story-next]').click(); 0" >/dev/null 2>&1
  ab wait 300 >/dev/null 2>&1
  expect "storyline next advances the caption" \
    "document.querySelector('[data-cb-story-caption]').textContent.indexOf('두 번째') >= 0" "true"

  # altitude: exec view hides [data-altitude-detail]
  ab eval "document.getElementById('cbAltitudeToggle').click(); 0" >/dev/null 2>&1
  ab wait 300 >/dev/null 2>&1
  expect "exec view hides detail sections" \
    "document.querySelector('section[data-altitude-detail]').offsetHeight" "0"
  ab eval "document.getElementById('cbAltitudeToggle').click(); 0" >/dev/null 2>&1

  # data-table toggle opens the a11y twin
  ab eval "document.querySelector('#fxTrend [data-cb-table-toggle]').click(); 0" >/dev/null 2>&1
  ab wait 300 >/dev/null 2>&1
  expect "chart's data-table toggle opens" \
    "document.querySelector('#fxTrend [x-show=table]').offsetHeight > 0" "true"

  # matrix fills its container (the v0.13.0 width fix)
  expect "matrix stretches to its container" \
    "document.querySelector('#fxMatrix table').offsetWidth / document.getElementById('fxMatrix').offsetWidth > 0.9" "true"

  # dark mode flips and back
  ab eval "applyTheme('dark'); 0" >/dev/null 2>&1
  ab wait 400 >/dev/null 2>&1
  expect "dark mode flips" "document.documentElement.dataset.theme" "dark"
  ab eval "applyTheme('light'); 0" >/dev/null 2>&1

  ERRS="$(ab errors --json 2>/dev/null | python3 -c 'import json,sys; d=json.load(sys.stdin); print(len((d.get("data") or {}).get("errors", [])))' 2>/dev/null)"
  if [ "$ERRS" = "0" ]; then pass "page error count is 0"; else fail "page error count is 0  — got '$ERRS'"; fi
  ab close >/dev/null 2>&1
fi

echo
if [ "$FAILS" -eq 0 ]; then
  echo "ALL PASS  (artifacts: $OUT)"
  exit 0
else
  echo "$FAILS FAILURE(S)  (artifacts: $OUT)"
  exit 1
fi
