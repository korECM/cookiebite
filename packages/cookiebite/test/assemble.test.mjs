import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assembleDocument } from '../lib/assemble.mjs';
import { persimmon } from '../src/themes.ts';

const base = { markup: '<main><h1>제목</h1></main>', theme: persimmon, title: '테스트 <리포트>', lang: 'ko' };

test('assembled document carries the canonical block ids in order', () => {
  const html = assembleDocument({
    ...base,
    twCss: '.bg-card { background-color: var(--color-card); }',
    collected: { calls: [], css: '.cb-kpis { color: var(--cb-text); }' },
  });
  const order = [
    'id="cookiebite-theme"',
    'id="cookiebite-theme-css"',
    'id="cookiebite-core-css"',
    'id="cookiebite-tsx-css"',
    'id="cookiebite-tw-css"',
    'id="cookiebite-components-css"',
    '<main><h1>제목</h1></main>',
    'id="cookiebite-dependency-summary"',
    'id="cookiebite-theme-compiler"',
    'id="cookiebite-core-js"',
  ];
  let cursor = -1;
  for (const marker of order) {
    const index = html.indexOf(marker);
    assert.ok(index > cursor, `${marker} appears in order`);
    cursor = index;
  }
  assert.match(html, /^<!doctype html>\n<html lang="ko">/);
  assert.match(html, /<title>테스트 &lt;리포트&gt;<\/title>/);
  assert.match(html, /--cb-accent:/);
  assert.match(html, /<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr[^"]*pretendard[^"]*">/);
});

test('empty twCss omits the cookiebite-tw-css block', () => {
  const html = assembleDocument(base);
  assert.doesNotMatch(html, /cookiebite-tw-css/);
});

test('tsx-css block is always emitted and keeps Korean text on word boundaries', () => {
  // core CSS는 drift 가드라 손대지 않고, keep-all 규칙은 별도 tsx-css 블록으로 항상 방출한다.
  const html = assembleDocument(base);
  const block = html.match(/id="cookiebite-tsx-css">\s*([\s\S]*?)\s*<\/style>/)[1];
  assert.match(block, /main \{[^}]*word-break: keep-all/);
  assert.match(block, /overflow-wrap: anywhere/);
});

test('tsx-css widens main to 1080, ships density tiers, and bridges shadcn vars', () => {
  // core는 main을 measure로 묶고 p/li만 measure를 유지하므로, tsx 계층에서 main만 1080으로 override한다.
  // --cb-space-unit은 테마가 리터럴(4px)로 컴파일하므로, 밀도 스케일은 그 리터럴을 calc에 심어 순환 참조를 피한다.
  const html = assembleDocument(base);
  const block = html.match(/id="cookiebite-tsx-css">\s*([\s\S]*?)\s*<\/style>/)[1];
  assert.match(block, /main\s*\{[^}]*max-width:\s*min\(1080px,\s*100%\)/);
  assert.match(block, /:root\[data-density="compact"\][^{]*\{[^}]*--density-scale:\s*\.82/);
  assert.match(block, /:root\[data-density="comfortable"\][^{]*\{[^}]*--density-scale:\s*1\b/);
  assert.match(block, /:root\[data-density="spacious"\][^{]*\{[^}]*--density-scale:\s*1\.18/);
  assert.match(block, /:root\[data-density\][^{]*\{[^}]*--cb-space-unit:\s*calc\(4px\s*\*\s*var\(--density-scale\)\)/);
  assert.match(block, /:root\[data-density\][^{]*\{[^}]*--cb-rhythm:\s*calc\(28px\s*\*\s*var\(--density-scale\)\)/);
  assert.match(block, /--background:\s*var\(--cb-background\)/);
  assert.match(block, /--foreground:\s*var\(--cb-text\)/);
  assert.match(block, /--primary:\s*var\(--cb-accent\)/);
  assert.match(block, /--primary-foreground:\s*var\(--cb-on-accent\)/);
  assert.match(block, /--muted:\s*var\(--cb-surface\)/);
  assert.match(block, /--muted-foreground:\s*var\(--cb-text-muted\)/);
  assert.match(block, /--border:\s*var\(--cb-divider\)/);
  assert.match(block, /--card:\s*var\(--cb-surface\)/);
  assert.match(block, /--card-foreground:\s*var\(--cb-text\)/);
  assert.match(block, /--radius:\s*var\(--cb-radius\)/);
});

test('theme block round-trips as a JSON object', () => {
  const html = assembleDocument(base);
  const theme = JSON.parse(html.match(/id="cookiebite-theme">\s*([\s\S]*?)\s*<\/script>/)[1]);
  assert.equal(typeof theme, 'object');
  assert.equal(theme.schemaVersion, 1);
  assert.equal(theme.seed.accent, persimmon.seed.accent);
});

test('dependency summary is core mode with no modules', () => {
  const html = assembleDocument(base);
  const summary = JSON.parse(html.match(/id="cookiebite-dependency-summary">\s*([\s\S]*?)\s*<\/script>/)[1]);
  assert.deepEqual(
    { schemaVersion: summary.schemaVersion, mode: summary.mode, declared: summary.declared, includedModules: summary.includedModules },
    { schemaVersion: 1, mode: 'core', declared: [], includedModules: [] },
  );
});

test('lang is attribute-escaped so it cannot inject markup', () => {
  const html = assembleDocument({ ...base, lang: 'ko" onload="x' });
  assert.doesNotMatch(html, /<html lang="ko" onload="x">/);
  assert.match(html, /<html lang="ko&quot; onload=&quot;x">/);
});

test('a dark seed emits a data-theme scoped block', () => {
  const theme = { ...persimmon, dark: { background: '#111111', text: '#EDEDED' } };
  const html = assembleDocument({ ...base, theme });
  assert.match(html, /:root\[data-theme="dark"\] \{/);
});

test('collected capabilities emit marker, module, script, and summary', () => {
  const collected = {
    calls: [
      { capability: 'table', hostId: 't1', options: { numericColumns: [1] } },
      { capability: 'glossary', hostId: 'g1', options: { definition: '용어 </script> 정의' } },
    ],
    css: '.cb-kpis { border-color: var(--cb-divider); }',
  };
  const html = assembleDocument({ ...base, collected });
  assert.match(html, /<!-- COOKIEBITE:USE glossary table -->/);
  assert.match(html, /id="cookiebite-components-css">[\s\S]*--cb-divider/);
  assert.match(html, /id="cookiebite-module-table"/);
  assert.match(html, /id="cookiebite-module-glossary"/);
  const script = html.match(/id="cookiebite-report-script">([\s\S]*?)<\/script>/)[1];
  assert.match(script, /CB\.sortable\(document\.getElementById\("t1"\), \{"numericColumns":\[1\]\}\)/);
  assert.match(script, /CB\.glossary\(/);
  assert.doesNotMatch(script, /<\/script>/i);
  // 호출별 try/catch 격리 — 첫 호출이 throw해도 둘째가 실행된다.
  assert.match(
    script,
    /try \{\s*window\.CB\.sortable\([\s\S]*?\}\s*catch \(error\) \{\s*console\.error\('cookiebite capability failed:', error\);\s*\}/,
  );
  assert.match(
    script,
    /try \{\s*window\.CB\.glossary\([\s\S]*?\}\s*catch \(error\) \{\s*console\.error\('cookiebite capability failed:', error\);\s*\}/,
  );
  const summary = JSON.parse(html.match(/id="cookiebite-dependency-summary">\s*([\s\S]*?)\s*<\/script>/)[1]);
  assert.deepEqual(summary.declared, ['glossary', 'table']);
  assert.deepEqual(summary.includedModules, ['glossary', 'table']);
  // 순서: summary → core-js → module → report-script.
  // 요약 JSON은 core boot이 includedModules를 읽어야 하므로 core-js보다 앞서야 한다.
  const order = ['id="cookiebite-dependency-summary"', 'id="cookiebite-core-js"', 'id="cookiebite-module-glossary"', 'id="cookiebite-module-table"', 'id="cookiebite-report-script"'];
  let cursor = -1;
  for (const marker of order) {
    const index = html.indexOf(marker);
    assert.ok(index > cursor, `${marker} in order`);
    cursor = index;
  }
});

test('each capability call is wrapped in its own try/catch so one throw does not stop the next', () => {
  const collected = {
    calls: [
      { capability: 'table', hostId: 't1', options: {} },
      { capability: 'glossary', hostId: 'g1', options: { definition: '정의' } },
    ],
  };
  const html = assembleDocument({ ...base, collected });
  const script = html.match(/id="cookiebite-report-script">([\s\S]*?)<\/script>/)[1];
  const tryBlocks = [...script.matchAll(/try \{/g)];
  assert.equal(tryBlocks.length, 2);
  assert.match(script, /cookiebite:core-ready/);
  assert.match(script, /console\.error\('cookiebite capability failed:', error\)/);
  // 두 호출이 각각 try 안에 있고, sortable 실패 뒤에도 glossary 호출이 남아 있다.
  const sortableIdx = script.indexOf('CB.sortable');
  const glossaryIdx = script.indexOf('CB.glossary');
  assert.ok(sortableIdx > 0 && glossaryIdx > sortableIdx);
  const firstCatch = script.indexOf("console.error('cookiebite capability failed:'");
  assert.ok(firstCatch > sortableIdx && firstCatch < glossaryIdx);
});

test('omitted collected keeps the phase 1 document shape', () => {
  const html = assembleDocument(base);
  assert.match(html, /<!-- COOKIEBITE:USE -->/);
  assert.doesNotMatch(html, /cookiebite-components-css|cookiebite-module-|cookiebite-report-script/);
});

test('an unknown capability throws before assembly', () => {
  assert.throws(
    () => assembleDocument({ ...base, collected: { calls: [{ capability: 'hologram', hostId: 'x', options: {} }], css: '' } }),
    /unknown capability 'hologram'/,
  );
});

test('collected chart emits marker, module, echarts CDN, dark option picker, and summary', () => {
  const collected = {
    calls: [
      {
        capability: 'chart',
        hostId: 'c1',
        options: {
          light: { color: ['#FA4D02'], series: [{ type: 'bar', data: [1] }] },
          dark: { color: ['#FF8A5B'], series: [{ type: 'bar', data: [1] }] },
          data: { columns: ['x', 'y'], rows: [['a', 1]] },
          ariaLabel: '차트 </script> 라벨',
        },
      },
    ],
    css: '',
  };
  const html = assembleDocument({ ...base, collected });
  assert.match(html, /<!-- COOKIEBITE:USE chart -->/);
  assert.match(html, /id="cookiebite-module-chart"/);
  assert.match(html, /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/echarts@5\.5\.1\/dist\/echarts\.min\.js"><\/script>/);
  const script = html.match(/id="cookiebite-report-script">([\s\S]*?)<\/script>/)[1];
  assert.match(script, /data-theme.*dark/);
  assert.match(script, /CB\.chart\(/);
  assert.doesNotMatch(script, /<\/script>/i);
  const summary = JSON.parse(html.match(/id="cookiebite-dependency-summary">\s*([\s\S]*?)\s*<\/script>/)[1]);
  assert.deepEqual(summary.externalResources, ['echarts']);
  assert.ok(typeof summary.versions.cookiebite === 'string' && summary.versions.cookiebite.length > 0);
  assert.equal(summary.versions.echarts, '5.5.1');
});

test('explicitly identical light/dark chart options emit a static option object', () => {
  // 파생 dark는 light와 달라 분기 함수가 기본이다. light===dark를 명시한 극단만 정적.
  const option = { color: ['#FA4D02'], series: [{ type: 'bar', data: [1] }] };
  const collected = {
    calls: [
      {
        capability: 'chart',
        hostId: 'c-static',
        options: {
          light: option,
          dark: option,
          data: { columns: ['x', 'y'], rows: [['a', 1]] },
          ariaLabel: '정적 옵션 차트',
        },
      },
    ],
    css: '',
  };
  const html = assembleDocument({ ...base, collected });
  const script = html.match(/id="cookiebite-report-script">([\s\S]*?)<\/script>/)[1];
  assert.doesNotMatch(script, /data-theme/);
  assert.match(script, /option:\s*\{/);
  assert.doesNotMatch(script, /option:\s*function\s*\(/);
});

test('flags controls emits cookiebite-tsx-js with localStorage keys after core-js', () => {
  const html = assembleDocument({
    ...base,
    collected: { calls: [], css: '', flags: ['controls'] },
  });
  assert.match(html, /id="cookiebite-tsx-js"/);
  const block = html.match(/id="cookiebite-tsx-js">([\s\S]*?)<\/script>/)[1];
  assert.match(block, /cookiebite:theme/);
  assert.match(block, /cookiebite:density/);
  assert.match(block, /data-cb-toggle/);
  assert.match(block, /CB\.theme\.set/);
  assert.match(block, /cookiebite:core-ready/);
  const coreIdx = html.indexOf('id="cookiebite-core-js"');
  const tsxIdx = html.indexOf('id="cookiebite-tsx-js"');
  assert.ok(coreIdx > 0 && tsxIdx > coreIdx, 'tsx-js follows core-js');
});

test('omitted controls flag skips cookiebite-tsx-js', () => {
  const html = assembleDocument({
    ...base,
    collected: { calls: [], css: '', flags: [] },
  });
  assert.doesNotMatch(html, /cookiebite-tsx-js/);
  assert.doesNotMatch(html, /cookiebite:theme/);
});
