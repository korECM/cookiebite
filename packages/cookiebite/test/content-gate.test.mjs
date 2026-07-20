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
