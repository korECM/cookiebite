import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileChartOptions } from '../lib/chart-compile.mjs';
import { persimmon } from '../src/themes.ts';

const ECHARTS_DEFAULT_PALETTE =
  /#5470c6|#91cc75|#fac858|#ee6666|#73c0de|#3ba272|#fc8452|#9a60b4|#ea7ccc/i;

const data = [
  { rule: 'geo-block', count: 120 }, { rule: 'rate-limit', count: 75 }, { rule: 'ja4-block', count: 30 },
];
const semanticTypes = { rule: 'Category', count: 'Quantity' };

const barSpec = {
  type: 'Bar Chart',
  data,
  semanticTypes,
  encodings: { x: 'rule', y: 'count' },
};

const lineSpec = {
  type: 'Line Chart',
  data,
  semanticTypes,
  encodings: { x: 'rule', y: 'count' },
};

const pieSpec = {
  type: 'Pie Chart',
  data,
  semanticTypes,
  encodings: { color: 'rule', size: 'count' },
};

function assertNoDefaultPalette(option) {
  assert.doesNotMatch(JSON.stringify(option), ECHARTS_DEFAULT_PALETTE);
}

function assertFunctionFree(option) {
  assert.deepEqual(JSON.parse(JSON.stringify(option)), option);
}

test('compiled options are json-safe with theme palette injected', () => {
  const { light, dark } = compileChartOptions(barSpec, persimmon);
  assert.equal(light.series[0].type, 'bar');
  // flint 기본 팔레트가 남아 있으면 실패
  assertNoDefaultPalette(light);
  // 팔레트 선두는 테마 accent
  assert.equal(light.color[0].toUpperCase(), '#FA4D02');
  // 함수와 _ 메타 키가 제거되어 라운드트립이 무손실
  assertFunctionFree(light);
  assert.equal(Object.keys(light).some((k) => k.startsWith('_')), false);
  // dark: persimmon은 dark 미선언 → light와 동일
  assert.deepEqual(dark, light);
});

test('Line Chart options reject default palette and stay function-free', () => {
  const { light } = compileChartOptions(lineSpec, persimmon);
  assert.equal(light.series[0].type, 'line');
  assertNoDefaultPalette(light);
  assertFunctionFree(light);
});

test('Pie Chart options reject default palette and stay function-free', () => {
  const { light } = compileChartOptions(pieSpec, persimmon);
  assert.equal(light.series[0].type, 'pie');
  assertNoDefaultPalette(light);
  assertFunctionFree(light);
});

test('a dark-declaring theme yields distinct dark colors', () => {
  const themed = { ...persimmon, dark: { background: '#111111', text: '#EDEDED' } };
  const { light, dark } = compileChartOptions(barSpec, themed);
  assert.notDeepEqual(dark.textStyle, light.textStyle);
});
