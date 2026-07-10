#!/usr/bin/env bash
# evals/run-llm.sh [eval-id|all] [out-dir] — the LLM tier: does the SKILL produce
# good reports, not just does the runtime work?
#
# For each case in evals/evals.json:
#   1. BUILD  — a FRESH headless agent (`claude -p`) is pointed at SKILL.md and the
#               eval prompt, and builds the report end-to-end in its own work dir
#               (including the skill's own verify loop — agent-browser required).
#   2. GRADE  — a second agent reads the artifacts (the .html, the .verify checks
#               JSONs) and judges each assertion, emitting grading.json.
#   3. SUMMARY — results.md + a console table of per-assertion verdicts.
#
# This costs real tokens and minutes per eval — it is deliberately NOT part of the
# evals/run.sh release gate. Run it when the SKILL's judgment changes (workflow,
# chart guidance, narrative rules), not for runtime-only edits.
#
# Usage: bash evals/run-llm.sh            # all evals, temp out-dir
#        bash evals/run-llm.sh 3          # one eval
#        bash evals/run-llm.sh all /tmp/o # keep artifacts
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SEL="${1:-all}"
OUT="${2:-$(mktemp -d /tmp/cookiebite-llm.XXXXXX)}"
mkdir -p "$OUT"

command -v claude >/dev/null 2>&1 || { echo "claude CLI not found — the LLM tier runs agents via 'claude -p'." >&2; exit 127; }
command -v python3 >/dev/null 2>&1 || { echo "python3 required" >&2; exit 127; }

# The builder gets write tools + Bash (the skill's own workflow runs scaffold/inline/
# verify scripts); the grader is read-only + Bash for JSON unwrapping.
BUILDER_TOOLS="Bash,Read,Write,Edit,Glob,Grep"
GRADER_TOOLS="Bash,Read,Glob,Grep"

ids="$(python3 - "$ROOT/evals/evals.json" "$SEL" <<'PY'
import json, sys
data = json.load(open(sys.argv[1]))
sel = sys.argv[2]
for e in data['evals']:
    if sel in ('all', str(e['id'])):
        print(e['id'])
PY
)"
[ -n "$ids" ] || { echo "no evals matched '$SEL'" >&2; exit 2; }

for id in $ids; do
  WORK="$OUT/eval-$id"
  mkdir -p "$WORK"

  python3 - "$ROOT/evals/evals.json" "$id" "$ROOT" "$WORK" <<'PY'
import json, sys
data = json.load(open(sys.argv[1]))
e = [x for x in data['evals'] if str(x['id']) == sys.argv[2]][0]
root, work = sys.argv[3], sys.argv[4]
open(work + '/prompt.txt', 'w', encoding='utf-8').write(
    "You are exercising the 'cookiebite' skill end-to-end.\n"
    "Read %s/SKILL.md first and follow it exactly — including its workflow, its\n"
    "chart-form guidance, its narrative rules, and its MANDATORY inline + visual\n"
    "self-check steps (run the skill's scripts from %s).\n"
    "Work directory: save the report, its .final.html, and every artifact under %s\n"
    "(keep the .verify directory — the grader reads it).\n\n"
    "The user's request:\n%s\n\n"
    "When the inlined report exists and the verify loop is clean, print DONE and stop.\n"
    % (root, root, work, e['prompt']))
open(work + '/assertions.json', 'w', encoding='utf-8').write(json.dumps(e['assertions'], ensure_ascii=False, indent=2))
open(work + '/meta.json', 'w', encoding='utf-8').write(json.dumps({'id': e['id'], 'name': e['name']}, ensure_ascii=False))
PY

  echo "== eval $id: BUILD (fresh agent; this takes minutes) =="
  ( cd "$WORK" && claude -p "$(cat "$WORK/prompt.txt")" \
      --allowedTools "$BUILDER_TOOLS" --max-turns 150 ) \
      >"$WORK/build.log" 2>&1
  echo "   build agent exited $? (log: $WORK/build.log)"

  echo "== eval $id: GRADE =="
  python3 - "$WORK" <<'PY'
import json, sys
work = sys.argv[1]
assertions = json.load(open(work + '/assertions.json'))
lines = [
    "You are a strict grader for a report-building skill. The artifacts to judge live",
    "under: %s" % work,
    "Inspect them yourself (Read/Glob/Bash): the .html / .final.html report source,",
    "and any .verify/checks-*.json (they may be double-JSON-encoded strings — unwrap).",
    "Grade each assertion below as passed true/false with one line of evidence citing",
    "what you actually found (file + fact). Be adversarial: an assertion without",
    "positive evidence FAILS.",
    "",
    "Assertions:",
]
for i, a in enumerate(assertions):
    lines.append("%d. %s" % (i + 1, a))
lines += [
    "",
    "Output ONLY a JSON object, no prose, no code fences:",
    '{"expectations":[{"text":"...","passed":true,"evidence":"..."}]}',
]
open(work + '/grader-prompt.txt', 'w', encoding='utf-8').write('\n'.join(lines))
PY
  claude -p "$(cat "$WORK/grader-prompt.txt")" \
      --allowedTools "$GRADER_TOOLS" --max-turns 60 \
      >"$WORK/grader-raw.txt" 2>"$WORK/grade.log"
  python3 - "$WORK" <<'PY'
import json, re, sys
work = sys.argv[1]
raw = open(work + '/grader-raw.txt', encoding='utf-8').read()
m = re.search(r'\{.*\}', raw, re.DOTALL)
try:
    g = json.loads(m.group(0)) if m else {'expectations': []}
except Exception:
    g = {'expectations': [], 'parse_error': raw[-500:]}
json.dump(g, open(work + '/grading.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
PY
done

echo
echo "== SUMMARY =="
python3 - "$OUT" <<'PY'
import glob, json, os, sys
out = sys.argv[1]
total = passed = 0
report = ['# cookiebite LLM-tier eval results', '']
for d in sorted(glob.glob(os.path.join(out, 'eval-*'))):
    try:
        meta = json.load(open(d + '/meta.json'))
        g = json.load(open(d + '/grading.json'))
    except Exception as e:
        print('%-28s  UNGRADED (%s)' % (os.path.basename(d), e)); continue
    exps = g.get('expectations') or []
    p = sum(1 for x in exps if x.get('passed'))
    total += len(exps); passed += p
    print('%-28s  %d/%d' % (meta.get('name', os.path.basename(d)), p, len(exps)))
    report.append('## %s — %d/%d' % (meta.get('name'), p, len(exps)))
    for x in exps:
        mark = 'PASS' if x.get('passed') else 'FAIL'
        print('    %s  %s' % (mark, x.get('text', '')[:96]))
        report.append('- **%s** %s\n  - %s' % (mark, x.get('text', ''), x.get('evidence', '')))
    report.append('')
print()
print('TOTAL %d/%d assertion(s) passed  (artifacts: %s)' % (passed, total, out))
open(os.path.join(out, 'results.md'), 'w', encoding='utf-8').write('\n'.join(report))
sys.exit(0 if total and passed == total else 1)
PY
