/**
 * seed(+optional overrides) → shadcn CSS 변수 세트 (`:root` + `.dark`).
 * 대비 게이트 실패 시 Error(쌍 이름 + 실측 비율).
 */

const SHADCN_COLOR_VARS = [
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--accent',
  '--accent-foreground',
  '--destructive',
  '--success',
  '--success-foreground',
  '--border',
  '--input',
  '--ring',
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
];

const CONTRAST_GATES = [
  { fg: '--foreground', bg: '--background', min: 4.5 },
  { fg: '--primary-foreground', bg: '--primary', min: 4.5 },
  { fg: '--card-foreground', bg: '--card', min: 4.5 },
  { fg: '--muted-foreground', bg: '--muted', min: 3.0 },
  { fg: '--success', bg: '--card', min: 3.0 },
  // 차트 시리즈도 카드 위에 얹히는 색이다. 게이트가 없던 동안 노랑 계열이
  // 1.4:1로 통과해 범례 점이 보이지 않는 리포트가 나갔다.
  { fg: '--chart-1', bg: '--card', min: 3.0 },
  { fg: '--chart-2', bg: '--card', min: 3.0 },
  { fg: '--chart-3', bg: '--card', min: 3.0 },
  { fg: '--chart-4', bg: '--card', min: 3.0 },
  { fg: '--chart-5', bg: '--card', min: 3.0 },
];

// --- deriveDarkSeed (구 resolve-theme에서 이식) ---

const DARK_BACKGROUND = '#111114';
const DARK_TEXT = '#EDEDEF';

function deriveDarkMix(first, second, amount) {
  const a = parseHex(first);
  const b = parseHex(second);
  return toHex(a.map((value, index) => value + (b[index] - value) * amount));
}

function deriveDarkContrast(a, b) {
  const L1 = luminanceFromRgb(parseHex(a));
  const L2 = luminanceFromRgb(parseHex(b));
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

/** accent-strong = mix(accent, #000, 0.17)이 dark bg에서 4.5:1을 넘도록 밝힌다. */
function liftAccentForDark(accent, background) {
  let current = accent.toUpperCase();
  for (let i = 0; i < 40; i += 1) {
    const strong = deriveDarkMix(current, '#000000', 0.17);
    if (deriveDarkContrast(strong, background) >= 4.5) return current;
    current = deriveDarkMix(current, '#FFFFFF', 0.05);
  }
  return current;
}

/** @param {{ accent: string }} seed */
export function deriveDarkSeed(seed) {
  return {
    background: DARK_BACKGROUND,
    text: DARK_TEXT,
    accent: liftAccentForDark(seed.accent, DARK_BACKGROUND),
    surface: 'tonal',
  };
}

// --- sRGB helpers (theme-compiler와 동일 산식) ---

function parseHex(hex) {
  const h = hex.replace(/^#/, '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16));
}

function toHex(rgb) {
  return `#${rgb
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

function mix(first, second, amount) {
  const a = parseHex(normalizeToHex(first));
  const b = parseHex(normalizeToHex(second));
  return toHex(a.map((value, index) => value + (b[index] - value) * amount));
}

function luminanceFromRgb(rgb) {
  const channel = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2];
}

function contrastRatio(a, b) {
  const L1 = luminanceFromRgb(colorToRgb(a));
  const L2 = luminanceFromRgb(colorToRgb(b));
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

function onAccent(accent, text) {
  if (contrastRatio(text, accent) >= 4.5) return normalizeToHex(text).toUpperCase();
  const white = '#FFFFFF';
  const black = '#000000';
  return contrastRatio(white, accent) >= contrastRatio(black, accent) ? white : black;
}

// --- color string → sRGB (hex / rgb() / hsl() / oklch()) ---

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function parseNumberList(inner) {
  return inner
    .trim()
    .replace(/\//g, ' ')
    .split(/[\s,]+/)
    .filter(Boolean);
}

function parseCssNumber(token, { percentOf = 1, angle = false } = {}) {
  const t = token.trim().toLowerCase();
  if (t.endsWith('%')) return (Number.parseFloat(t) / 100) * percentOf;
  if (angle && t.endsWith('deg')) return Number.parseFloat(t);
  if (angle && t.endsWith('rad')) return (Number.parseFloat(t) * 180) / Math.PI;
  if (angle && t.endsWith('turn')) return Number.parseFloat(t) * 360;
  return Number.parseFloat(t);
}

function hslToRgb(h, s, l) {
  const S = clamp01(s);
  const L = clamp01(l);
  const C = (1 - Math.abs(2 * L - 1)) * S;
  const Hp = (((h % 360) + 360) % 360) / 60;
  const X = C * (1 - Math.abs((Hp % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (Hp >= 0 && Hp < 1) [r1, g1, b1] = [C, X, 0];
  else if (Hp < 2) [r1, g1, b1] = [X, C, 0];
  else if (Hp < 3) [r1, g1, b1] = [0, C, X];
  else if (Hp < 4) [r1, g1, b1] = [0, X, C];
  else if (Hp < 5) [r1, g1, b1] = [X, 0, C];
  else [r1, g1, b1] = [C, 0, X];
  const m = L - C / 2;
  return [(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255];
}

function rgbToHsl(rgb) {
  const [r, g, b] = rgb.map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

/** OKLCH → linear sRGB (Björn Ottosson). L in 0–1, C unbounded, H in degrees. */
function oklchToRgb(L, C, H) {
  const hRad = (((H % 360) + 360) % 360) * (Math.PI / 180);
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const toSrgb = (v) => {
    const c = Math.max(0, Math.min(1, v));
    return (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055) * 255;
  };
  return [toSrgb(rLin), toSrgb(gLin), toSrgb(bLin)];
}

function colorToRgb(value) {
  const raw = String(value).trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) return parseHex(raw);

  const rgbMatch = raw.match(/^rgba?\(\s*(.+)\s*\)$/i);
  if (rgbMatch) {
    const parts = parseNumberList(rgbMatch[1]);
    return [
      parseCssNumber(parts[0], { percentOf: 255 }),
      parseCssNumber(parts[1], { percentOf: 255 }),
      parseCssNumber(parts[2], { percentOf: 255 }),
    ];
  }

  const hslMatch = raw.match(/^hsla?\(\s*(.+)\s*\)$/i);
  if (hslMatch) {
    const parts = parseNumberList(hslMatch[1]);
    const h = parseCssNumber(parts[0], { angle: true });
    const s = parseCssNumber(parts[1], { percentOf: 1 });
    const l = parseCssNumber(parts[2], { percentOf: 1 });
    return hslToRgb(h, s, l);
  }

  const oklchMatch = raw.match(/^oklch\(\s*(.+)\s*\)$/i);
  if (oklchMatch) {
    const parts = parseNumberList(oklchMatch[1]);
    let L = parseCssNumber(parts[0], { percentOf: 1 });
    // 일부 작성은 L을 0–100으로 둠
    if (L > 1) L /= 100;
    const C = Number.parseFloat(parts[1]);
    const H = parseCssNumber(parts[2], { angle: true });
    return oklchToRgb(L, C, H);
  }

  throw new Error(`unsupported color format for contrast: ${value}`);
}

function normalizeToHex(value) {
  const raw = String(value).trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) {
    const rgb = parseHex(raw);
    return toHex(rgb);
  }
  return toHex(colorToRgb(raw));
}

// --- seed → shadcn vars ---

function resolveDarkSeed(seed, darkPartial) {
  if (darkPartial !== undefined) return { ...seed, ...darkPartial };
  return { ...seed, ...deriveDarkSeed(seed) };
}

/**
 * Theme-tuned green for deltas/status. Starts at hsl(152 60% 36%) light /
 * hsl(152 55% 55%) dark, then nudges lightness until success-on-card ≥ 3.0.
 */
function deriveSuccess(card, mode) {
  const h = 152;
  const s = mode === 'dark' ? 0.55 : 0.6;
  let l = mode === 'dark' ? 0.55 : 0.36;
  let color = toHex(hslToRgb(h, s, l));
  for (let i = 0; i < 40; i += 1) {
    if (contrastRatio(color, card) >= 3.0) return color;
    l = mode === 'dark' ? Math.min(0.85, l + 0.02) : Math.max(0.12, l - 0.02);
    color = toHex(hslToRgb(h, s, l));
  }
  return color;
}

function deriveDestructive(accent, mode) {
  const [h, s, l] = rgbToHsl(parseHex(normalizeToHex(accent)));
  // accent 채도·명도를 유지하되 hue를 빨강(0°) 쪽으로 끌어 destructive 역할
  const delta = ((0 - h + 540) % 360) - 180;
  const hue = (h + delta * 0.85 + 360) % 360;
  const sat = Math.max(0.55, Math.min(0.85, s + 0.15));
  const light =
    mode === 'dark'
      ? Math.max(0.45, Math.min(0.62, l + 0.1))
      : Math.max(0.4, Math.min(0.55, l * 0.85 + 0.15));
  return toHex(hslToRgb(hue, sat, light));
}

/** 차트 슬롯이 카드 위에서 가질 대비의 허용 범위. accent 자신의 대비를 목표로 삼되 이 안으로 재운다. */
const CHART_CONTRAST_FLOOR = 3.2;
const CHART_CONTRAST_CEIL = 5.5;

/**
 * 주어진 hue/sat에서 카드 대비가 target에 가장 가까워지는 HSL 명도를 이분 탐색한다.
 * 라이트 모드는 명도가 오르면 대비가 내려가고, 다크 모드는 반대라 방향을 뒤집는다.
 */
function tuneToContrast(hue, sat, card, target, mode) {
  let lo = 0.04;
  let hi = 0.96;
  let color = toHex(hslToRgb(hue, sat, 0.5));
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    color = toHex(hslToRgb(hue, sat, mid));
    const tooStrong = contrastRatio(color, card) > target;
    if (mode === 'dark') {
      if (tooStrong) hi = mid;
      else lo = mid;
    } else if (tooStrong) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return color;
}

/**
 * accent 기준 hue 회전 → chart-1..5.
 *
 * HSL 명도는 지각 명도가 아니다. 같은 L=0.5에서도 노랑은 상대휘도 0.71, 파랑은 0.20이라
 * 슬롯을 고정 명도로 찍으면 노랑이 흰 카드에서 1.4:1까지 떨어지고 5시리즈 무게가 흐트러진다.
 * 그래서 슬롯마다 명도를 탐색해 **카드 대비를 하나의 목표값으로 맞춘다**. 목표값은 accent
 * 자신의 대비라, chart-1은 브랜드 색 그대로 남고 나머지가 거기에 맞춰 따라온다.
 */
function chartHarmony(accent, card, mode) {
  const [h, s] = rgbToHsl(parseHex(normalizeToHex(accent)));
  const rotations = [0, 40, 160, 200, 280];
  const sat =
    mode === 'dark'
      ? Math.max(0.45, Math.min(0.75, s * 0.9 + 0.15))
      : Math.max(0.4, Math.min(0.8, s * 0.85 + 0.2));
  const target = Math.max(
    CHART_CONTRAST_FLOOR,
    Math.min(CHART_CONTRAST_CEIL, contrastRatio(normalizeToHex(accent), card)),
  );
  return rotations.map((rot) => tuneToContrast((h + rot) % 360, sat, card, target, mode));
}

function compileBlock(seed, mode) {
  const seedBg = normalizeToHex(seed.background).toUpperCase();
  const foreground = normalizeToHex(seed.text).toUpperCase();
  const primary = normalizeToHex(seed.accent).toUpperCase();
  const primaryFg = onAccent(primary, foreground);

  // Stripe editorial layering: page tint ≠ card. Light cards float on a
  // subtle gray page; dark cards lift slightly off the page background.
  let background;
  let card;
  let popover;
  if (mode === 'light') {
    background = mix(seedBg, foreground, 0.03);
    card = seedBg;
    popover = seedBg;
  } else {
    background = seedBg;
    card = mix(seedBg, '#FFFFFF', 0.045);
    popover = card;
  }

  const cardFg = foreground;
  const popoverFg = foreground;
  const muted = mix(background, foreground, mode === 'dark' ? 0.1 : 0.06);
  const mutedFg = mix(foreground, background, 0.34);
  const secondary = mix(background, foreground, mode === 'dark' ? 0.14 : 0.09);
  const secondaryFg = foreground;
  const accent = mix(background, primary, mode === 'dark' ? 0.22 : 0.12);
  const accentFg = contrastRatio(foreground, accent) >= 4.5 ? foreground : onAccent(accent, foreground);
  const destructive = deriveDestructive(primary, mode);
  const success = deriveSuccess(card, mode);
  const successFg = onAccent(success, foreground);
  const border = mix(foreground, background, 0.85);
  const input = border;
  const ring = primary;
  const charts = chartHarmony(primary, card, mode);

  /** @type {Record<string, string>} */
  const vars = {
    '--background': background,
    '--foreground': foreground,
    '--card': card,
    '--card-foreground': cardFg,
    '--popover': popover,
    '--popover-foreground': popoverFg,
    '--primary': primary,
    '--primary-foreground': primaryFg,
    '--secondary': secondary,
    '--secondary-foreground': secondaryFg,
    '--muted': muted,
    '--muted-foreground': mutedFg,
    '--accent': accent,
    '--accent-foreground': accentFg,
    '--destructive': destructive,
    '--success': success,
    '--success-foreground': successFg,
    '--border': border,
    '--input': input,
    '--ring': ring,
    '--radius': `${seed.radius}px`,
    '--chart-1': charts[0],
    '--chart-2': charts[1],
    '--chart-3': charts[2],
    '--chart-4': charts[3],
    '--chart-5': charts[4],
  };
  return vars;
}

function assertContrastGates(vars, label) {
  for (const { fg, bg, min } of CONTRAST_GATES) {
    const ratio = contrastRatio(vars[fg], vars[bg]);
    if (ratio < min) {
      throw new Error(
        `contrast gate failed (${label}): ${fg}/${bg} = ${ratio.toFixed(2)}:1 < ${min}:1`,
      );
    }
  }
}

function applyOverrides(vars, patch) {
  if (!patch || typeof patch !== 'object') return vars;
  const next = { ...vars };
  for (const [key, value] of Object.entries(patch)) {
    if (key === '.dark') continue;
    if (typeof value === 'string') next[key] = value;
  }
  return next;
}

/** 카드가 바뀐 뒤 저자가 덮지 않은 chart 슬롯만 새 카드 기준으로 재파생한다. */
function retuneCharts(vars, patch, mode) {
  const authored = (n) => typeof patch?.[`--chart-${n}`] === 'string';
  if ([1, 2, 3, 4, 5].every(authored)) return;
  const charts = chartHarmony(vars['--primary'], vars['--card'], mode);
  for (const n of [1, 2, 3, 4, 5]) {
    if (!authored(n)) vars[`--chart-${n}`] = charts[n - 1];
  }
}

function formatBlock(selector, vars) {
  const body = Object.entries(vars)
    .map(([name, value]) => `${name}:${value}`)
    .join(';');
  return `${selector}{${body}}`;
}

/**
 * @param {{
 *   seed: import('../src/themes.ts').ThemeSeed,
 *   dark?: Partial<import('../src/themes.ts').ThemeSeed>,
 *   overrides?: Record<string, string> & { '.dark'?: Record<string, string> },
 * }} theme
 * @returns {{ css: string, warnings: string[] }}
 */
export function compileTheme(theme) {
  if (!theme?.seed) throw new Error('compileTheme: theme.seed is required');

  const warnings = [];
  const lightSeed = theme.seed;
  const darkSeed = resolveDarkSeed(theme.seed, theme.dark);
  if (theme.dark === undefined) {
    warnings.push('dark seed derived via deriveDarkSeed');
  }

  let light = compileBlock(lightSeed, 'light');
  let dark = compileBlock(darkSeed, 'dark');

  assertContrastGates(light, 'light');
  assertContrastGates(dark, 'dark');

  const overrides = theme.overrides;
  if (overrides) {
    const { '.dark': darkPatch, ...rootPatch } = overrides;
    light = applyOverrides(light, rootPatch);
    dark = applyOverrides(dark, darkPatch);
    // card override can invalidate success-on-card; retune unless author set --success
    if (typeof rootPatch?.['--success'] !== 'string') {
      light['--success'] = deriveSuccess(light['--card'], 'light');
      if (typeof rootPatch?.['--success-foreground'] !== 'string') {
        light['--success-foreground'] = onAccent(light['--success'], light['--foreground']);
      }
    }
    if (typeof darkPatch?.['--success'] !== 'string') {
      dark['--success'] = deriveSuccess(dark['--card'], 'dark');
      if (typeof darkPatch?.['--success-foreground'] !== 'string') {
        dark['--success-foreground'] = onAccent(dark['--success'], dark['--foreground']);
      }
    }
    // success와 같은 이유로 차트도 카드 위에 얹힌다. 저자가 직접 덮지 않은 슬롯만 새 카드
    // 기준으로 다시 파생한다 — 덮은 슬롯은 그대로 두고 게이트에서 판정한다.
    retuneCharts(light, rootPatch, 'light');
    retuneCharts(dark, darkPatch, 'dark');
    // root overrides는 :root만; 다크에 같은 키를 덮지 않음 (스펙: `.dark` 키가 다크 패치)
    assertContrastGates(light, 'light after overrides');
    assertContrastGates(dark, 'dark after overrides');
  }

  // 출력 순서 고정 (가독성·스냅샷 안정)
  const order = [...SHADCN_COLOR_VARS, '--radius'];
  const sortVars = (vars) => {
    const out = {};
    for (const key of order) {
      if (key in vars) out[key] = vars[key];
    }
    for (const [key, value] of Object.entries(vars)) {
      if (!(key in out)) out[key] = value;
    }
    return out;
  };

  const css = `${formatBlock(':root', sortVars(light))}\n${formatBlock('.dark', sortVars(dark))}`;
  return { css, warnings };
}

export { contrastRatio as contrast, colorToRgb };
