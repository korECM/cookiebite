#!/usr/bin/env bash
# scaffold.sh — start a cookiebite report from a TYPE skeleton, not the payments DEMO.
#
# Copies assets/template.html to <out.html>, then swaps the demo content inside the
# COOKIEBITE:SECTIONS + COOKIEBITE:REPORT-SCRIPT slots (and the COOKIEBITE:TOC +
# COOKIEBITE:HEADER, where it helps) for a small, correct, on-theme starting point that
# uses the RIGHT helpers for the chosen report type. The slot markers stay intact, so the
# author keeps surgical-editing exactly as with the raw template.
#
#   dashboard   kpis + bento grid (filtered chart + goal gauges) + table
#   review      claims verdict + findings + diff + actionItems (code / design review)
#   postmortem  claims + storyline impact chart + timeline + mermaid + findings
#   explainer   takeaway + mermaid + codeTabs + glossary (teach a concept)
#   comparison  compare + pill + callout                 (decision / options grid)
#
# Usage:  bash scripts/scaffold.sh <type> <out.html>
#         type ∈ dashboard | review | postmortem | explainer | comparison
#
# next: edit the slots, then  bash scripts/inline.sh <out.html>
set -euo pipefail

TYPES="dashboard review postmortem explainer comparison"

usage() {
  echo "usage: bash scripts/scaffold.sh <type> <out.html>" >&2
  echo "  type ∈ ${TYPES// /|}" >&2
  exit 1
}

[ $# -eq 2 ] || usage
TYPE="$1"; OUT="$2"
case " $TYPES " in *" $TYPE "*) ;; *) echo "unknown type: $TYPE" >&2; usage ;; esac

# Resolve the template from the script's own dir (like inline.sh) — single source of truth.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TPL="$REPO_ROOT/assets/template.html"
[ -f "$TPL" ] || { echo "missing template: $TPL" >&2; exit 1; }

[ -f "$OUT" ] && [ "$OUT" != "$TPL" ] && echo "overwriting existing $OUT" >&2

TYPE="$TYPE" TPL="$TPL" OUT="$OUT" python3 - <<'PY'
import os, re, sys

typ = os.environ['TYPE']
html = open(os.environ['TPL'], encoding='utf-8').read()

def slot(name, body):
    """Replace the body BETWEEN the open <!-- NAME … --> and close <!-- /NAME -->,
    keeping BOTH markers verbatim. The open marker may carry trailing doc text inside the
    comment (e.g. COOKIEBITE:FOOTER), so it's matched up to its own '-->' and preserved."""
    global html
    # capture the open marker (grp 1, incl any trailing doc text) and the close marker with
    # its own leading indentation (grp 2) so BOTH are re-emitted byte-for-byte.
    pat = re.compile(r'(<!--\s*' + re.escape(name) + r'\b.*?-->).*?'
                     r'([ \t]*<!-- /' + re.escape(name) + r' -->)', re.DOTALL)
    m = pat.search(html)
    if not m:
        sys.stderr.write('warning: slot %s not found — skipped\n' % name)
        return
    html = pat.sub(lambda mm: mm.group(1) + '\n' + body.rstrip('\n') + '\n' + mm.group(2),
                   html, count=1)

# ---- section helper: an <h2> header + a host div, matching the template's cadence ----
def section(sid, icon, title, host):
    return (
        '      <section id="%s" class="scroll-mt-24 mb-56">\n'
        '        <div class="flex items-center gap-8 mb-20">\n'
        '          <i data-lucide="%s" class="w-20 h-20 text-accent"></i>\n'
        '          <h2 class="text-title-24 font-bold">%s</h2>\n'
        '        </div>\n'
        '        %s\n'
        '      </section>'
    ) % (sid, icon, title, host)

def panel(sid, icon, title, host, span=''):
    # a bento-grid PANEL: quieter title-20 header, no own bottom margin (the grid row
    # owns spacing), optional col-span. Panels are still <section id>s so the TOC
    # observer works unchanged.
    cls = 'scroll-mt-24 min-w-0' + ((' ' + span) if span else '')
    return (
        '        <section id="%s" class="%s">\n'
        '          <div class="flex items-center gap-8 mb-8">\n'
        '            <i data-lucide="%s" class="w-18 h-18 text-accent"></i>\n'
        '            <h2 class="text-title-20 font-bold">%s</h2>\n'
        '          </div>\n'
        '          %s\n'
        '        </section>'
    ) % (sid, cls, icon, title, host)

def row(cols_class, *panels):
    # one bento row: side-by-side on lg, stacked below (grid-cols-1)
    return ('      <div class="grid grid-cols-1 %s gap-24 mb-56">\n%s\n      </div>'
            % (cols_class, '\n\n'.join(panels)))

def toc(items):
    lis = '\n'.join(
        '          <li><a href="#%s" class="block px-12 py-8 rounded-small '
        'text-secondary hover:text-primary transition">%s</a></li>' % (sid, label)
        for sid, label in items)
    return (
        '        <p class="text-caption-12 text-text-disabled mb-12 pl-12">Contents</p>\n'
        '        <ul id="toc" class="space-y-2 text-body-14">\n'
        '%s\n'
        '        </ul>'
    ) % lis

def header(badge, range_, title, lede):
    return (
        '      <header class="mb-40">\n'
        '        <div class="flex flex-wrap items-center gap-8 mb-16">\n'
        '          <span class="px-10 py-4 rounded-xxs bg-accent text-accent-on-text '
        'text-caption-12 font-semibold">%s</span>\n'
        '          <span class="px-10 py-4 rounded-xxs bg-disabled-bg text-secondary '
        'text-caption-12 nums">%s</span>\n'
        '        </div>\n'
        '        <h1 class="text-headline-36 font-bold tracking-tight">%s</h1>\n'
        '        <p class="mt-12 text-body-18 text-secondary prose-measure">%s</p>\n'
        '      </header>'
    ) % (badge, range_, title, lede)

def script(body):
    return (
        '<script>\n'
        '  document.addEventListener(\'DOMContentLoaded\', function () {\n'
        '    var CB = window.COOKIEBITE;\n'
        '%s\n'
        '    CB.refreshIcons();\n'
        '  });\n'
        '</script>'
    ) % body

# ======================================================================================
SK = {}

# -------------------------------------------------------------------- dashboard --------
SK['dashboard'] = dict(
    header=header('‹REPLACE› Status', '‹REPLACE› 2026-06-08 ~ 06-14',
                  '‹REPLACE› Weekly Dashboard',
                  '‹REPLACE› One-line summary of where the numbers landed this period.'),
    toc=toc([('summary', 'KPIs'), ('trend', 'Trend'), ('goals', 'Goals'), ('detail', 'Breakdown')]),
    # a dashboard is SCANNED, not read — the chart row is a bento grid (hero 2/3 + a
    # goal-gauge side panel), not another full-width stack. Panels stack on narrow.
    sections='\n\n'.join([
        section('summary', 'gauge', '‹REPLACE› Key metrics', '<div id="kpiGrid"></div>'),
        row('lg:grid-cols-3',
            # filtered chart: a native chip row above the chart host (wired via CB.connectFilter)
            panel('trend', 'trending-up', '‹REPLACE› Trend',
                  '<div id="trendFilter" class="flex flex-wrap gap-8 mb-12">\n'
                  '            <button data-value="rev" class="px-12 py-6 rounded-small border border-line text-body-14">Revenue</button>\n'
                  '            <button data-value="orders" class="px-12 py-6 rounded-small border border-line text-body-14">Orders</button>\n'
                  '          </div>\n'
                  '          <div id="trendChart"></div>',
                  span='lg:col-span-2'),
            panel('goals', 'target', '‹REPLACE› Goals', '<div id="goalGrid"></div>')),
        section('detail', 'table-2', '‹REPLACE› Breakdown', '<div id="detailTable"></div>'),
    ]),
    script=script("""
    CB.kpis('#kpiGrid', [
      { label: '‹REPLACE› Revenue', value: 124000, prefix: '$',
        delta: { dir: 'up', text: '+9.7%', tone: 'success' },
        spark: [101, 108, 105, 112, 118, 121, 124] },
      { label: '‹REPLACE› Orders', value: 3820,
        delta: { dir: 'up', text: '+4.1%', tone: 'success' } },
      { label: '‹REPLACE› Success rate', value: 97.1, suffix: '%',
        delta: { dir: 'up', text: '+0.7%p', tone: 'success' } },
      { label: '‹REPLACE› Open issues', value: 12, delta: null },
    ]);

    /* filtered chart — chip row drives the captured instance via __cbUpdate (F10, no window global) */
    var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var data = { rev: [101, 108, 105, 112, 118, 121, 124], orders: [520, 545, 530, 580, 610, 600, 635] };
    function opt(key) {
      return { xAxis: { type: 'category', data: days }, yAxis: { type: 'value' },
        series: [{ type: 'bar', data: data[key], barWidth: '48%',
          itemStyle: { color: CB.theme.ACCENT, borderRadius: [4, 4, 0, 0] } }] };
    }
    var chart = CB.chart('#trendChart', { ariaLabel: '‹REPLACE› trend', option: opt('rev'),
      table: { columns: ['Day', 'Value'], rows: days.map(function (d, i) { return [d, data.rev[i]]; }) } });
    CB.connectFilter('#trendFilter button', function (v) { chart.__cbUpdate(opt(v)); });

    CB.gaugeGrid('#goalGrid', [
      { label: '‹REPLACE› Revenue goal', value: 84, unit: '%', target: 100, sub: 'vs $150k' },
      { label: '‹REPLACE› Success rate', value: 97.1, unit: '%', target: 98.5, sub: 'target 98.5%' },
    ], { cols: '1-2' });

    CB.table('#detailTable', {
      columns: ['‹REPLACE› Channel', 'Value', 'Status'],
      numericCols: [1], statusCol: 2,
      rows: [
        ['‹REPLACE› Channel A', 72000, { label: 'OK', tone: 'success' }],
        ['‹REPLACE› Channel B', 31500, { label: 'OK', tone: 'success' }],
        ['‹REPLACE› Channel C', 9402, { label: 'Watch', tone: 'warning' }],
      ],
    });"""),
)

# -------------------------------------------------------------------- review -----------
SK['review'] = dict(
    header=header('‹REPLACE› Review', '‹REPLACE› PR #1234',
                  '‹REPLACE› Code Review',
                  '‹REPLACE› One-line verdict — what blocks merge and what is a follow-up.'),
    toc=toc([('verdict', 'Verdict'), ('findings', 'Findings'),
             ('change', 'Change'), ('actions', 'Action items')]),
    sections='\n\n'.join([
        section('verdict', 'gavel', '‹REPLACE› Verdict', '<div id="verdictBox"></div>'),
        section('findings', 'list-checks', '‹REPLACE› Findings', '<div id="findingsList"></div>'),
        section('change', 'file-diff', '‹REPLACE› Key change', '<div id="changeDiff"></div>'),
        section('actions', 'check-square', '‹REPLACE› Action items', '<div id="actionList"></div>'),
    ]),
    script=script("""
    /* the verdict as CLAIMS anchored to their evidence sections — the reviewer's
       conclusion up top; each claim links to the section that proves it. Write only
       claims a section actually backs (fewer claims, not thinner sections). */
    CB.claims('#verdictBox', [
      { claim: '‹REPLACE› Blocks merge: the retry path can double-charge', evidence: '#findings', value: 'P0', tone: 'critical' },
      { claim: '‹REPLACE› The idempotency-key fix is correct and complete', evidence: '#change', tone: 'success' },
      { claim: '‹REPLACE› Two follow-ups are tracked, none blocking', evidence: '#actions', value: 'P1×2', tone: 'info' },
    ], { title: '‹REPLACE› Verdict' });

    CB.findings('#findingsList', [
      { tone: 'critical', title: '‹REPLACE› Retry path can double-charge (no idempotency key)', where: 'refund.ts:42' },
      { tone: 'warning', title: '‹REPLACE› Card channel success rate below threshold', where: 'psp/card.ts:118' },
      { tone: 'info', title: '‹REPLACE› Weekend traffic 1.4× weekday — confirm autoscale headroom' },
    ], { filter: true });

    /* the load-bearing change as an escaped +/− diff (use CB.code for a full source card) */
    CB.diff('#changeDiff', {
      filename: 'refund.ts', lang: 'ts', startOld: 40, startNew: 40,
      lines: [
        { type: 'ctx', text: 'async function refund(req) {' },
        { type: 'del', text: '  return psp.refund(req.amount);' },
        { type: 'add', text: '  const key = idempotencyKey(req);' },
        { type: 'add', text: '  return psp.refund(req.amount, { key });' },
        { type: 'ctx', text: '}' },
      ],
    });

    CB.actionItems('#actionList', [
      { title: '‹REPLACE› Add idempotency key to refund path', owner: '‹REPLACE›', priority: 'P0' },
      { title: '‹REPLACE› Backfill the card-channel alert threshold', owner: '‹REPLACE›', priority: 'P1' },
    ], { copy: true });"""),
)

# -------------------------------------------------------------------- postmortem -------
SK['postmortem'] = dict(
    header=header('‹REPLACE› Postmortem', '‹REPLACE› 2026-06-14',
                  '‹REPLACE› Incident Postmortem',
                  '‹REPLACE› One-line summary — impact, duration, and the root cause.'),
    toc=toc([('summary', 'Summary'), ('impact', 'Impact'), ('timeline', 'Timeline'),
             ('cause', 'Root cause'), ('findings', 'Action items')]),
    sections='\n\n'.join([
        section('summary', 'flag', '‹REPLACE› Summary', '<div id="summaryBox"></div>'),
        section('impact', 'activity', '‹REPLACE› Impact',
                '<div id="impactChart"></div>\n'
                '        <div id="impactStory" class="mt-12"></div>'),
        section('timeline', 'clock', '‹REPLACE› Timeline', '<div id="incidentTimeline"></div>'),
        section('cause', 'git-branch', '‹REPLACE› Root cause', '<div id="causeFlow"></div>'),
        section('findings', 'list-checks', '‹REPLACE› Action items', '<div id="findingsList"></div>'),
    ]),
    script=script("""
    /* the summary as CLAIMS anchored to their evidence sections — the reader who
       trusts them stops here; a doubted claim is one click from its proof. */
    CB.claims('#summaryBox', [
      { claim: '‹REPLACE› 33-minute payment latency spike (p95 1.2s → 4.8s)', evidence: '#impact', value: '33m', tone: 'critical' },
      { claim: '‹REPLACE› Root cause: PSP connection pool exhausted under a retry storm', evidence: '#cause', tone: 'warning' },
      { claim: '‹REPLACE› Resolved by raising the pool + adding backoff', evidence: '#timeline', value: '14:35', tone: 'success' },
    ], { title: '‹REPLACE› Summary' });

    /* the impact chart WALKED, not just shown: a storyline steps the reader through
       the one chart the postmortem hangs on. semantics:{y:'duration'} formats the
       ms axis as 1.2s/4.8s. Keep beats to 3-5; one storyline per report at most. */
    var times = ['13:50', '14:00', '14:10', '14:20', '14:30', '14:40'];
    var p95 = [1200, 1300, 4800, 4100, 2200, 900];
    function impactSeries(extra) {
      return [Object.assign({ type: 'line', name: 'p95', data: p95 }, extra || {})];
    }
    var impact = CB.chart('#impactChart', {
      ariaLabel: '‹REPLACE› p95 latency over the incident window', height: 260,
      semantics: { y: 'duration' },
      option: { xAxis: { type: 'category', data: times }, yAxis: {}, series: impactSeries() },
      table: { columns: ['Time', 'p95 (ms)'], rows: times.map(function (t, i) { return [t, p95[i]]; }) },
    });
    CB.storyline('#impactStory', {
      chart: impact,
      base: { series: impactSeries() },
      steps: [
        { title: '‹REPLACE› The window', caption: '‹REPLACE› p95 across the incident, alert to recovery.' },
        { title: '‹REPLACE› The spike', caption: '‹REPLACE› 14:10 — p95 peaks at 4.8s as the pool exhausts.',
          option: { series: impactSeries({ markPoint: { data: [{ type: 'max', name: 'peak' }] } }) } },
        { title: '‹REPLACE› The recovery', caption: '‹REPLACE› Mitigation lands 14:21; p95 back under 1s by 14:40.',
          option: { series: impactSeries({ markLine: { symbol: 'none', data: [{ xAxis: '14:20', label: { formatter: '‹REPLACE› mitigation' } }] } }) } },
      ],
    });

    CB.timeline('#incidentTimeline', [
      { t: '14:02', kind: 'start', title: '‹REPLACE› Latency alert fired', sub: 'p95 1.2s → 4.8s' },
      { t: '14:09', kind: 'cause', title: '‹REPLACE› PSP connection pool exhausted', detail: 'Retry storm blocked the pool; new requests queued.' },
      { t: '14:21', kind: 'action', title: '‹REPLACE› Raised pool + added backoff', detail: 'Pool 50→120, exponential backoff cap added.' },
      { t: '14:35', kind: 'resolved', title: '‹REPLACE› p95 back to normal', sub: '4.8s → 0.9s' },
    ]);

    CB.mermaid('#causeFlow',
      'flowchart LR\\n' +
      '  A["Retry storm"] --> B["Pool exhausted"]\\n' +
      '  B --> C["Requests queue"]\\n' +
      '  C --> D["p95 latency spike"]');

    CB.findings('#findingsList', [
      { tone: 'critical', title: '‹REPLACE› Add a circuit breaker on the PSP client', where: 'psp/client.ts' },
      { tone: 'warning', title: '‹REPLACE› Alert on pool saturation, not just latency' },
      { tone: 'info', title: '‹REPLACE› Document the retry/backoff policy' },
    ], { filter: true });"""),
)

# -------------------------------------------------------------------- explainer --------
SK['explainer'] = dict(
    header=header('‹REPLACE› Explainer', '‹REPLACE› Guide',
                  '‹REPLACE› How X Works',
                  '‹REPLACE› One-line framing — what the reader will understand by the end.'),
    toc=toc([('tldr', 'TL;DR'), ('flow', 'How it flows'),
             ('code', 'In code'), ('terms', 'Terms')]),
    sections='\n\n'.join([
        section('tldr', 'sparkles', '‹REPLACE› TL;DR', '<div id="tldrBox"></div>'),
        section('flow', 'git-branch', '‹REPLACE› How it flows', '<div id="flowDiagram"></div>'),
        section('code', 'code', '‹REPLACE› In code', '<div id="codeTabs"></div>'),
        # glossary terms appear in prose the linker scans — write normal prose, no .gloss spans
        section('terms', 'book-open', '‹REPLACE› Terms',
                '<p class="prose-measure text-body-16 text-secondary">‹REPLACE› An '
                'access token is exchanged at the token endpoint; the idempotency key '
                'makes a retried request safe.</p>'),
    ]),
    script=script("""
    document.getElementById('tldrBox').innerHTML = CB.takeaway([
      '‹REPLACE› The client exchanges a code for a token at the token endpoint',
      '‹REPLACE› Each request carries an idempotency key so retries are safe',
      { html: '‹REPLACE› Full spec in <a href="#code">the code below</a>' },
    ], { title: '‹REPLACE› In one minute' });

    CB.mermaid('#flowDiagram',
      'flowchart LR\\n' +
      '  A["Client"] -->|code| B["Token endpoint"]\\n' +
      '  B -->|access token| A\\n' +
      '  A -->|token| C["API"]');

    CB.codeTabs('#codeTabs', [
      { label: 'JavaScript', lang: 'javascript', filename: 'exchange.js',
        code: 'const res = await fetch(tokenUrl, {\\n  method: \\'POST\\',\\n  body: JSON.stringify({ code }),\\n});\\nconst { access_token } = await res.json();' },
      { label: 'Python', lang: 'python', filename: 'exchange.py',
        code: 'res = requests.post(token_url, json={"code": code})\\naccess_token = res.json()["access_token"]' },
    ]);

    /* glossary: pass plain terms; the linker finds the first occurrence in the prose above */
    CB.glossary({
      'access token': '‹REPLACE› A short-lived credential the client sends to call the API.',
      'idempotency key': '‹REPLACE› A unique key that makes a retried request apply only once.',
    });"""),
)

# -------------------------------------------------------------------- comparison -------
SK['comparison'] = dict(
    header=header('‹REPLACE› Comparison', '‹REPLACE› Decision',
                  '‹REPLACE› Option A vs Option B',
                  '‹REPLACE› One-line framing — the decision and what matters most.'),
    toc=toc([('grid', 'Comparison'), ('notes', 'Notes')]),
    sections='\n\n'.join([
        section('grid', 'columns-3', '‹REPLACE› Comparison', '<div id="compareGrid"></div>'),
        section('notes', 'info', '‹REPLACE› Notes', '<div id="noteCallout"></div>'),
    ]),
    script=script("""
    CB.compare('#compareGrid', {
      rows: ['‹REPLACE› Effort', '‹REPLACE› Risk', '‹REPLACE› Cost', '‹REPLACE› Reversible'],
      options: [
        { name: '‹REPLACE› Option A', recommended: true, values: [
          { label: 'Low', tone: 'success' },
          { label: 'Low', tone: 'success' },
          '$',
          { label: 'Yes', tone: 'success' },
        ] },
        { name: '‹REPLACE› Option B', values: [
          { label: 'High', tone: 'critical' },
          { label: 'Med', tone: 'warning' },
          '$$$',
          { label: 'No', tone: 'critical' },
        ] },
      ],
      recommendation: '‹REPLACE› <b>Option A</b> wins on effort and reversibility for the same outcome.',
    });

    document.getElementById('noteCallout').innerHTML =
      CB.callout('‹REPLACE› Re-evaluate once traffic doubles — Option B may win at scale.',
        { tone: 'info', title: 'Note.' });"""),
)

# ======================================================================================
sk = SK[typ]
slot('COOKIEBITE:TOC', sk['toc'])
slot('COOKIEBITE:HEADER', sk['header'])
slot('COOKIEBITE:SECTIONS', sk['sections'])
slot('COOKIEBITE:REPORT-SCRIPT', sk['script'])
# The demo footer is Korean; since the skeleton is English prose, drop a neutral English
# placeholder (the author still owns it via the slot — marker stays intact).
slot('COOKIEBITE:FOOTER',
     '      <footer class="pt-24 border-t border-line-weak text-caption-12 text-text-disabled">\n'
     '        ‹REPLACE› Generated 2026-06-15 · Source: ‹your data source›\n'
     '      </footer>')

# The template lang/locale/footer default to Korean; a fresh skeleton is English prose, so
# flip the html lang and drop the ko-KR REPORT_LOCALE to the en-US default (numbers still
# format; the author can re-localize). Footer is left to the author via the slot.
html = html.replace('<html lang="ko">', '<html lang="en">', 1)
html = html.replace(
    "window.REPORT_LOCALE = {'number': 'ko-KR', 'currency': 'KRW', 'symbol': '₩', 'bigUnits': true};",
    # bigUnits false: an en-US report banding money as "$3.5만" is the bug this fixes —
    # 만/억 units belong to the East-Asian locales only.
    "window.REPORT_LOCALE = {'number': 'en-US', 'currency': 'USD', 'symbol': '$', 'bigUnits': false};",
    1)

open(os.environ['OUT'], 'w', encoding='utf-8').write(html)
sys.stderr.write('scaffolded %s report -> %s\n' % (typ, os.environ['OUT']))
PY

echo "" >&2
echo "next: edit the slots, then  bash scripts/inline.sh $OUT" >&2
