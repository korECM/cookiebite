// packages/cookiebite/test/content-gate.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  contentGate,
  redactMatch,
  extractBodyText,
  proseStats,
} from '../lib/content-gate.mjs';
import {
  countTableRows,
  TABLE_ROW_WARN_THRESHOLD,
} from '../lib/build.mjs';
import { runCli } from './helpers.mjs';

function wrapRoot(bodyInner) {
  return `<!doctype html><html><body><div id="root">${bodyInner}</div><script id="cookiebite-app">void 0</script></body></html>`;
}

test('redactMatch shows first 6 chars plus ellipsis', () => {
  assert.equal(redactMatch('AKIAIOSFODNN7EXAMPLE'), 'AKIAIO…');
  assert.equal(redactMatch('ABC'), 'A…');
});

test('clean html passes with no violations', () => {
  const html = wrapRoot('<p>주간 매출은 전주 대비 4.2% 올랐다.</p>');
  assert.deepEqual(contentGate(html).violations, []);
});

test('placeholder-residue warns patterns', () => {
  const cases = [
    'lorem ipsum dolor',
    'TODO: fill me',
    'FIXME later',
    'placeholder text',
    '샘플 데이터입니다',
    '여기에 입력하세요',
    'code XXX here',
  ];
  for (const text of cases) {
    const { violations } = contentGate(wrapRoot(`<p>${text}</p>`));
    assert.ok(
      violations.some((v) => v.rule === 'placeholder-residue'),
      `expected placeholder for: ${text}`,
    );
  }
});

test('secret-aws-akia', () => {
  const key = 'AKIAIOSFODNN7EXAMPLE';
  const { violations } = contentGate(wrapRoot(`<p>key=${key}</p>`));
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, 'secret-aws-akia');
  assert.equal(violations[0].match, key);
});

test('secret-github-pat', () => {
  const token = `ghp_${'a'.repeat(36)}`;
  const { violations } = contentGate(wrapRoot(`<span>${token}</span>`));
  assert.equal(violations[0].rule, 'secret-github-pat');
  assert.equal(violations[0].match, token);
});

test('secret-sk', () => {
  const key = `sk-${'b'.repeat(20)}`;
  const { violations } = contentGate(wrapRoot(`<p>${key}</p>`));
  assert.equal(violations[0].rule, 'secret-sk');
});

test('secret-jwt', () => {
  const jwt = `eyJ${'c'.repeat(20)}.${'d'.repeat(20)}`;
  const { violations } = contentGate(wrapRoot(`<p>${jwt}</p>`));
  assert.equal(violations[0].rule, 'secret-jwt');
});

test('secret-private-key', () => {
  const hdr = '-----BEGIN RSA PRIVATE KEY-----';
  const { violations } = contentGate(wrapRoot(`<pre>${hdr}\nMIIE</pre>`));
  assert.equal(violations[0].rule, 'secret-private-key');
});

test('extractBodyText ignores script bundle outside #root', () => {
  const html =
    wrapRoot('<p>ok</p>') +
    '<!-- trailing -->';
  // inject fake secret only in a sibling script before rebuild — use raw string
  const withBundle = `<!doctype html><html><body><div id="root"><p>ok</p></div><script id="cookiebite-app">const x="AKIAIOSFODNN7EXAMPLE"</script></body></html>`;
  assert.deepEqual(contentGate(withBundle).violations, []);
  assert.match(extractBodyText(withBundle), /ok/);
  assert.doesNotMatch(extractBodyText(withBundle), /AKIA/);
});

test('countTableRows counts tr openings', () => {
  const markup = '<table><thead><tr><th>a</th></tr></thead><tbody>' +
    '<tr><td>1</td></tr>'.repeat(10) +
    '</tbody></table>';
  assert.equal(countTableRows(markup), 11);
  assert.equal(countTableRows('<div>no table</div>'), 0);
});

test('countTableRows threshold constant is 300', () => {
  assert.equal(TABLE_ROW_WARN_THRESHOLD, 300);
  const rows = '<tr><td>x</td></tr>'.repeat(301);
  assert.ok(countTableRows(rows) > TABLE_ROW_WARN_THRESHOLD);
});

test('build fails on secret with redacted rule name', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'cb-secret-'));
  const key = 'AKIAIOSFODNN7EXAMPLE';
  const report = path.join(dir, 'secret.tsx');
  writeFileSync(
    report,
    `import { Report, Section } from 'cookiebite';
export default function App() {
  return (
    <Report title="시크릿">
      <Section id="a" title="A"><p>leak ${key}</p></Section>
    </Report>
  );
}
`,
  );
  const out = path.join(dir, 'out.html');
  const result = runCli(['build', report, '-o', out]);
  assert.equal(result.code, 1, result.stderr);
  assert.match(result.stderr, /secret-aws-akia/);
  assert.match(result.stderr, /AKIAIO…/);
  assert.doesNotMatch(result.stderr, new RegExp(key));
  assert.equal(existsSync(out), false);
});

test('build warns on placeholder but exits 0', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'cb-ph-'));
  const report = path.join(dir, 'ph.tsx');
  writeFileSync(
    report,
    `import { Report, Section } from 'cookiebite';
export default function App() {
  return (
    <Report title="플레이스홀더">
      <Section id="a" title="A"><p>TODO 채울 것</p></Section>
    </Report>
  );
}
`,
  );
  const out = path.join(dir, 'out.html');
  const result = runCli(['build', report, '-o', out]);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stderr, /placeholder-residue/);
  assert.ok(existsSync(out));
});

test('proseStats: counts paragraphs, ignores captions, strips koGlue joiners', () => {
  const markup =
    '<p>짧음</p>' +
    `<p>${'가'.repeat(120)}</p>` +
    `<p>${'나'.repeat(60)}</p>` +
    `<p>${'다'.repeat(100)}</p>` +
    `<p>노드 1⁠대와 또 ${'라'.repeat(80)}</p>`;
  const s = proseStats(markup);
  assert.equal(s.count, 4, '40자 미만은 캡션으로 보고 뺀다');
  assert.equal(s.longest, 120);
  assert.ok(s.median >= 60 && s.median <= 110);
});

test('proseStats: a report with no prose reports zeroes', () => {
  assert.deepEqual(proseStats('<div>표만 있다</div>'), {
    count: 0,
    median: 0,
    longest: 0,
  });
});

test('fragmented prose warns without failing the build', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'cb-prose-'));
  const report = path.join(dir, 'frag.tsx');
  // 40자 이상 80자 미만 — 문단으로 세지만 논증을 담기엔 짧은 구간
  const caption = '한 줄짜리 캡션으로만 쓴 문장이고 여기까지가 한 조각이며 논증이 이어지지 않는다';
  writeFileSync(
    report,
    `import { Report, Section } from 'cookiebite';
export default function App() {
  return (
    <Report title="파편화">
      <Section id="a" title="A" lede="${caption}"><p>${caption}</p></Section>
      <Section id="b" title="B" lede="${caption}"><p>${caption}</p></Section>
      <Section id="c" title="C" lede="${caption}"><p>${caption}</p></Section>
    </Report>
  );
}
`,
  );
  const out = path.join(dir, 'out.html');
  const result = runCli(['build', report, '-o', out]);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stderr, /길이 중앙값/);
  assert.match(result.stderr, /Verdict/);
  assert.ok(existsSync(out));
});
