import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// render.mjs esbuild가 번들할 때 __COOKIEBITE_PKG_ROOT__를 주입한다.
// 직접 import(테스트) 시에는 이 파일 위치 기준으로 패키지 루트를 잡는다.
const pkgRoot =
  typeof __COOKIEBITE_PKG_ROOT__ === 'string'
    ? __COOKIEBITE_PKG_ROOT__
    : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(pkgRoot, 'package.json'));
const { assembleECharts } = require('flint-chart');
const { CookiebiteTheme } = require(path.join(pkgRoot, 'vendor/theme-compiler.cjs'));

export class ChartCompileError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ChartCompileError';
  }
}

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

function parseHex(hex) {
  const n = hex.replace('#', '');
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}

/** 두 hex의 RGB 채널을 t 비율로 선형 보간한다 (t=0 → a, t=1 → b). */
function mixHex(a, b, t) {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  const ch = (x, y) => Math.round(x + (y - x) * t);
  const hex = (n) => n.toString(16).padStart(2, '0').toUpperCase();
  return `#${hex(ch(ar, br))}${hex(ch(ag, bg))}${hex(ch(ab, bb))}`;
}

function injectPalette(option, tokens) {
  const text = tokens['--cb-text'];
  const muted = tokens['--cb-text-muted'];
  const divider = tokens['--cb-divider'];
  const accent = tokens['--cb-accent'];
  const accentStrong = tokens['--cb-accent-strong'];
  const background = tokens['--cb-background'];
  option.color = [
    accent,
    accentStrong,
    mixHex(accent, background, 0.35),
    mixHex(accent, text, 0.35),
    mixHex(accentStrong, background, 0.5),
    mixHex(accent, background, 0.6),
    mixHex(accent, text, 0.6),
    muted,
  ];
  option.textStyle = { ...(option.textStyle ?? {}), color: text, fontFamily: 'inherit' };
  // flint가 series[].itemStyle.color 또는 data[] 항목별 itemStyle.color에 기본 팔레트 hex를
  // 박아 두면 option.color가 무시된다(예: funnel이 ECharts 기본 5색으로 샘). 둘 다 지운다.
  for (const series of Array.isArray(option.series) ? option.series : []) {
    if (series?.itemStyle && 'color' in series.itemStyle) delete series.itemStyle.color;
    for (const datum of Array.isArray(series?.data) ? series.data : []) {
      if (datum && typeof datum === 'object' && datum.itemStyle && 'color' in datum.itemStyle) {
        delete datum.itemStyle.color;
      }
    }
  }
  for (const axisKey of ['xAxis', 'yAxis']) {
    const axes = Array.isArray(option[axisKey]) ? option[axisKey] : option[axisKey] ? [option[axisKey]] : [];
    for (const axis of axes) {
      // raw 필드명(name)이 차트에 찍혀 회전 라벨과 겹친다. 의미는 ariaLabel/캡션이 진다.
      delete axis.name;
      axis.axisLine = { ...(axis.axisLine ?? {}), lineStyle: { color: divider } };
      axis.axisLabel = { ...(axis.axisLabel ?? {}), color: muted };
      axis.splitLine = { ...(axis.splitLine ?? {}), lineStyle: { color: divider } };
    }
  }
  return option;
}

// flint의 funnel assembler는 카테고리별 행 수를 세어 value를 1로 고정하고 측정값을 name에 넣는다.
// 사전 집계 데이터에선 이 탓에 세그먼트가 모두 같은 크기로 그려지고 라벨에 정체불명 "1"이 붙는다.
// 실제 측정값(Quantity)으로 value를 채우고 name을 카테고리로 바로잡아 진짜 퍼널로 만든다.
function normalizeFunnel(option, spec) {
  const series = Array.isArray(option.series) ? option.series : [];
  if (!series.some((s) => s?.type === 'funnel')) return;
  const fieldOf = (enc) => (typeof enc === 'string' ? enc : enc.field);
  const encodedFields = Object.values(spec.encodings).map(fieldOf);
  const measureField = encodedFields.find((f) => spec.semanticTypes[f] === 'Quantity');
  const categoryField = encodedFields.find((f) => spec.semanticTypes[f] !== 'Quantity');
  if (measureField === undefined || categoryField === undefined) return;
  const rebuilt = spec.data.map((row) => ({ name: String(row[categoryField]), value: row[measureField] }));
  const names = rebuilt.map((d) => d.name);
  for (const s of series) {
    if (s?.type !== 'funnel') continue;
    s.data = rebuilt.map((d) => ({ ...d }));
    // 좁은 하단 조각에서 inside 라벨이 조각을 넘쳐 겹친다 — 항상 바깥에 그린다.
    s.label = { ...(s.label ?? {}), position: 'outside' };
  }
  if (option.legend && Array.isArray(option.legend.data)) option.legend.data = names;
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
      // 기본 width 800: flint 라벨 회전 휴리스틱이 baseSize 폭 기준이라 640이면
      // 한 글자 요일("월","화")까지 세로로 돌린다. 넓게 잡아 불필요한 회전을 막는다.
      baseSize: { width: spec.width ?? 800, height: spec.height ?? 320 },
    },
  };
  const dropped = [];
  const option = injectPalette(sanitize(assembleECharts(input), dropped), tokens);
  normalizeFunnel(option, spec);
  const seriesList = Array.isArray(option.series) ? option.series : [];
  if (seriesList.some((s) => s?.type === 'custom')) {
    throw new ChartCompileError(
      `'${spec.type}' 차트는 함수 기반 렌더러(custom series)를 써서 현재 파이프라인이 지원하지 않습니다 — Bar Chart 등 선언형 타입으로 바꾸세요.`,
    );
  }
  const json = JSON.stringify(option);
  try {
    if (JSON.stringify(JSON.parse(json)) !== json) throw new Error('unstable');
  } catch (error) {
    throw new ChartCompileError(`chart option이 JSON-직렬화 안전하지 않습니다: ${error.message}`);
  }
  return { option, dropped };
}

export function compileChartOptions(spec, themeDocument) {
  const compiled = CookiebiteTheme.compile(themeDocument);
  const lightResult = compileOne(spec, compiled.tokens);
  const darkResult = compiled.dark ? compileOne(spec, compiled.dark.tokens) : lightResult;
  const dropped = [...new Set([...lightResult.dropped, ...darkResult.dropped])];
  return { light: lightResult.option, dark: darkResult.option, dropped };
}
