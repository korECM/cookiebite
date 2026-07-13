#!/usr/bin/env bash
# test-verifier.sh — prove the evidence-led verifier passes a correct core report
# and blocks a deliberately broken one. Builds the clean fixture fresh, then runs
# scripts/verify-report-dom.js measurements through build-verification-report.mjs.
#
# Usage: bash evals/test-verifier.sh
# Requires: agent-browser (network access for the ECharts CDN in the clean fixture).
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"

node "$ROOT/evals/build-core-fixture.mjs"

echo "clean release fixture must PASS:"
node "$ROOT/evals/verifier-runner.mjs" "$ROOT/evals/fixtures/verifier/clean.html" --expect pass --manual-ok

echo "deliberate failure fixture must be BLOCKED:"
node "$ROOT/evals/verifier-runner.mjs" "$ROOT/evals/fixtures/verifier/fail.html" --expect fail

echo "PASS: verifier distinguishes a clean report from deliberate hard failures"
