import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assembleDocument } from '../lib/assemble.mjs';
import { compileTheme } from '../lib/theme-compile.mjs';
import { persimmon } from '../src/themes.ts';

const { css: themeCss } = compileTheme(persimmon);

const base = {
  markup: '<h1>제목</h1>',
  themeCss,
  clientJs: 'window.__COOKIEBITE_HYDRATED__=true;',
  title: '테스트 <리포트>',
  theme: persimmon,
  lang: 'ko',
};

test('assembled document carries the canonical block ids in order', () => {
  const html = assembleDocument({
    ...base,
    twCss: '.bg-card{background-color:var(--card)}',
  });
  const order = [
    'id="cookiebite-boot"',
    'id="cookiebite-theme"',
    'id="cookiebite-fonts"',
    'id="cookiebite-base"',
    'id="cookiebite-tw"',
    'id="root"',
    'id="cookiebite-app"',
  ];
  let cursor = -1;
  for (const marker of order) {
    const index = html.indexOf(marker);
    assert.ok(index > cursor, `${marker} appears in order`);
    cursor = index;
  }
  assert.match(html, /^<!doctype html>\n<html lang="ko">/);
  assert.match(html, /<title>테스트 &lt;리포트&gt;<\/title>/);
  assert.match(html, /--background:/);
  assert.match(html, /cookiebite-theme/);
  assert.match(html, /cookiebite-density/);
  assert.doesNotMatch(html, /<link\s+rel=["']stylesheet["']/i);
});

test('empty twCss omits the cookiebite-tw block', () => {
  const html = assembleDocument(base);
  assert.doesNotMatch(html, /cookiebite-tw/);
});

test('boot script applies dark class and density before paint', () => {
  const html = assembleDocument(base);
  const boot = html.match(/id="cookiebite-boot">([\s\S]*?)<\/script>/)[1];
  assert.match(boot, /localStorage\.getItem\("cookiebite-theme"\)/);
  assert.match(boot, /classList\.add\("dark"\)/);
  assert.match(boot, /localStorage\.getItem\("cookiebite-density"\)/);
  assert.match(boot, /data-density/);
  assert.match(boot, /try\{/);
});

test('fonts block uses seed font-family without external urls', () => {
  const html = assembleDocument(base);
  const fonts = html.match(/id="cookiebite-fonts">\s*([\s\S]*?)\s*<\/style>/)[1];
  assert.match(fonts, /font-family:/);
  assert.doesNotMatch(fonts, /https?:\/\//);
});

test('default Pretendard preset embeds subset woff2 as data URI', () => {
  const html = assembleDocument(base);
  const fonts = html.match(/id="cookiebite-fonts">\s*([\s\S]*?)\s*<\/style>/)[1];
  assert.match(fonts, /@font-face/);
  assert.match(fonts, /data:font\/woff2;base64,/);
  assert.match(fonts, /format\('woff2-variations'\)/);
  assert.match(fonts, /font-family:'Pretendard Variable'/);
  assert.match(fonts, /body\{font-family:'Pretendard Variable',Pretendard/);
  assert.doesNotMatch(fonts, /https?:\/\//);
  assert.doesNotMatch(html, /<link\s+rel=["']stylesheet["']/i);
  for (const m of html.matchAll(/\b(?:src|href)\s*=\s*(["'])([^"']*)\1/gi)) {
    const value = m[2];
    if (value.startsWith('data:') || value.startsWith('#')) continue;
    assert.doesNotMatch(value, /^https?:\/\//i, `external ref: ${value}`);
  }
});

test('custom non-Pretendard seed skips font embedding', () => {
  const html = assembleDocument({
    ...base,
    theme: {
      ...persimmon,
      seed: {
        ...persimmon.seed,
        font: 'Georgia, "Times New Roman", serif',
      },
    },
  });
  const fonts = html.match(/id="cookiebite-fonts">\s*([\s\S]*?)\s*<\/style>/)[1];
  assert.doesNotMatch(fonts, /@font-face/);
  assert.doesNotMatch(fonts, /data:font\/woff2/);
  assert.match(fonts, /body\{font-family:Georgia, "Times New Roman", serif\}/);
});

test('base block is SHELL_CSS only (shadcn border/body moved into cookiebite-tw)', () => {
  const html = assembleDocument({
    ...base,
    twCss: [
      '@layer base{',
      '*,::before{box-sizing:border-box;border-color:var(--border)}',
      'body{background-color:var(--background);color:var(--foreground)}',
      '}',
    ].join(''),
  });
  const baseBlock = html.match(/id="cookiebite-base">\s*([\s\S]*?)\s*<\/style>/)[1];
  assert.doesNotMatch(baseBlock, /border-color:\s*var\(--border\)/);
  assert.match(baseBlock, /data-density="compact"/);
  assert.match(baseBlock, /data-density="spacious"/);
  const twBlock = html.match(/id="cookiebite-tw">\s*([\s\S]*?)\s*<\/style>/)[1];
  assert.match(twBlock, /border-color:\s*var\(--border\)/);
  // assemble order: cookiebite-base before cookiebite-tw so preflight+override in tw win
  assert.ok(html.indexOf('cookiebite-base') < html.indexOf('cookiebite-tw'));
});

test('root div wraps markup and precedes the app script', () => {
  const html = assembleDocument(base);
  const rootIdx = html.indexOf('<div id="root">');
  const appIdx = html.indexOf('id="cookiebite-app"');
  assert.ok(rootIdx > 0 && appIdx > rootIdx);
  assert.match(html, /<div id="root"><h1>제목<\/h1><\/div>/);
});

test('lang is attribute-escaped so it cannot inject markup', () => {
  const html = assembleDocument({ ...base, lang: 'ko" onload="x' });
  assert.doesNotMatch(html, /<html lang="ko" onload="x">/);
  assert.match(html, /<html lang="ko&quot; onload=&quot;x">/);
});
