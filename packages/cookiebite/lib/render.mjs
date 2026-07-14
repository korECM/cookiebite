import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function resolveReactNodeModules() {
  try {
    // flat install에서는 react가 상위 node_modules에 있다 — pkgRoot/node_modules 하드코딩은 비어 있다.
    const pkgRequire = createRequire(path.join(pkgRoot, 'package.json'));
    return path.dirname(path.dirname(pkgRequire.resolve('react/package.json')));
  } catch {
    return path.join(pkgRoot, 'node_modules');
  }
}

export class BuildError extends Error {}

export async function renderReport(reportPath) {
  const absolute = path.resolve(reportPath);
  const entry = [
    `import element from ${JSON.stringify(absolute)};`,
    "import { renderToStaticMarkup } from 'react-dom/server';",
    "import { resetCollected, getCollected } from 'cookiebite';",
    'resetCollected();',
    'export const displayName = element?.type?.displayName ?? null;',
    'export const props = element?.props ?? null;',
    "export const markup = displayName === 'CookiebiteReport' ? renderToStaticMarkup(element) : null;",
    'export const collected = markup === null ? null : getCollected();',
  ].join('\n');

  const outDir = mkdtempSync(path.join(tmpdir(), 'cookiebite-'));
  const outfile = path.join(outDir, 'report.mjs');
  try {
    await build({
      stdin: { contents: entry, resolveDir: pkgRoot, loader: 'js' },
      bundle: true,
      format: 'esm',
      platform: 'node',
      jsx: 'automatic',
      nodePaths: [resolveReactNodeModules()], // 패키지 밖에 있는 리포트도 react를 찾게 한다
      alias: {
        'cookiebite/themes': path.join(pkgRoot, 'src/themes.ts'),
        cookiebite: path.join(pkgRoot, 'src/index.ts'),
      },
      // chart-compile이 번들되면 import.meta.url이 outfile을 가리킨다.
      // 패키지 루트를 주입해 flint-chart / theme-compiler resolve를 유지한다.
      define: {
        'process.env.NODE_ENV': '"production"',
        __COOKIEBITE_PKG_ROOT__: JSON.stringify(pkgRoot),
      },
      banner: {
        js: "import { createRequire as __cbCreateRequire } from 'node:module';\nconst require = __cbCreateRequire(import.meta.url);",
      },
      outfile,
      logLevel: 'silent',
    });
    const mod = await import(pathToFileURL(outfile).href);
    if (mod.displayName !== 'CookiebiteReport') {
      throw new BuildError(
        `${reportPath}: default export가 <Report> 엘리먼트가 아닙니다. ` +
          'export default (<Report theme={...} title="...">...</Report>) 형태여야 합니다.',
      );
    }
    const { theme, title, lang = 'ko' } = mod.props;
    return { markup: mod.markup, theme, title, lang, collected: mod.collected };
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}
