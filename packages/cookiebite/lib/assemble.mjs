import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE_CSS } from './tw-compile.mjs';

// shell/controls.tsx 상수와 동일 리터럴 (FOUC boot이 React보다 먼저 실행)
const THEME_STORAGE_KEY = 'cookiebite-theme';
const DENSITY_STORAGE_KEY = 'cookiebite-density';
const SHELL_CSS =
  ':root[data-density="compact"]{--spacing:0.2rem}:root[data-density="spacious"]{--spacing:0.3rem}@media print{[data-page].hidden{display:block!important}}';

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE_VERSION = JSON.parse(
  readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8'),
).version;
const PRETENDARD_WOFF2 = join(
  PACKAGE_ROOT,
  'assets',
  'PretendardVariable.subset.woff2',
);

/** @type {string | undefined} */
let pretendardBase64Cache;

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** localStorage → .dark / data-density 선적용 (paint 전) + version stamp (1회). */
function buildBootScript() {
  const versionLine = `cookiebite ${PACKAGE_VERSION} — https://github.com/korECM/cookiebite`;
  return `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="dark")document.documentElement.classList.add("dark");var d=localStorage.getItem(${JSON.stringify(DENSITY_STORAGE_KEY)});if(d==="compact"||d==="comfortable"||d==="spacious")document.documentElement.setAttribute("data-density",d);}catch(e){}})();(function(){if(globalThis.__COOKIEBITE_VLOG__)return;globalThis.__COOKIEBITE_VLOG__=1;console.info(${JSON.stringify(versionLine)});})();`;
}

function loadPretendardBase64() {
  if (pretendardBase64Cache === undefined) {
    pretendardBase64Cache = readFileSync(PRETENDARD_WOFF2).toString('base64');
  }
  return pretendardBase64Cache;
}

/**
 * CSS font-family 스택의 첫 family (따옴표 제거).
 * @param {string} stack
 */
function firstFontFamily(stack) {
  const raw = String(stack).split(',')[0]?.trim() ?? '';
  return raw.replace(/^['"]|['"]$/g, '');
}

/**
 * Embed Pretendard Variable only when the resolved stack's first family is
 * Pretendard-ish (default presets). Custom seeds that lead with another family
 * skip embedding — their font, their look.
 * @param {string} family
 */
function isPretendardish(family) {
  return /^pretendard(\s+variable)?$/i.test(family);
}

/**
 * 구 assemble의 폰트 경로: theme.seed.font → CSS font-family.
 * 외부 stylesheet link는 오프라인 계약상 방출하지 않는다.
 * Pretendard 계열 첫 family일 때만 subset woff2를 data URI로 내장한다.
 */
function buildFontsCss(theme) {
  const family = theme?.seed?.font ?? 'system-ui, sans-serif';
  const first = firstFontFamily(family);
  if (!isPretendardish(first)) {
    return `body{font-family:${family}}`;
  }

  const b64 = loadPretendardBase64();
  // Seed already leading with Variable — use as-is; otherwise prepend.
  const stack = /^pretendard\s+variable$/i.test(first)
    ? family
    : `'Pretendard Variable',${family}`;
  return [
    `@font-face{font-family:'Pretendard Variable';font-weight:45 920;font-style:normal;font-display:swap;src:url(data:font/woff2;base64,${b64}) format('woff2-variations')}`,
    `body{font-family:${stack}}`,
  ].join('');
}

/**
 * @param {{
 *   markup: string,
 *   themeCss: string,
 *   twCss?: string,
 *   clientJs: string,
 *   title: string,
 *   theme?: { seed?: { font?: string } },
 *   lang?: string,
 * }} opts
 */
export function assembleDocument({
  markup,
  themeCss,
  twCss = '',
  clientJs,
  title,
  theme,
  lang = 'ko',
}) {
  const fontsCss = buildFontsCss(theme);
  // BASE_CSS는 비어 있음(shadcn border/body는 cookiebite-tw @layer base). SHELL_CSS만.
  const baseCss = `${BASE_CSS}${SHELL_CSS}`;
  const twBlock = twCss
    ? `\n  <style id="cookiebite-tw">\n${twCss}\n  </style>`
    : '';

  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="generator" content="cookiebite ${escapeHtml(PACKAGE_VERSION)}">
  <title>${escapeHtml(title)}</title>
  <script id="cookiebite-boot">${buildBootScript()}</script>
  <style id="cookiebite-theme">
${themeCss}
  </style>
  <style id="cookiebite-fonts">
${fontsCss}
  </style>
  <style id="cookiebite-base">
${baseCss}
  </style>${twBlock}
</head>
<body>
  <div id="root">${markup}</div>
  <script id="cookiebite-app">
${clientJs}
  </script>
</body>
</html>
`;
}
