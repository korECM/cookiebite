import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { assembleECharts } = require('flint-chart');
const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { CookiebiteTheme } = require(path.join(pkgRoot, 'vendor/theme-compiler.cjs'));

export class ChartCompileError extends Error {}

// 함수 값과 `_` 접두 메타 키를 제거한 사본을 만든다. 제거된 함수 경로를 기록한다.
function sanitize(value, dropped, pathName = 'option') {
  if (typeof value === 'function') { dropped.push(pathName); return undefined; }
  if (Array.isArray(value)) return value.map((v, i) => sanitize(v, dropped, `${pathName}[${i}]`)).filter((v) => v !== undefined);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('_')) continue;
      const s = sanitize(v, dropped, `${pathName}.${k}`);
      if (s !== undefined) out[k] = s;
    }
    return out;
  }
  return value;
}

function injectPalette(option, tokens) {
  const text = tokens['--cb-text'];
  const muted = tokens['--cb-text-muted'];
  const divider = tokens['--cb-divider'];
  option.color = [tokens['--cb-accent'], tokens['--cb-accent-strong'], muted, text];
  option.textStyle = { ...(option.textStyle ?? {}), color: text, fontFamily: 'inherit' };
  // flint가 series[].itemStyle.color에 기본 팔레트 hex를 박아 두면 option.color가 무시된다.
  for (const series of Array.isArray(option.series) ? option.series : []) {
    if (series?.itemStyle && 'color' in series.itemStyle) delete series.itemStyle.color;
  }
  for (const axisKey of ['xAxis', 'yAxis']) {
    const axes = Array.isArray(option[axisKey]) ? option[axisKey] : option[axisKey] ? [option[axisKey]] : [];
    for (const axis of axes) {
      axis.axisLine = { ...(axis.axisLine ?? {}), lineStyle: { color: divider } };
      axis.axisLabel = { ...(axis.axisLabel ?? {}), color: muted };
      axis.splitLine = { ...(axis.splitLine ?? {}), lineStyle: { color: divider } };
    }
  }
  return option;
}

function compileOne(spec, tokens) {
  const input = {
    data: { values: spec.data },
    semantic_types: spec.semanticTypes,
    chart_spec: {
      chartType: spec.type,
      encodings: Object.fromEntries(
        Object.entries(spec.encodings).map(([ch, enc]) => [ch, typeof enc === 'string' ? { field: enc } : enc]),
      ),
      baseSize: { width: spec.width ?? 640, height: spec.height ?? 320 },
    },
  };
  const dropped = [];
  const option = injectPalette(sanitize(assembleECharts(input), dropped), tokens);
  const json = JSON.stringify(option);
  try {
    if (JSON.stringify(JSON.parse(json)) !== json) throw new Error('unstable');
  } catch (error) {
    throw new ChartCompileError(`chart option이 JSON-직렬화 안전하지 않습니다: ${error.message}`);
  }
  return option;
}

export function compileChartOptions(spec, themeDocument) {
  const compiled = CookiebiteTheme.compile(themeDocument);
  const light = compileOne(spec, compiled.tokens);
  const dark = compiled.dark ? compileOne(spec, compiled.dark.tokens) : light;
  return { light, dark };
}
