import { BASE_CSS } from './tw-compile.mjs';

// shell/controls.tsx 상수와 동일 리터럴 (FOUC boot이 React보다 먼저 실행)
const THEME_STORAGE_KEY = 'cookiebite-theme';
const DENSITY_STORAGE_KEY = 'cookiebite-density';
const SHELL_CSS =
  ':root[data-density="compact"]{--spacing:0.2rem}:root[data-density="spacious"]{--spacing:0.3rem}@media print{[data-page].hidden{display:block!important}}';

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** localStorage → .dark / data-density 선적용 (paint 전). */
function buildBootScript() {
  return `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="dark")document.documentElement.classList.add("dark");var d=localStorage.getItem(${JSON.stringify(DENSITY_STORAGE_KEY)});if(d==="compact"||d==="comfortable"||d==="spacious")document.documentElement.setAttribute("data-density",d);}catch(e){}})();`;
}

/**
 * 구 assemble의 폰트 경로: theme.seed.font → CSS font-family.
 * 외부 stylesheet link는 오프라인 계약상 방출하지 않는다.
 */
function buildFontsCss(theme) {
  const family = theme?.seed?.font ?? 'system-ui, sans-serif';
  return `body{font-family:${family}}`;
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
  const baseCss = `${BASE_CSS}${SHELL_CSS}`;
  const twBlock = twCss
    ? `\n  <style id="cookiebite-tw">\n${twCss}\n  </style>`
    : '';

  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
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
