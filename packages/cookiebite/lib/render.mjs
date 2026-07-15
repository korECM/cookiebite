import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function resolveReactNodeModules() {
  try {
    // flat install에서는 react가 상위 node_modules에 있다 — pkgRoot/node_modules 하드코딩은 비어 있다.
    const pkgRequire = createRequire(path.join(pkgRoot, 'package.json'));
    return path.dirname(path.dirname(pkgRequire.resolve('react/package.json')));
  } catch {
    return path.join(pkgRoot, 'node_modules');
  }
}

export class BuildError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BuildError';
  }
}

/**
 * `@/components/ui/<name>` · `@/lib/<name>` → (1) 리포트 디렉토리 로컬 파일, (2) 패키지 src.
 * 그 외 `@/…`는 빌드 에러.
 */
export function createAtAliasPlugin(reportDir) {
  return {
    name: 'cookiebite-at-alias',
    setup(b) {
      b.onResolve({ filter: /^@\// }, (args) => {
        const rest = args.path.slice(2); // strip "@/"
        const uiMatch = /^components\/ui\/([^/]+)$/.exec(rest);
        const libMatch = /^lib\/([^/]+)$/.exec(rest);

        if (!uiMatch && !libMatch) {
          return {
            errors: [
              {
                text:
                  `Unsupported path alias "${args.path}". ` +
                  'Supported prefixes: @/components/ui/*, @/lib/*',
              },
            ],
          };
        }

        const name = uiMatch ? uiMatch[1] : libMatch[1];
        const localBase = uiMatch
          ? path.join(reportDir, 'components', 'ui', name)
          : path.join(reportDir, 'lib', name);
        const pkgBase = uiMatch
          ? path.join(pkgRoot, 'src', 'ui', name)
          : path.join(pkgRoot, 'src', 'lib', name);

        for (const base of [localBase, pkgBase]) {
          for (const ext of ['.tsx', '.ts']) {
            const candidate = `${base}${ext}`;
            if (existsSync(candidate)) return { path: candidate };
          }
        }

        return {
          errors: [{ text: `Cannot resolve "${args.path}" (no local or package file)` }],
        };
      });
    },
  };
}

function sharedEsbuildOptions(absolute) {
  const reportDir = path.dirname(absolute);
  return {
    bundle: true,
    jsx: 'automatic',
    nodePaths: [resolveReactNodeModules()],
    plugins: [createAtAliasPlugin(reportDir)],
    alias: {
      'cookiebite/themes': path.join(pkgRoot, 'src/themes.ts'),
      cookiebite: path.join(pkgRoot, 'src/index.ts'),
    },
    define: {
      'process.env.NODE_ENV': '"production"',
      __COOKIEBITE_PKG_ROOT__: JSON.stringify(pkgRoot),
    },
    logLevel: 'silent',
  };
}

/**
 * SSR 렌더.
 * - v3: default export가 컴포넌트(function)면 `{ markup, theme }` (`theme` = optional `__theme`, else null)
 * - legacy: default export가 `<Report>` 엘리먼트면 `{ markup, theme, title, lang, collected }`
 *   (build.mjs / 기존 테스트가 Task 7 컷오버 전까지 이 경로를 쓴다)
 */
export async function renderReport(reportPath) {
  const absolute = path.resolve(reportPath);
  const entry = [
    `import * as mod from ${JSON.stringify(absolute)};`,
    "import { createElement } from 'react';",
    "import { renderToStaticMarkup } from 'react-dom/server';",
    "import { resetCollected, getCollected } from 'cookiebite';",
    'const App = mod.default;',
    "const isComponent = typeof App === 'function';",
    'let displayName = null;',
    'let props = null;',
    'let markup = null;',
    'let collected = null;',
    'if (isComponent) {',
    '  markup = renderToStaticMarkup(createElement(App));',
    '} else {',
    '  resetCollected();',
    "  displayName = App?.type?.displayName ?? null;",
    '  props = App?.props ?? null;',
    "  markup = displayName === 'CookiebiteReport' ? renderToStaticMarkup(App) : null;",
    '  collected = markup === null ? null : getCollected();',
    '}',
    'export { displayName, props, markup, collected, isComponent };',
    'export const theme = mod.__theme ?? null;',
  ].join('\n');

  const outDir = mkdtempSync(path.join(tmpdir(), 'cookiebite-'));
  const outfile = path.join(outDir, 'report.mjs');
  try {
    await build({
      ...sharedEsbuildOptions(absolute),
      // resolveDir=pkgRoot: 패키지 밖(tmp) 리포트도 react-dom을 pkg에서 찾게 한다.
      stdin: { contents: entry, resolveDir: pkgRoot, loader: 'js' },
      format: 'esm',
      platform: 'node',
      banner: {
        js: "import { createRequire as __cbCreateRequire } from 'node:module';\nconst require = __cbCreateRequire(import.meta.url);",
      },
      outfile,
    });
    const mod = await import(pathToFileURL(outfile).href);

    if (mod.isComponent) {
      return { markup: mod.markup, theme: mod.theme };
    }

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

export { pkgRoot };
