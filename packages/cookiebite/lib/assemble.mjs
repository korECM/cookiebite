import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { CookiebiteTheme } = require(path.join(pkgRoot, 'vendor/theme-compiler.cjs'));
const pkg = JSON.parse(readFileSync(path.join(pkgRoot, 'package.json'), 'utf8'));
const CORE_CSS = readFileSync(path.join(pkgRoot, 'vendor/core/cookiebite-core.css'), 'utf8');
const CORE_JS = readFileSync(path.join(pkgRoot, 'vendor/core/cookiebite-core.js'), 'utf8');
// Core boot() calls window.CookiebiteTheme.compile at runtime, so the browser
// theme compiler must load before core JS or CB never comes up (and declared
// capabilities never wire onto their hosts).
const THEME_COMPILER_JS = readFileSync(path.join(pkgRoot, 'vendor/theme-compiler.cjs'), 'utf8');

// assemble이 항상 방출하는 TSX 리포트 전역 규칙 (vendored core CSS 뒤, components CSS 앞).
// 한국어 본문에서 조사가 단어와 갈라지지 않도록 keep-all로 어절 단위 줄바꿈을 강제하고,
// 끊을 수 없는 긴 토큰(URL 등)만 overflow-wrap으로 흘린다. core CSS는 drift 가드라 건드리지 않는다.
const TSX_CSS = `main { word-break: keep-all; overflow-wrap: anywhere; }`;

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function scriptSafeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function defaultRenderCall(method) {
  return (call) =>
    `window.CB.${method}(document.getElementById(${scriptSafeJson(call.hostId)}), ${scriptSafeJson(call.options)});`;
}

const RESOURCE_TAGS = {
  echarts: {
    tag: '<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js"></script>',
    version: ['echarts', '5.5.1'],
  },
};

const CAPABILITY_META = {
  table: { method: 'sortable', resources: [], renderCall: defaultRenderCall('sortable') },
  glossary: { method: 'glossary', resources: [], renderCall: defaultRenderCall('glossary') },
  chart: {
    method: 'chart',
    resources: ['echarts'],
    renderCall(call) {
      const { light, dark, data, ariaLabel } = call.options;
      const optionExpr =
        JSON.stringify(light) === JSON.stringify(dark)
          ? scriptSafeJson(light)
          : `function () { return document.documentElement.getAttribute('data-theme') === 'dark' ? ${scriptSafeJson(dark)} : ${scriptSafeJson(light)}; }`;
      return [
        `window.CB.chart(document.getElementById(${scriptSafeJson(call.hostId)}), {`,
        `  option: ${optionExpr},`,
        `  data: ${scriptSafeJson(data)},`,
        `  ariaLabel: ${scriptSafeJson(ariaLabel)},`,
        `});`,
      ].join('\n');
    },
  },
};

export function assembleDocument({ markup, theme, title, lang, collected }) {
  const { calls = [], css: componentCss = '' } = collected ?? {};
  const capabilities = [...new Set(calls.map((c) => c.capability))].sort();
  for (const c of capabilities) {
    if (!CAPABILITY_META[c]) throw new Error(`unknown capability '${c}'`);
  }

  const compiled = CookiebiteTheme.compile(theme);
  let themeCss = compiled.css;
  if (compiled.dark) {
    // CB.theme.set('dark')가 토글하는 루트 속성에 다크 토큰을 스코프한다.
    themeCss += `\n${compiled.dark.css.replace(':root {', ':root[data-theme="dark"] {')}`;
  }
  const fontLinks = (compiled.resources?.fontStylesheets ?? [])
    .map((href) => `  <link rel="stylesheet" href="${href}">`)
    .join('\n');

  const externalResources = [...new Set(capabilities.flatMap((c) => CAPABILITY_META[c].resources))];
  const resourceTags = externalResources
    .map((name) => {
      const meta = RESOURCE_TAGS[name];
      if (!meta) throw new Error(`unknown resource '${name}'`);
      return `  ${meta.tag}`;
    })
    .join('\n');

  const useMarker = `<!-- COOKIEBITE:USE${capabilities.length ? ` ${capabilities.join(' ')}` : ''} -->`;
  const componentsCssBlock = componentCss
    ? `\n  <style id="cookiebite-components-css">\n${componentCss}\n  </style>`
    : '';
  const moduleBlocks = capabilities
    .map(
      (c) =>
        `<script id="cookiebite-module-${c}">\n${readFileSync(path.join(pkgRoot, `vendor/capabilities/${c}.js`), 'utf8')}\n</script>`,
    )
    .join('\n');
  const reportScript = calls.length
    ? `<script id="cookiebite-report-script">
(function init() {
  if (!window.CB) { window.addEventListener('cookiebite:core-ready', init, { once: true }); return; }
${calls
  .map(
    (c) =>
      `  try {\n    ${CAPABILITY_META[c.capability].renderCall(c)}\n  } catch (error) {\n    console.error('cookiebite capability failed:', error);\n  }`,
  )
  .join('\n')}
}());
</script>`
    : '';

  const versions = { cookiebite: pkg.version };
  for (const name of externalResources) {
    const [key, ver] = RESOURCE_TAGS[name].version;
    versions[key] = ver;
  }
  const summary = {
    schemaVersion: 1,
    mode: 'core',
    declared: capabilities,
    includedModules: capabilities,
    externalResources,
    versions,
  };
  const bodyScripts = [moduleBlocks, reportScript].filter(Boolean).join('\n');
  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <script type="application/json" id="cookiebite-theme">
${CookiebiteTheme.escapeJsonForHtml(theme)}
  </script>
  ${useMarker}
  <style id="cookiebite-theme-css">
${themeCss}
  </style>
${fontLinks}${resourceTags ? `\n${resourceTags}` : ''}
  <style id="cookiebite-core-css">
${CORE_CSS}
  </style>
  <style id="cookiebite-tsx-css">
${TSX_CSS}
  </style>${componentsCssBlock}
</head>
<body>
${markup}
<script type="application/json" id="cookiebite-dependency-summary">
${JSON.stringify(summary)}
</script>
<script id="cookiebite-theme-compiler">
${THEME_COMPILER_JS}
</script>
<script id="cookiebite-core-js">
${CORE_JS}
</script>${bodyScripts ? `\n${bodyScripts}` : ''}
</body>
</html>
`;
}
