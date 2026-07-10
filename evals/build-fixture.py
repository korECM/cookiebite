# -*- coding: utf-8 -*-
# evals/build-fixture.py <out.html> — build the kitchen-sink regression fixture.
#
# One report that exercises the assertion surface evals/run.sh checks:
# claims (evidence anchors), kpis (delta + the null sentinel), a semantics:'price'
# chart driven by a 3-beat storyline, a 3-chip connectFilter row (every chip must
# wire — the v0.12.1 regression), a lollipop deviation chart (below-baseline label
# side), a matrix (must stretch to its container), a DELIBERATE truncated-baseline
# bar (the suite asserts the warning fires — honesty checks must stay loud), a
# Grid.js table with cellMoney, and an altitude-detail section + toggle.
# Data is tiny and fixed; the fixture is a harness, not a showcase.
import os, re, sys

OUT = sys.argv[1]
TPL = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'template.html')
html = open(TPL, encoding='utf-8').read()

def slot(name, body):
    global html
    pat = re.compile(r'(<!--\s*' + re.escape(name) + r'\b.*?-->).*?'
                     r'([ \t]*<!-- /' + re.escape(name) + r' -->)', re.DOTALL)
    m = pat.search(html)
    assert m, 'slot %s not found' % name
    html = pat.sub(lambda mm: mm.group(1) + '\n' + body.rstrip('\n') + '\n' + mm.group(2), html, count=1)

slot('COOKIEBITE:TITLE', '<title>cookiebite eval fixture</title>')

slot('COOKIEBITE:HEAD-LIBS', '''<!-- Grid.js (COOKIEBITE.table needs this) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/gridjs@6.2.0/dist/theme/mermaid.min.css" />
<script src="https://cdn.jsdelivr.net/npm/gridjs@6.2.0/dist/gridjs.umd.js"></script>''')

slot('COOKIEBITE:TOC', '''        <p class="text-caption-12 text-text-disabled mb-12 pl-12">목차</p>
        <ul id="toc" class="space-y-2 text-body-14">
          <li><a href="#claims" class="block px-12 py-8 rounded-small text-secondary hover:text-primary transition">요약</a></li>
          <li><a href="#kpis" class="block px-12 py-8 rounded-small text-secondary hover:text-primary transition">KPI</a></li>
          <li><a href="#story" class="block px-12 py-8 rounded-small text-secondary hover:text-primary transition">스토리라인</a></li>
          <li><a href="#filter" class="block px-12 py-8 rounded-small text-secondary hover:text-primary transition">필터</a></li>
          <li><a href="#shapes" class="block px-12 py-8 rounded-small text-secondary hover:text-primary transition">셰이프</a></li>
          <li><a href="#bait" class="block px-12 py-8 rounded-small text-secondary hover:text-primary transition">경고 베이트</a></li>
          <li><a href="#detail" class="block px-12 py-8 rounded-small text-secondary hover:text-primary transition">상세</a></li>
        </ul>''')

slot('COOKIEBITE:HEADER', '''      <header class="mb-40">
        <div class="flex flex-wrap items-center gap-8 mb-16">
          <span class="px-10 py-4 rounded-xxs bg-accent text-accent-on-text text-caption-12 font-semibold">EVAL FIXTURE</span>
          <span class="px-10 py-4 rounded-xxs bg-disabled-bg text-secondary text-caption-12">evals/run.sh가 단언하는 회귀 하네스</span>
        </div>
        <h1 class="text-headline-36 font-bold tracking-tight">cookiebite 회귀 픽스처</h1>
        <p class="mt-12 text-body-18 text-secondary prose-measure">사람이 읽는 리포트가 아니라 기계가 단언하는 하네스입니다.</p>
      </header>''')

def section(sid, title, host, detail=False):
    attr = ' data-altitude-detail' if detail else ''
    return ('      <section id="%s"%s class="scroll-mt-24 mb-56">\n'
            '        <h2 class="text-title-24 font-bold mb-16">%s</h2>\n'
            '        %s\n'
            '      </section>') % (sid, attr, title, host)

slot('COOKIEBITE:SECTIONS', '\n\n'.join([
    section('claims', '요약 (claims)', '<div id="fxClaims"></div>'),
    section('kpis', 'KPI', '<div id="fxKpis"></div>'),
    section('story', '스토리라인 + semantics', '<div id="fxTrend"></div>\n        <div id="fxStory" class="mt-12"></div>'),
    section('filter', '필터 칩 (3개 전부 배선돼야 함)',
            '<div id="fxFilter" class="flex flex-wrap gap-8 mb-16">\n'
            '          <button data-value="a" class="px-12 py-6 rounded-small border border-line text-body-14">A</button>\n'
            '          <button data-value="b" class="px-12 py-6 rounded-small border border-line text-body-14">B</button>\n'
            '          <button data-value="c" class="px-12 py-6 rounded-small border border-line text-body-14">C</button>\n'
            '        </div>\n'
            '        <div id="fxFilterChart"></div>'),
    section('shapes', '셰이프 (lollipop 편차 + matrix 폭)',
            '<div id="fxLollipop" class="mb-24"></div>\n        <div id="fxMatrix"></div>'),
    section('bait', '경고 베이트 (truncated-baseline이 발화해야 함)', '<div id="fxBait"></div>'),
    section('detail', '상세 (exec 뷰에서 접힘)', '<div id="fxTable"></div>', detail=True),
]))

slot('COOKIEBITE:FOOTER', '''      <footer class="pt-24 border-t border-line-weak text-caption-12 text-text-disabled">
        eval fixture · 합성 데이터
      </footer>''')

slot('COOKIEBITE:REPORT-SCRIPT', r'''<script>
  document.addEventListener('DOMContentLoaded', function () {
    var CB = window.COOKIEBITE;

    CB.claims('#fxClaims', [
      { claim: '스토리라인 차트는 가격 축을 쓴다', evidence: '#story', value: '₩1억', tone: 'info' },
      { claim: '필터 칩 세 개가 전부 동작한다', evidence: '#filter', tone: 'success' },
    ], { title: '픽스처 주장' });

    CB.kpis('#fxKpis', [
      { label: '델타 있는 지표', value: 97.5, unit: '%', delta: { dir: 'up', text: '+0.5%p', tone: 'success' }, spark: [95, 96, 96.5, 97, 97.5] },
      { label: '베이스라인 없는 지표', value: 12, unit: '건', delta: null },
    ]);

    /* storyline + semantics:price */
    var DAYS = ['월', '화', '수', '목', '금'];
    var REV = [90, 95, 88, 100, 180].map(function (m) { return m * 1e6; });
    function tSeries(extra) { return [Object.assign({ type: 'line', name: '매출', data: REV }, extra || {})]; }
    var trend = CB.chart('#fxTrend', {
      ariaLabel: 'fixture trend', height: 220, semantics: { y: 'price' },
      option: { xAxis: { type: 'category', data: DAYS }, yAxis: {}, series: tSeries() },
      table: { columns: ['일', '매출'], rows: DAYS.map(function (d, i) { return [d, REV[i]]; }) },
    });
    CB.storyline('#fxStory', {
      chart: trend, base: { series: tSeries() },
      steps: [
        { title: '비트1', caption: '첫 번째 비트.' },
        { title: '비트2', caption: '두 번째 비트 — 피크 마킹.', option: { series: tSeries({ markPoint: { data: [{ type: 'max' }] } }) } },
      ],
    });

    /* connectFilter — 3 chips, EVERY one must wire (v0.12.1 regression) */
    var FDATA = { a: [5, 3, 4], b: [1, 2, 3], c: [9, 9, 9] };
    // FUNCTION option + palette call INSIDE it: the dark-safe contract — every re-theme
    // re-runs fOpt, so categoricalColors re-derives for the new surface AND records a
    // palette entry per theme (the suite asserts both light and dark were judged).
    var fkey = 'a';
    function fOpt(k) {
      var colors = CB.categoricalColors(3);
      return { color: colors, xAxis: { type: 'category', data: ['x', 'y', 'z'] }, yAxis: {},
        series: [{ type: 'bar', data: FDATA[k], itemStyle: { color: colors[0] } }] };
    }
    var fchart = CB.chart('#fxFilterChart', { ariaLabel: 'fixture filter chart', height: 180,
      option: function () { return fOpt(fkey); },
      table: { columns: ['k', 'v'], rows: [['x', 5], ['y', 3], ['z', 4]] } });
    CB.connectFilter('#fxFilter button', function (v) { fkey = v; fchart.__cbUpdate(fOpt(v), true); });

    /* lollipop deviation (one row below baseline) + matrix */
    CB.chart('#fxLollipop', { ariaLabel: 'fixture lollipop', height: 160,
      option: CB.shapes.lollipop({ rows: [
        { label: '알파', value: 99.2 }, { label: '베타', value: 96.0, tone: 'critical' }, { label: '감마', value: 98.9 },
      ], baseline: 98.5 }),
      table: { columns: ['이름', '값'], rows: [['알파', 99.2], ['베타', 96.0], ['감마', 98.9]] } });
    CB.matrix('#fxMatrix', {
      rows: ['월', '화', '수'], cols: ['W1', 'W2', 'W3', 'W4'],
      data: [[10, 20, 30, 40], [15, 25, 35, 45], [5, 10, 20, 60]],
      ariaLabel: 'fixture matrix',
    });

    /* BAIT: a deliberately truncated bar baseline — the suite asserts this WARNS */
    CB.chart('#fxBait', { ariaLabel: 'bait-truncated', height: 160,
      option: { xAxis: { type: 'category', data: ['a', 'b'] }, yAxis: { min: 50 },
        series: [{ type: 'bar', data: [95, 99] }] },
      table: { columns: ['k', 'v'], rows: [['a', 95], ['b', 99]] } });

    CB.table('#fxTable', {
      columns: ['이름', { name: '금액', formatter: CB.cellMoney() }],
      numericCols: [1],
      rows: [['알파', 120000], ['베타', 98000]],
    });

    CB.altitudeToggle();
    CB.refreshIcons();
  });
</script>''')

open(OUT, 'w', encoding='utf-8').write(html)
sys.stderr.write('fixture -> %s\n' % OUT)
