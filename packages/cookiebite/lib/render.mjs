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

/**
 * SSR/클라이언트 번들 공통 — 리포트 로컬 node_modules(있으면) → 패키지 deps.
 * @param {string} [reportDir]
 */
export function resolveNodeModulesPaths(reportDir) {
  const paths = [];
  if (reportDir) {
    const localNm = path.join(reportDir, 'node_modules');
    if (existsSync(localNm)) paths.push(localNm);
  }
  const pkgNm = path.join(pkgRoot, 'node_modules');
  paths.push(pkgNm);
  const reactNm = resolveReactNodeModules();
  if (reactNm !== pkgNm) paths.push(reactNm);
  return paths;
}

export class BuildError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BuildError';
  }
}

const AT_EXTS = ['.tsx', '.ts', '.jsx', '.js'];

/** `<base>` 또는 `<base>/index.*` 후보를 확장자 순으로 찾는다. */
function resolveAtCandidate(base) {
  for (const ext of AT_EXTS) {
    const candidate = `${base}${ext}`;
    if (existsSync(candidate)) return candidate;
  }
  for (const ext of AT_EXTS) {
    const candidate = path.join(base, `index${ext}`);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * `@/<path>` → (1) `<reportDir>/<path>`, (2) 내장 특수 매핑
 * (`@/components/ui/*`→`src/ui/*`, `@/lib/*`→`src/lib/*`).
 */
export function createAtAliasPlugin(reportDir) {
  return {
    name: 'cookiebite-at-alias',
    setup(b) {
      b.onResolve({ filter: /^@\// }, (args) => {
        const rest = args.path.slice(2); // strip "@/"
        const localHit = resolveAtCandidate(path.join(reportDir, rest));
        if (localHit) return { path: localHit };

        const uiMatch = /^components\/ui\/(.+)$/.exec(rest);
        if (uiMatch) {
          const pkgHit = resolveAtCandidate(path.join(pkgRoot, 'src', 'ui', uiMatch[1]));
          if (pkgHit) return { path: pkgHit };
        }
        const libMatch = /^lib\/(.+)$/.exec(rest);
        if (libMatch) {
          const pkgHit = resolveAtCandidate(path.join(pkgRoot, 'src', 'lib', libMatch[1]));
          if (pkgHit) return { path: pkgHit };
        }

        return {
          errors: [
            {
              text:
                `Cannot resolve "${args.path}". ` +
                '@/ paths resolve report-local first (<reportDir>/<path>), ' +
                'then built-in @/components/ui/* → src/ui/* and @/lib/* → src/lib/*.',
            },
          ],
        };
      });
    },
  };
}

/** bare `cookiebite` / `cookiebite/v3` → shell 표면 (src/index.ts). */
export function cookiebiteAliases() {
  const entry = path.join(pkgRoot, 'src/index.ts');
  return {
    'cookiebite/themes': path.join(pkgRoot, 'src/themes.ts'),
    'cookiebite/v3': entry,
    cookiebite: entry,
  };
}

function sharedEsbuildOptions(absolute) {
  const reportDir = path.dirname(absolute);
  return {
    bundle: true,
    jsx: 'automatic',
    nodePaths: resolveNodeModulesPaths(reportDir),
    plugins: [createAtAliasPlugin(reportDir)],
    alias: cookiebiteAliases(),
    define: {
      'process.env.NODE_ENV': '"production"',
      __COOKIEBITE_PKG_ROOT__: JSON.stringify(pkgRoot),
    },
    logLevel: 'silent',
  };
}

/**
 * SSR 렌더 (v3 component-only).
 * @returns {{ markup: string, theme: object | null }}
 */
export async function renderReport(reportPath) {
  const absolute = path.resolve(reportPath);
  const entry = [
    `import * as mod from ${JSON.stringify(absolute)};`,
    "import { createElement } from 'react';",
    "import { renderToStaticMarkup } from 'react-dom/server';",
    'const App = mod.default;',
    "if (typeof App !== 'function') {",
    "  throw new Error('default export must be a React component');",
    '}',
    'const markup = renderToStaticMarkup(createElement(App));',
    'export { markup };',
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
    return { markup: mod.markup, theme: mod.theme };
  } catch (error) {
    const msg = error?.message ?? String(error);
    if (msg.includes('default export must be a React component')) {
      throw new BuildError(`${reportPath}: default export must be a React component`);
    }
    throw error;
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}

export { pkgRoot };
