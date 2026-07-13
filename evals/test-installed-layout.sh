#!/usr/bin/env bash
# test-installed-layout.sh — the release gate. Archive the clean tracked source into
# a temporary install root (no symlinks), move to an UNRELATED work directory, and
# prove the CLIs build/assemble/verify from that copied layout using only
# script-relative paths. First prove an omitted installed asset fails.
#
# Usage: bash evals/test-installed-layout.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGE="$(mktemp -d)"
INSTALL="$STAGE/install"
WORK="$STAGE/work"
mkdir -p "$INSTALL" "$WORK"
trap 'rm -rf "$STAGE"' EXIT

fail() { echo "FAIL: $1" >&2; exit 1; }

# 1. Install = a copy of the clean tracked tree (what a --copy skill install yields).
git -C "$ROOT" archive HEAD | tar -x -C "$INSTALL"

# 2. No symlinks — a copied install must be self-contained.
[ -z "$(find "$INSTALL" -type l)" ] || fail "install contains symlinks"

# 3. Required assets/scripts are present.
for f in \
  assets/theme-compiler.js assets/presets.generated.js \
  assets/core/cookiebite-core.js assets/core/cookiebite-core.css \
  assets/capabilities/manifest.json assets/capabilities/chart.js assets/capabilities/table.js \
  assets/template.html assets/template-compat.html \
  scripts/scaffold.sh scripts/inline.sh scripts/assemble-report.mjs \
  scripts/build-verification-report.mjs scripts/verify-report-dom.js ; do
  [ -f "$INSTALL/$f" ] || fail "missing installed asset: $f"
done

# 4. From an UNRELATED cwd, the default scaffold + assemble must work script-relative.
cd "$WORK"
bash "$INSTALL/scripts/scaffold.sh" reading.html >/dev/null 2>&1 || fail "reading scaffold failed"
[ -f reading.html ] || fail "reading.html not created"
node "$INSTALL/scripts/assemble-report.mjs" reading.html -o reading.out.html >/dev/null 2>&1 || fail "reading assemble failed"
grep -q 'echarts@' reading.out.html && fail "reading report must not ship ECharts"
grep -q 'cookiebite-module-' reading.out.html && fail "reading report must not ship modules"
echo "ok   reading builds dependency-free from a foreign cwd"

# 5. A chart+table report ships ONLY its declared dependencies (minimal).
node "$INSTALL/evals/build-core-fixture.mjs" >/dev/null 2>&1 || fail "chart+table fixture build failed"
CLEAN="$INSTALL/evals/fixtures/verifier/clean.html"
grep -q 'echarts@' "$CLEAN" || fail "chart report must ship ECharts"
grep -q 'id="cookiebite-module-chart"' "$CLEAN" || fail "chart module missing"
grep -q 'id="cookiebite-module-table"' "$CLEAN" || fail "table module missing"
grep -q 'id="cookiebite-module-glossary"' "$CLEAN" && fail "undeclared glossary module leaked into a chart+table report"
echo "ok   chart+table ships only its declared dependencies"

# 6. Prove an omitted installed asset is caught (not silently skipped).
rm "$INSTALL/assets/core/cookiebite-core.js"
if node "$INSTALL/scripts/assemble-report.mjs" reading.html -o broken.html >/dev/null 2>&1; then
  fail "assemble should fail when core JS is missing"
fi
echo "ok   a missing installed asset fails the build"

echo "PASS: installed layout builds, assembles, and fails loudly on omission"
