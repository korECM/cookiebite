import { build } from 'esbuild';
import path from 'node:path';
import { createAtAliasPlugin, pkgRoot, resolveReactNodeModules } from './render.mjs';

/**
 * Browser hydration IIFE. Sets window.__COOKIEBITE_HYDRATED__ on success,
 * __COOKIEBITE_HYDRATION_ERROR__ on sync throw, and pushes recoverable
 * hydration issues into __COOKIEBITE_HYDRATION_WARNINGS__ (Task 10 verify).
 */
export async function buildClientBundle(tsxPath) {
  const absolute = path.resolve(tsxPath);
  const reportDir = path.dirname(absolute);

  const entry = [
    `import App from ${JSON.stringify(absolute)};`,
    `import { createElement } from 'react';`,
    `import { hydrateRoot } from 'react-dom/client';`,
    `window.__COOKIEBITE_HYDRATION_WARNINGS__ = window.__COOKIEBITE_HYDRATION_WARNINGS__ || [];`,
    `try {`,
    `  hydrateRoot(document.getElementById('root'), createElement(App), {`,
    `    onRecoverableError(error) {`,
    `      window.__COOKIEBITE_HYDRATION_WARNINGS__.push(String(error));`,
    `    },`,
    `  });`,
    `  window.__COOKIEBITE_HYDRATED__ = true;`,
    `} catch (e) {`,
    `  window.__COOKIEBITE_HYDRATION_ERROR__ = String(e);`,
    `}`,
  ].join('\n');

  const result = await build({
    // resolveDir=pkgRoot: 패키지 밖 리포트도 react-dom을 pkg에서 찾게 한다.
    // @/ alias는 createAtAliasPlugin이 절대경로로 해석한다.
    stdin: { contents: entry, resolveDir: pkgRoot, loader: 'js' },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    minify: true,
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
  });

  const js = result.outputFiles?.[0]?.text;
  if (!js) throw new Error(`buildClientBundle: empty output for ${tsxPath}`);
  return { js };
}
