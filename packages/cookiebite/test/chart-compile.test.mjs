import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ChartCompileError, compileChartOptions } from '../lib/chart-compile.mjs';
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

const HEX = /^#[0-9A-Fa-f]{6}$/;

test('compiled options are json-safe with theme palette injected', () => {
  const { light, dark } = compileChartOptions(barSpec, persimmon);
  assert.equal(light.series[0].type, 'bar');
  // flint 기본 팔레트가 남아 있으면 실패
  assertNoDefaultPalette(light);
  // 팔레트 선두는 테마 accent
  assert.equal(light.color[0].toUpperCase(), '#FA4D02');
  // 8색 ramp: 전부 유효 hex, 인접 색이 서로 다름
  assert.equal(light.color.length, 8);
  for (const c of light.color) assert.match(c, HEX);
  for (let i = 1; i < light.color.length; i++) {
    assert.notEqual(light.color[i].toUpperCase(), light.color[i - 1].toUpperCase());
  }
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

test('axis raw field names are stripped so they cannot collide with rotated labels', () => {
  const { light } = compileChartOptions(barSpec, persimmon);
  const axisOf = (a) => (Array.isArray(a) ? a[0] : a);
  assert.equal('name' in axisOf(light.xAxis), false);
  assert.equal('name' in axisOf(light.yAxis), false);
});

test('Funnel Chart sizes segments by the real measure, not flint 1-per-row', () => {
  const funnelSpec = {
    type: 'Funnel Chart',
    data: [
      { stage: '방문', count: 48200 },
      { stage: '가입', count: 6140 },
      { stage: '활성화', count: 3830 },
    ],
    semanticTypes: { stage: 'Category', count: 'Quantity' },
    encodings: { x: 'stage', y: 'count' },
  };
  const { light } = compileChartOptions(funnelSpec, persimmon);
  const series = light.series.find((s) => s.type === 'funnel');
  assert.ok(series, 'expected a funnel series');
  // name은 카테고리, value는 측정값 — flint의 name=측정값/value=1 인코딩을 바로잡는다.
  assert.deepEqual(
    series.data.map((d) => [d.name, d.value]),
    [['방문', 48200], ['가입', 6140], ['활성화', 3830]],
  );
  // 정체불명 value:1 잔재가 없어야 한다.
  assert.equal(series.data.some((d) => d.value === 1), false);
  // data[] 항목별 기본 팔레트 색도 지워져 option.color로 칠한다.
  assertNoDefaultPalette(light);
  assertFunctionFree(light);
  if (light.legend && Array.isArray(light.legend.data)) {
    assert.deepEqual(light.legend.data, ['방문', '가입', '활성화']);
  }
});

test('Waterfall Chart (custom series) is rejected at compile time', () => {
  const waterfallSpec = {
    type: 'Waterfall Chart',
    data: [
      { stage: '시작', value: 100 },
      { stage: '증가', value: 30 },
      { stage: '감소', value: -20 },
    ],
    semanticTypes: { stage: 'Category', value: 'Quantity' },
    encodings: { x: 'stage', y: 'value' },
  };
  assert.throws(
    () => compileChartOptions(waterfallSpec, persimmon),
    (err) => {
      assert.ok(err instanceof ChartCompileError);
      assert.match(err.message, /Waterfall Chart/);
      assert.match(err.message, /선언형/);
      return true;
    },
  );
});
