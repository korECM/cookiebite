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

function escapeHtml(text) {
  return String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export function assembleDocument({ markup, theme, title, lang }) {
  const compiled = CookiebiteTheme.compile(theme);
  let themeCss = compiled.css;
  if (compiled.dark) {
    // CB.theme.set('dark')가 토글하는 루트 속성에 다크 토큰을 스코프한다.
    themeCss += `\n${compiled.dark.css.replace(':root {', ':root[data-theme="dark"] {')}`;
  }
  const fontLinks = (compiled.resources?.fontStylesheets ?? [])
    .map((href) => `  <link rel="stylesheet" href="${href}">`)
    .join('\n');
  const summary = {
    schemaVersion: 1,
    mode: 'core',
    declared: [],
    includedModules: [],
    externalResources: [],
    versions: { cookiebite: pkg.version },
  };
  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <script type="application/json" id="cookiebite-theme">
${CookiebiteTheme.escapeJsonForHtml(JSON.stringify(theme))}
  </script>
  <!-- COOKIEBITE:USE -->
  <style id="cookiebite-theme-css">
${themeCss}
  </style>
${fontLinks}
  <style id="cookiebite-core-css">
${CORE_CSS}
  </style>
</head>
<body>
${markup}
<script id="cookiebite-core-js">
${CORE_JS}
</script>
<script type="application/json" id="cookiebite-dependency-summary">
${JSON.stringify(summary)}
</script>
</body>
</html>
`;
}
