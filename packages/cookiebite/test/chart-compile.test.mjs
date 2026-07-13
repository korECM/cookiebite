import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileChartOptions } from '../lib/chart-compile.mjs';
import { persimmon } from '../src/themes.ts';

const spec = {
  type: 'Bar Chart',
  data: [
    { rule: 'geo-block', count: 120 }, { rule: 'rate-limit', count: 75 }, { rule: 'ja4-block', count: 30 },
  ],
  semanticTypes: { rule: 'Category', count: 'Quantity' },
  encodings: { x: 'rule', y: 'count' },
};

test('compiled options are json-safe with theme palette injected', () => {
  const { light, dark } = compileChartOptions(spec, persimmon);
  assert.equal(light.series[0].type, 'bar');
  // flint 기본 팔레트가 남아 있으면 실패
  assert.doesNotMatch(JSON.stringify(light), /#5470c6/i);
  // 팔레트 선두는 테마 accent
  assert.equal(light.color[0].toUpperCase(), '#FA4D02');
  // 함수와 _ 메타 키가 제거되어 라운드트립이 무손실
  assert.deepEqual(JSON.parse(JSON.stringify(light)), light);
  assert.equal(Object.keys(light).some((k) => k.startsWith('_')), false);
  // dark: persimmon은 dark 미선언 → light와 동일
  assert.deepEqual(dark, light);
});

test('a dark-declaring theme yields distinct dark colors', () => {
  const themed = { ...persimmon, dark: { background: '#111111', text: '#EDEDED' } };
  const { light, dark } = compileChartOptions(spec, themed);
  assert.notDeepEqual(dark.textStyle, light.textStyle);
});
