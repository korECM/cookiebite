/**
 * 테마 문서에 dark가 없으면 파생 seed를 채워 반환한다.
 * spaceUnit/measure/radius는 생략 → 컴파일러 dark 머지({ ...seed, ...dark })가 상속.
 * surface는 tonal: border/shadow는 컴파일러가 #FFFFFF surface를 써서 muted 대비가 깨진다.
 * accent는 색조를 유지하되, accent-strong(mix→black 0.17)이 다크 bg에서 4.5:1을
 * 넘도록 필요 시에만 밝힌다 (Findings badge 등).
 */

const DARK_BACKGROUND = '#111114';
const DARK_TEXT = '#EDEDEF';

function parseHex(hex) {
  return [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
}

function toHex(rgb) {
  return `#${rgb
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

function mix(first, second, amount) {
  const a = parseHex(first);
  const b = parseHex(second);
  return toHex(a.map((value, index) => value + (b[index] - value) * amount));
}

function luminance(rgb) {
  const channel = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2];
}

function contrast(a, b) {
  const L1 = luminance(parseHex(a));
  const L2 = luminance(parseHex(b));
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

/** 컴파일러 accent-strong = mix(accent, #000, 0.17)이 dark bg에서 4.5:1을 넘도록 밝힌다. */
function liftAccentForDark(accent, background) {
  let current = accent.toUpperCase();
  for (let i = 0; i < 40; i += 1) {
    const strong = mix(current, '#000000', 0.17);
    if (contrast(strong, background) >= 4.5) return current;
    current = mix(current, '#FFFFFF', 0.05);
  }
  return current;
}

/** @param {import('../src/themes.ts').ThemeSeed} seed */
export function deriveDarkSeed(seed) {
  return {
    background: DARK_BACKGROUND,
    text: DARK_TEXT,
    accent: liftAccentForDark(seed.accent, DARK_BACKGROUND),
    surface: 'tonal',
  };
}

/** @param {import('../src/themes.ts').ThemeDocument} doc */
export function resolveTheme(doc) {
  if (doc.dark !== undefined) return doc;
  return { ...doc, dark: deriveDarkSeed(doc.seed) };
}
