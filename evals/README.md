# evals — cookiebite's official evaluation suite

Two tiers. The deterministic tier is the one you run before every release; the LLM
tier measures whether the *skill* (not just the runtime) produces good reports.

## Deterministic tier — `bash evals/run.sh`

No LLM, ~2–3 minutes, exit 1 on any failure. What it asserts:

1. **Static** — `node --check` on the runtime, `bash -n` on every script, and the
   palette validator's `--self-test` (CIEDE2000 reference pairs, WCAG contrast,
   OKLab constants).
2. **Scaffolds** — all five TYPE skeletons build; postmortem carries
   claims + storyline, review carries the claims verdict, the en locale drops
   `bigUnits` (the "$3.5만" regression).
3. **Fixture** — `build-fixture.py` builds a kitchen-sink report that exercises the
   assertion surface, `scripts/verify-report.sh` renders it, and the checks JSON is
   asserted: zero console errors, no overflow, no collapsed charts, palettes judged
   with no hard FAIL — and the fixture's **deliberate truncated-baseline bait must
   produce exactly its warning** (the honesty checks have to stay loud; a release
   that silences them fails here).
4. **Interactions** (needs `agent-browser`; skipped, not failed, without it) —
   every `connectFilter` chip wires and re-feeds its chart (the v0.12.1 regression:
   only chip 1 used to work), storyline steps advance the caption and disable at
   the ends, the altitude toggle collapses `data-altitude-detail` sections, the
   chart's data-table toggle opens, the matrix stretches to its container, dark
   mode flips, and the page ends with zero uncaught errors.

Pass an out-dir to keep the artifacts: `bash evals/run.sh /tmp/cb-evals`.

Why a bait chart: an assertion that everything is clean can rot silently — if a
release breaks the warning machinery itself, "no warnings" still passes. The bait
pins the machinery: it must fire on the bait and *only* on the bait.

## LLM tier — `bash evals/run-llm.sh [id|all]`

Measures whether the **skill** (the model's judgment reading it), not just the
runtime, produces good reports. For each case in `evals.json`, a fresh headless
agent (`claude -p`) is pointed at SKILL.md and the prompt and builds the report
end-to-end (including the skill's own verify loop); a second agent grades the
artifacts against the assertions adversarially (no positive evidence = FAIL),
emitting `grading.json` per eval and a `results.md` summary. Needs the `claude`
CLI and `agent-browser`; costs real tokens and minutes per case — run it when the
skill's *judgment* changes (workflow, chart guidance, narrative rules), not for
runtime-only edits. `evals.json` stays skill-creator-compatible, so the
skill-creator benchmark loop (with-skill vs baseline, viewer) also works on it.

The three cases probe the failure modes that matter, not happy paths only:

- **weekly-metrics-dashboard** — data-rich composition: claims spine, currency axis
  semantics, and the store-quality trap (raw values on a truncated axis vs
  deviation-from-target).
- **incident-postmortem** — the narrative layer: scaffold spine, duration axis,
  a storyline that actually re-shapes the chart, a drawn (not written) root cause.
- **anti-padding-restraint** — the discipline case: two facts must stay two facts;
  padding sections or manufactured interactivity fails it.
